import { S3Event, S3Handler } from "aws-lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import csvParser from "csv-parser";
import { Readable } from "stream";

const s3 = new S3Client({ region: "us-east-1" });

export const handler: S3Handler = async (event: S3Event) => {
  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;

  const params = {
    Bucket: bucket,
    Key: key,
  };

  const command = new GetObjectCommand(params);
  const { Body } = await s3.send(command);

  if (Body instanceof Readable) {
    Body.pipe(csvParser())
      .on("data", (data: any) => console.log(data))
      .on("end", () => console.log("CSV file processed successfully."));
  } else {
    console.error("Body is not a Readable stream");
  }
};
