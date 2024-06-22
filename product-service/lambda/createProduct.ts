import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME!;
const STOCKS_TABLE_NAME = process.env.STOCKS_TABLE_NAME!;

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
}

interface Stock {
  product_id: string;
  count: number;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST",
  };

  try {
    const body = JSON.parse(event.body || "{}");
    const { title, description, price, count } = body;

    if (
      !title ||
      !description ||
      typeof price !== "number" ||
      typeof count !== "number"
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid product data" }),
        headers,
      };
    }

    // Generate a random UUID
    const productId = randomUUID();

    const newProduct: Product = {
      id: productId,
      title,
      description,
      price,
    };

    const newStock: Stock = {
      product_id: productId,
      count,
    };

    await Promise.all([
      ddbDocClient.send(
        new PutCommand({ TableName: PRODUCTS_TABLE_NAME, Item: newProduct })
      ),
      ddbDocClient.send(
        new PutCommand({ TableName: STOCKS_TABLE_NAME, Item: newStock })
      ),
    ]);

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Product created successfully",
        product: newProduct,
        stock: newStock,
      }),
      headers,
    };
  } catch (error) {
    console.error("Error creating product:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
      headers,
    };
  }
};
