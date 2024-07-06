/*

import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { SQSEvent, SQSHandler } from "aws-lambda";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { randomUUID } from "crypto";

const dynamo = new DynamoDBClient({});
const sns = new SNSClient({});

const { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME, SNS_TOPIC_ARN } = process.env;

export const handler: SQSHandler = async (event: SQSEvent): Promise<void> => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    console.log("Processing record:", JSON.stringify(record, null, 2));

    try {
      const { description, price, title, count } = JSON.parse(record.body);

      const productId = randomUUID();

      const productItem = {
        id: { S: productId },
        description: { S: description },
        price: { N: price.toString() },
        title: { S: title },
      };

      const stockItem = {
        product_id: { S: productId },
        count: { N: count.toString() },
      };

      console.log(
        "Putting item into Products table:",
        JSON.stringify(productItem, null, 2)
      );
      await dynamo.send(
        new PutItemCommand({
          TableName: PRODUCTS_TABLE_NAME,
          Item: productItem,
        })
      );

      console.log(
        "Putting item into Stocks table:",
        JSON.stringify(stockItem, null, 2)
      );
      await dynamo.send(
        new PutItemCommand({
          TableName: STOCKS_TABLE_NAME,
          Item: stockItem,
        })
      );

      console.log(`Successfully processed record with productId ${productId}`);

      // Publish a message to the SNS topic
      const snsMessage = {
        Message: JSON.stringify({
          productId,
          description,
          price,
          title,
          count,
        }),
        TopicArn: SNS_TOPIC_ARN,
      };
      await sns.send(new PublishCommand(snsMessage));

      console.log("Message sent to SNS topic");
    } catch (error) {
      console.error(
        "Error processing record:",
        JSON.stringify(record, null, 2),
        error
      );
    }
  }
};
*/

import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { SQSEvent, SQSHandler } from "aws-lambda";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { randomUUID } from "crypto";

const dynamo = new DynamoDBClient({});
const sns = new SNSClient({});

const { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME, SNS_TOPIC_ARN } = process.env;

export const handler: SQSHandler = async (event: SQSEvent): Promise<void> => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  const allProducts: Array<{
    productId: string;
    description: string;
    price: number;
    title: string;
    count: number;
  }> = [];

  for (const record of event.Records) {
    console.log("Processing record:", JSON.stringify(record, null, 2));

    try {
      const { description, price, title, count } = JSON.parse(record.body);

      const productId = randomUUID();

      const productItem = {
        id: { S: productId },
        description: { S: description },
        price: { N: price.toString() },
        title: { S: title },
      };

      const stockItem = {
        product_id: { S: productId },
        count: { N: count.toString() },
      };

      console.log(
        "Putting item into Products table:",
        JSON.stringify(productItem, null, 2)
      );
      await dynamo.send(
        new PutItemCommand({
          TableName: PRODUCTS_TABLE_NAME,
          Item: productItem,
        })
      );

      console.log(
        "Putting item into Stocks table:",
        JSON.stringify(stockItem, null, 2)
      );
      await dynamo.send(
        new PutItemCommand({
          TableName: STOCKS_TABLE_NAME,
          Item: stockItem,
        })
      );

      console.log(`Successfully processed record with productId ${productId}`);

      // Collect the product information
      allProducts.push({ productId, description, price, title, count });
    } catch (error) {
      console.error(
        "Error processing record:",
        JSON.stringify(record, null, 2),
        error
      );
    }
  }

  if (allProducts.length > 0) {
    try {
      // Publish a message to the SNS topic with all products
      const snsMessage = {
        Message: JSON.stringify(allProducts),
        TopicArn: SNS_TOPIC_ARN,
      };
      await sns.send(new PublishCommand(snsMessage));

      console.log("Message sent to SNS topic with all products");
    } catch (error) {
      console.error("Error sending message to SNS topic:", error);
    }
  } else {
    console.log("No products to send to SNS topic");
  }
};
