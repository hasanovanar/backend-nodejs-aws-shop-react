/*
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3Notifications from "aws-cdk-lib/aws-s3-notifications";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Reference to the existing S3 bucket
    const bucket = s3.Bucket.fromBucketName(
      this,
      "ExistingBucket",
      "import-products-service"
    );

    // Create Lambda functions
    const importProductsFile = new lambda.Function(this, "importProductsFile", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "importProductsFile.handler",
      code: lambda.Code.fromAsset("lambda"),
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });

    const importFileParser = new lambda.Function(this, "importFileParser", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "importFileParser.handler",
      code: lambda.Code.fromAsset("lambda"),
    });

    // Grant permissions to the importProductsFile Lambda function
    bucket.grantReadWrite(importProductsFile);

    // Create an API Gateway
    const api = new apigateway.RestApi(this, "importApi", {
      restApiName: "Import Service",
    });

    const importProd = api.root.addResource("import");
    importProd.addMethod(
      "GET",
      new apigateway.LambdaIntegration(importProductsFile)
    );

    // Set up S3 event notification to trigger importFileParser Lambda function
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3Notifications.LambdaDestination(importFileParser),
      { prefix: "uploaded/" }
    );

    // Grant S3 read permissions to importFileParser Lambda function
    bucket.grantRead(importFileParser);
  }
} */

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3Notifications from "aws-cdk-lib/aws-s3-notifications";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Reference to the existing S3 bucket
    const bucket = s3.Bucket.fromBucketName(
      this,
      "ExistingBucket",
      "import-products-service"
    );

    // Create Lambda functions
    const importProductsFile = new lambda.Function(this, "importProductsFile", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "importProductsFile.handler",
      code: lambda.Code.fromAsset("lambda"),
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });

    const importFileParser = new lambda.Function(this, "importFileParser", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "importFileParser.handler",
      code: lambda.Code.fromAsset("lambda"),
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });

    // Grant permissions to the Lambda functions
    bucket.grantReadWrite(importProductsFile);
    bucket.grantReadWrite(importFileParser);

    // Create an API Gateway
    const api = new apigateway.RestApi(this, "importApi", {
      restApiName: "Import Service",
    });

    const importProd = api.root.addResource("import");
    importProd.addMethod(
      "GET",
      new apigateway.LambdaIntegration(importProductsFile)
    );

    // Set up S3 event notification to trigger importFileParser Lambda function
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3Notifications.LambdaDestination(importFileParser),
      { prefix: "uploaded/" }
    );
  }
}
