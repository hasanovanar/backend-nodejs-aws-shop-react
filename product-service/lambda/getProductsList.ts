import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
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
};
