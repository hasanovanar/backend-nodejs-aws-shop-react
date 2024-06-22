import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME!;
const STOCKS_TABLE_NAME = process.env.STOCKS_TABLE_NAME!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
  };

  const productId = event.pathParameters?.productId;
  /*
  if (!productId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Product ID is required" }),
      headers,
    };
  }*/

  try {
    // Fetch product from the products table
    const productResult = await ddbDocClient.send(
      new GetCommand({
        TableName: PRODUCTS_TABLE_NAME,
        Key: { id: productId },
      })
    );

    const product = productResult.Item;

    if (!product) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Product not found" }),
        headers,
      };
    }

    // Fetch stock for the product from the stocks table
    const stockResult = await ddbDocClient.send(
      new GetCommand({
        TableName: STOCKS_TABLE_NAME,
        Key: { product_id: productId },
      })
    );

    const stock = stockResult.Item;

    // Combine product and stock data
    const response = {
      id: productId,
      count: stock?.count,
      price: product.price,
      title: product.title,
      description: product.description,
    };

    return {
      statusCode: 200,
      body: JSON.stringify(response),
      headers,
    };
  } catch (error) {
    console.error("Error fetching product or stock:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
      headers,
    };
  }
};
