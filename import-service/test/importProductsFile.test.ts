import { mockClient } from "aws-sdk-client-mock";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { handler } from "../lambda/importProductsFile";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Mock the S3 client and getSignedUrl
const s3Mock = mockClient(S3Client);
jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn(),
}));

const event: APIGatewayProxyEvent = {
  body: null,
  headers: {},
  httpMethod: "GET",
  isBase64Encoded: false,
  path: "/import",
  pathParameters: null,
  queryStringParameters: { name: "test.csv" },
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
    path: "/import",
    protocol: "HTTP/1.1",
    requestId: "id",
    requestTimeEpoch: 1234567890,
    resourceId: "resource-id",
    resourcePath: "/import",
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

describe("importProductsFile Lambda Function", () => {
  const BUCKET_NAME = "test-bucket";

  beforeEach(() => {
    process.env.BUCKET_NAME = BUCKET_NAME;
    s3Mock.reset();
  });

  it("should return a signed URL", async () => {
    const signedUrl = "https://signed.url";

    (getSignedUrl as jest.Mock).mockResolvedValue(signedUrl);

    const result = (await handler(event)) as CustomAPIGatewayProxyResult;

    expect(result.statusCode).toBe(200);
    expect(result.headers["Content-Type"]).toBe("text/plain");
    expect(result.headers["Access-Control-Allow-Origin"]).toBe("*");
    expect(result.headers["Access-Control-Allow-Methods"]).toBe(
      "GET, PUT, OPTIONS, DELETE"
    );
    expect(result.body).toBe(JSON.stringify(signedUrl));
    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.any(S3Client),
      expect.any(PutObjectCommand),
      { expiresIn: 300 }
    );
  });
});
