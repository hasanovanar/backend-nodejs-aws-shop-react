// lambda/basicAuthorizer.ts
import { APIGatewayProxyHandler } from "aws-lambda";
import * as dotenv from "dotenv";

dotenv.config();

export const handler: APIGatewayProxyHandler = async (event) => {
  if (!event.headers || !event.headers.Authorization) {
    return {
      statusCode: 401,
      body: "Unauthorized",
    };
  }

  const authorizationHeader = event.headers.Authorization;
  const encodedCredentials = authorizationHeader.split(" ")[1]; // Basic <base64encodedCredentials>
  const decodedCredentials = Buffer.from(encodedCredentials, "base64").toString(
    "utf-8"
  );
  const [username, password] = decodedCredentials.split(":");

  const validUsername = process.env.GITHUB_ACCOUNT_LOGIN;
  const validPassword = process.env.PASSWORD;

  if (username === validUsername && password === validPassword) {
    return {
      statusCode: 200,
      body: "Authorized",
    };
  } else {
    return {
      statusCode: 403,
      body: "Forbidden",
    };
  }
};
