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
}