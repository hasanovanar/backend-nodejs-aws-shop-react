import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as sns from "aws-cdk-lib/aws-sns";
import * as snsSubscriptions from "aws-cdk-lib/aws-sns-subscriptions";

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsTableName = "products";
    const stocksTableName = "stocks";

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

    const createProductLamFn = new lambda.Function(this, "createProductLamFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "createProduct.handler",
      code: lambda.Code.fromAsset("lambda"),
      environment: {
        PRODUCTS_TABLE_NAME: productsTableName,
        STOCKS_TABLE_NAME: stocksTableName,
      },
    });

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

    createProductLamFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:PutItem"],
        resources: [tableArnProducts, tableArnStocks],
      })
    );

    const catalogItemsQueue = new sqs.Queue(this, "catalogItemsQueue", {
      visibilityTimeout: cdk.Duration.seconds(300),
      receiveMessageWaitTime: cdk.Duration.seconds(20),
    });

    // Create SNS topic
    const createProductTopic = new sns.Topic(this, "createProductTopic", {
      displayName: "Create Product Topic",
    });

    // Create Email Subscription for the SNS topic (without filter policy)
    createProductTopic.addSubscription(
      new snsSubscriptions.EmailSubscription("anar.hasanov79@gmail.com")
    );

    // Create Email Subscription for the SNS topic (with filter policy)
    // createProductTopic.addSubscription(
    //   new snsSubscriptions.EmailSubscription("anarhasanov79@outlook.com", {
    //     filterPolicy: {
    //       count: sns.SubscriptionFilter.numericFilter({
    //         greaterThan: 40,
    //       }),
    //     },
    //   })
    // );

    const catalogBatchProcess = new lambda.Function(
      this,
      "catalogBatchProcess",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "catalogBatchProcess.handler",
        code: lambda.Code.fromAsset("lambda"),
        environment: {
          PRODUCTS_TABLE_NAME: productsTableName,
          STOCKS_TABLE_NAME: stocksTableName,
          SNS_TOPIC_ARN: createProductTopic.topicArn,
        },
      }
    );

    catalogItemsQueue.grantConsumeMessages(catalogBatchProcess);

    catalogBatchProcess.addEventSource(
      new lambdaEventSources.SqsEventSource(catalogItemsQueue, {
        batchSize: 5,
      })
    );

    catalogBatchProcess.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:PutItem"],
        resources: [tableArnProducts, tableArnStocks],
      })
    );

    // Grant publish permissions to the Lambda function
    createProductTopic.grantPublish(catalogBatchProcess);

    const api = new apigateway.RestApi(this, "product-api", {
      restApiName: "Product Service",
      description: "This service serves products.",
    });

    const products = api.root.addResource("products");
    const getProductsIntegration = new apigateway.LambdaIntegration(
      getProductsListLamFn
    );
    products.addMethod("GET", getProductsIntegration);

    const createProductIntegration = new apigateway.LambdaIntegration(
      createProductLamFn
    );
    products.addMethod("POST", createProductIntegration);

    const productById = products.addResource("{productId}");
    productById.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsByIdLamFn)
    );

    // Export the SQS Queue ARN
    new cdk.CfnOutput(this, "CatalogItemsQueueArn", {
      value: catalogItemsQueue.queueArn,
      exportName: "CatalogItemsQueueArn",
    });

    new cdk.CfnOutput(this, "CatalogItemsQueueUrl", {
      value: catalogItemsQueue.queueUrl,
      exportName: "CatalogItemsQueueUrl",
    });

    new cdk.CfnOutput(this, "CreateProductArn", {
      value: createProductTopic.topicArn,
      description: "The ARN of the SNS topic",
    });
  }
}
