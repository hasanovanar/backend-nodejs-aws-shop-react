import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { mockProducts } from "./mockData/mockProducts";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
  };
  const productId = event.pathParameters?.productId;

  if (!productId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Product ID is required" }),
      headers,
    };
  }

  const product = mockProducts.find((p) => p.id === productId);

  if (!product) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "Product not found" }),
      headers,
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(product),
    headers,
  };
};
