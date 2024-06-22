/*
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda function for getting the list of products
    const getProductsListLamFn = new lambda.Function(
      this,
      "getProductsListLamFn",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "getProductsList.handler",
        code: lambda.Code.fromAsset("lambda"),
      }
    );

    // Lambda function for getting a product by ID
    const getProductsByIdLamFn = new lambda.Function(
      this,
      "getProductsByIdLamFn",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "getProductsById.handler",
        code: lambda.Code.fromAsset("lambda"),
      }
    );

    // Create an API Gateway
    const api = new apigateway.RestApi(this, "productsApi", {
      restApiName: "Products Service",
    });

    // Define the /products resource
    const products = api.root.addResource("products");

    // Integrate the GET method with the Lambda function for listing products
    products.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsListLamFn)
    );

    // Define the /products/{productId} resource
    const productById = products.addResource("{productId}");

    // Integrate the GET method with the Lambda function for getting a product by ID
    productById.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsByIdLamFn)
    );
  }
} */

// import * as cdk from '@aws-cdk/core'; - This is added by Ch - need to remove
// import * as lambda from '@aws-cdk/aws-lambda';
// import * as apigateway from '@aws-cdk/aws-apigateway';

// My copy from previous code

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the names of the existing DynamoDB tables
    const productsTableName = "products";
    const stocksTableName = "stocks";

    // Create Lambda function for getProductsList
    const getProductsListLamFn = new lambda.Function(
      this,
      "getProductsListLamFn",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "getProductsList.handler",
        code: lambda.Code.fromAsset("lambda"),
        environment: {
          PRODUCTS_TABLE_NAME: productsTableName,
          STOCKS_TABLE_NAME: stocksTableName,
        },
      }
    );

    // Lambda function for getting a product by ID
    const getProductsByIdLamFn = new lambda.Function(
      this,
      "getProductsByIdLamFn",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "getProductsById.handler",
        code: lambda.Code.fromAsset("lambda"),
        environment: {
          PRODUCTS_TABLE_NAME: productsTableName,
          STOCKS_TABLE_NAME: stocksTableName,
        },
      }
    );

    // Grant read permissions to the Lambda function for both tables
    const tableArnProducts = `arn:aws:dynamodb:${this.region}:${this.account}:table/${productsTableName}`;
    const tableArnStocks = `arn:aws:dynamodb:${this.region}:${this.account}:table/${stocksTableName}`;

    getProductsListLamFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:Scan"],
        resources: [tableArnProducts, tableArnStocks],
      })
    );

    getProductsByIdLamFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:GetItem"],
        resources: [tableArnProducts, tableArnStocks],
      })
    );

    // Create API Gateway
    const api = new apigateway.RestApi(this, "product-api", {
      restApiName: "Product Service",
      description: "This service serves products.",
    });

    const products = api.root.addResource("products");
    const getProductsIntegration = new apigateway.LambdaIntegration(
      getProductsListLamFn
    );
    products.addMethod("GET", getProductsIntegration); // GET /products

    // Define the /products/{productId} resource
    const productById = products.addResource("{productId}");

    // Integrate the GET method with the Lambda function for getting a product by ID
    productById.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsByIdLamFn)
    );
  }
}
