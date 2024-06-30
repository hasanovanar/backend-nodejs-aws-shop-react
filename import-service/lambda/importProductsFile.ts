import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: "us-east-1" });

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const bucketName = process.env.BUCKET_NAME!;
  const fileName = event.queryStringParameters?.name;
  const key = `uploaded/${fileName}`;

  const params = {
    Bucket: bucketName,
    Key: key,
    ContentType: "text/csv",
  };

  const command = new PutObjectCommand(params);
  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  return {
    statusCode: 200,
    body: JSON.stringify({ url: signedUrl }),
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PUT, OPTIONS, DELETE",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  };
};
