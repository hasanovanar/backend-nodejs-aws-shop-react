/*import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { mockProducts } from "./mockData/mockProducts";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    body: JSON.stringify(mockProducts),
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
    },
  };
};*/

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME!;
const STOCKS_TABLE_NAME = process.env.STOCKS_TABLE_NAME!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Received event:", JSON.stringify(event, null, 2));
  try {
    const productsData = await ddbDocClient.send(
      new ScanCommand({ TableName: PRODUCTS_TABLE_NAME })
    );
    const stocksData = await ddbDocClient.send(
      new ScanCommand({ TableName: STOCKS_TABLE_NAME })
    );

    const products = productsData.Items || [];
    const stocks = stocksData.Items || [];

    const productMap = new Map<string, any>();
    for (const product of products) {
      productMap.set(product.id, product);
    }

    const response = stocks.map((stock) => {
      const product = productMap.get(stock.product_id);
      return {
        id: stock.product_id,
        count: stock.count,
        price: product?.price,
        title: product?.title,
        description: product?.description,
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify(response),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
      },
    };
  } catch (error) {
    console.error("Error fetching products or stocks:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
      },
    };
  }
};
