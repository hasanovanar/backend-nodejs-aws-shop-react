import { S3Event, S3Handler } from "aws-lambda";
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import csvParser from "csv-parser";
import { Readable } from "stream";

const s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
const sqs = new SQSClient({ region: process.env.AWS_REGION || "us-east-1" });

const { SQS_QUEUE_URL } = process.env;

export const handler: S3Handler = async (event: S3Event) => {
  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;

  const params = {
    Bucket: bucket,
    Key: key,
    ContentType: "text/csv",
  };

  const command = new GetObjectCommand(params);
  const { Body } = await s3.send(command);

  if (Body instanceof Readable) {
    await new Promise<void>((resolve, reject) => {
      Body.pipe(csvParser())
        .on("data", async (data: any) => {
          console.log("Parsed CSV record: ", data);

          const messageParams = {
            QueueUrl: SQS_QUEUE_URL,
            MessageBody: JSON.stringify(data),
          };

          try {
            const result = await sqs.send(
              new SendMessageCommand(messageParams)
            );
            console.log("Message sent to SQS: ", result.MessageId);
          } catch (error) {
            console.error("Error sending message to SQS: ", error);
          }
        })
        .on("end", async () => {
          console.log("CSV file processed successfully.");

          try {
            const newKey = key.replace("uploaded/", "parsed/");

            // Copy the file to the new location
            const copyParams = {
              Bucket: bucket,
              CopySource: `${bucket}/${key}`,
              Key: newKey,
              ContentType: "text/csv",
            };
            const copyCommand = new CopyObjectCommand(copyParams);
            await s3.send(copyCommand);

            // Delete the original file from the uploaded folder
            const deleteParams = {
              Bucket: bucket,
              Key: key,
              ContentType: "text/csv",
            };
            const deleteCommand = new DeleteObjectCommand(deleteParams);
            await s3.send(deleteCommand);

            console.log(`File copied to ${newKey} and deleted from ${key}`);
            resolve();
          } catch (error) {
            console.error("Error during file copy or delete:", error);
            reject(error);
          }
        })
        .on("error", (err) => {
          console.error("Error processing CSV file:", err);
          reject(err);
        });
    });
  } else {
    console.error("Body is not a Readable stream");
  }
};
