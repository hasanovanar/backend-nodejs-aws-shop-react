import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { SQSEvent, SQSHandler } from "aws-lambda";
import { randomUUID } from "crypto";
const dynamo = new DynamoDBClient({});
const { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } = process.env;

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
    } catch (error) {
      console.error(
        "Error processing record:",
        JSON.stringify(record, null, 2),
        error
      );
    }
  }
};
