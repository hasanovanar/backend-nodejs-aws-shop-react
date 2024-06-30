import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { S3Event, Context, Callback } from "aws-lambda";
import { handler } from "../lambda/importFileParser";
import csvParser from "csv-parser";
import { Readable } from "stream";
import { IncomingMessage } from "http";
import { SdkStreamMixin } from "@aws-sdk/types";

// Mock the S3 client
const s3Mock = mockClient(S3Client);

// Mock csv-parser
jest.mock("csv-parser", () =>
  jest.fn(() => Readable.from(["name,age\nJohn,30\nDoe,40"]))
);

// Helper function to create a mock S3Event
const createS3Event = (bucket: string, key: string): S3Event =>
  ({
    Records: [
      {
        s3: {
          bucket: { name: bucket },
          object: { key: key },
        },
      },
    ],
  } as S3Event);

describe("importFileParser Lambda Function", () => {
  const bucketName = "test-bucket";
  const key = "uploaded/test.csv";

  beforeEach(() => {
    s3Mock.reset();
  });

  it("should process the CSV file and move it to the parsed folder", async () => {
    // Create a mock Body stream that satisfies SdkStreamMixin
    const bodyStream = new Readable({
      read() {
        this.push("name,age\nJohn,30\nDoe,40");
        this.push(null);
      },
    }) as unknown as IncomingMessage & SdkStreamMixin;

    bodyStream.transformToByteArray = jest.fn();
    bodyStream.transformToString = jest.fn();
    bodyStream.transformToWebStream = jest.fn();

    // Mock GetObjectCommand response
    s3Mock.on(GetObjectCommand).resolves({
      Body: bodyStream,
    });

    // Mock CopyObjectCommand and DeleteObjectCommand
    s3Mock.on(CopyObjectCommand).resolves({});
    s3Mock.on(DeleteObjectCommand).resolves({});

    const event = createS3Event(bucketName, key);
    const context: Context = {} as Context;
    const callback: Callback = () => {};

    await handler(event, context, callback);

    // Verify GetObjectCommand was called
    expect(s3Mock.commandCalls(GetObjectCommand)).toHaveLength(1);
    expect(
      s3Mock.commandCalls(GetObjectCommand, {
        Bucket: bucketName,
        Key: key,
      })
    ).toHaveLength(1);

    // Verify CopyObjectCommand was called
    expect(s3Mock.commandCalls(CopyObjectCommand)).toHaveLength(1);
    expect(
      s3Mock.commandCalls(CopyObjectCommand, {
        Bucket: bucketName,
        CopySource: `${bucketName}/${key}`,
        Key: key.replace("uploaded/", "parsed/"),
      })
    ).toHaveLength(1);

    // Verify DeleteObjectCommand was called
    expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(1);
    expect(
      s3Mock.commandCalls(DeleteObjectCommand, {
        Bucket: bucketName,
        Key: key,
      })
    ).toHaveLength(1);
  });
});
