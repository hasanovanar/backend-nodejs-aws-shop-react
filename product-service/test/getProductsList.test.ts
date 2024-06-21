import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { handler } from "../lambda/getProductsList";
import { mockProducts } from "../lambda/mockData/mockProducts";

// Mocking APIGatewayProxyEvent
const event: APIGatewayProxyEvent = {
  body: null,
  headers: {},
  httpMethod: "GET",
  isBase64Encoded: false,
  path: "/products",
  pathParameters: null,
  queryStringParameters: null,
  stageVariables: null,
  requestContext: {
    accountId: "123456789012",
    apiId: "api-id",
    authorizer: {},
    httpMethod: "GET",
    identity: {
      accessKey: null,
      accountId: null,
      apiKey: null,
      apiKeyId: null,
      caller: null,
      clientCert: null,
      cognitoAuthenticationProvider: null,
      cognitoAuthenticationType: null,
      cognitoIdentityId: null,
      cognitoIdentityPoolId: null,
      principalOrgId: null,
      sourceIp: "127.0.0.1",
      user: null,
      userAgent: "jest-test",
      userArn: null,
    },
    path: "/products",
    protocol: "HTTP/1.1",
    requestId: "id",
    requestTimeEpoch: 1234567890,
    resourceId: "resource-id",
    resourcePath: "/products",
    stage: "prod",
  },
  resource: "",
  multiValueHeaders: {},
  multiValueQueryStringParameters: null,
};

// Custom type that ensures headers are defined
interface CustomAPIGatewayProxyResult extends APIGatewayProxyResult {
  headers: { [key: string]: string };
}

describe("getProductsList handler", () => {
  it("should return a list of products with status code 200", async () => {
    const result = (await handler(event)) as CustomAPIGatewayProxyResult;

    expect(result.statusCode).toBe(200);
    expect(result.headers["Content-Type"]).toBe("application/json");
    expect(result.headers["Access-Control-Allow-Origin"]).toBe("*");
    expect(result.headers["Access-Control-Allow-Methods"]).toBe("GET");
    expect(result.body).toBe(JSON.stringify(mockProducts));
  });
});
