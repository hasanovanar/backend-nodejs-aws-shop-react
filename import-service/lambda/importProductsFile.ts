// const s3 = new S3({ region: 'us-east-1' });

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
  };

  const command = new PutObjectCommand(params);
  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  return {
    statusCode: 200,
    body: JSON.stringify({ url: signedUrl }),
  };
};
