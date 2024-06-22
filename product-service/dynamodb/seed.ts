import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

// Initialize the DynamoDB client
const client = new DynamoDBClient({ region: "us-east-1" });
const ddbDocClient = DynamoDBDocumentClient.from(client);

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
}

interface Stock {
  product_id: string;
  count: number;
}

// Sample data
const products: Product[] = [
  {
    id: uuidv4(),
    title: "Product DynamoDB 2",
    description: "Description for product DynamoDB 2",
    price: 400,
  },
  {
    id: uuidv4(),
    title: "Product DynamoDB 3",
    description: "Description for product DynamoDB 3",
    price: 450,
  },
  {
    id: uuidv4(),
    title: "Product DynamoDB 4",
    description: "Description for product DynamoDB 4",
    price: 500,
  },
];

const stocks: Stock[] = [
  { product_id: products[0].id, count: 3 },
  { product_id: products[1].id, count: 4 },
  { product_id: products[2].id, count: 7 },
];

async function seedProducts(): Promise<void> {
  for (const product of products) {
    const params = {
      TableName: "products",
      Item: product,
    };
    try {
      await ddbDocClient.send(new PutCommand(params));
      console.log(`Inserted product: ${product.title}`);
    } catch (err) {
      console.error(`Failed to insert product: ${product.title}`, err);
    }
  }
}

async function seedStocks(): Promise<void> {
  for (const stock of stocks) {
    const params = {
      TableName: "stocks",
      Item: stock,
    };
    try {
      await ddbDocClient.send(new PutCommand(params));
      console.log(`Inserted stock for product_id: ${stock.product_id}`);
    } catch (err) {
      console.error(
        `Failed to insert stock for product_id: ${stock.product_id}`,
        err
      );
    }
  }
}

async function main(): Promise<void> {
  await seedProducts();
  await seedStocks();
  console.log("Seeding completed.");
}

main().catch((err) => {
  console.error("Seeding failed.", err);
});