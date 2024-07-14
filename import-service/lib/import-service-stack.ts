import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3Notifications from "aws-cdk-lib/aws-s3-notifications";
import * as iam from "aws-cdk-lib/aws-iam";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Reference to the existing S3 bucket
    const bucket = s3.Bucket.fromBucketName(
      this,
      "ExistingBucket",
      "import-products-service"
    );

    // Import the SQS Queue ARN
    const catalogItemsQueueArn = cdk.Fn.importValue("CatalogItemsQueueArn");
    const catalogItemsQueueUrl = cdk.Fn.importValue("CatalogItemsQueueUrl");

    // Import the basicAuthorizer Lambda function ARN
    const basicAuthorizerArn = cdk.Fn.importValue("BasicAuthorizerLambdaArn");

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
        SQS_QUEUE_URL: catalogItemsQueueUrl,
      },
    });

    // Grant permissions to the Lambda functions
    bucket.grantReadWrite(importProductsFile);
    bucket.grantReadWrite(importFileParser);

    // Grant permission to the importFileParser function
    importFileParser.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["sqs:SendMessage"],
        resources: [catalogItemsQueueArn],
      })
    );

    // Create an API Gateway
    const api = new apigateway.RestApi(this, "importApi", {
      restApiName: "Import Service",
    });

    const importProd = api.root.addResource("import");

    // Define the CORS options
    const corsOptions: apigateway.CorsOptions = {
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
      allowMethods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
      allowHeaders: [
        "Content-Type",
        "X-Amz-Date",
        "Authorization",
        "X-Api-Key",
        "X-Amz-Security-Token",
      ],
    };

    // Add CORS to the resource
    importProd.addCorsPreflight(corsOptions);

    // importProd.addMethod(
    //   "GET",
    //   new apigateway.LambdaIntegration(importProductsFile)
    // );

    // Create Lambda authorizer
    const authorizer = new apigateway.TokenAuthorizer(this, "basicAuthorizer", {
      handler: lambda.Function.fromFunctionArn(
        this,
        "BasicAuthorizerFunction",
        basicAuthorizerArn
      ),
    });

    // Add Lambda authorization to the /import path
    importProd.addMethod(
      "GET",
      new apigateway.LambdaIntegration(importProductsFile),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.CUSTOM,
      }
    );

    // Set up S3 event notification to trigger importFileParser Lambda function
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3Notifications.LambdaDestination(importFileParser),
      { prefix: "uploaded/" }
    );

    //Add Gateway Responses for 401 and 403 errors with CORS headers

    api.addGatewayResponse("UnauthorizedResponse", {
      type: apigateway.ResponseType.UNAUTHORIZED,
      responseHeaders: {
        "Access-Control-Allow-Origin": "'*'",
        "Access-Control-Allow-Headers": "'Content-Type,Authorization'",
        // "Access-Control-Allow-Methods": "GET, PUT, OPTIONS, DELETE",
      },
      statusCode: "401",
      templates: {
        "application/json": JSON.stringify({
          message: "Unauthorized and not allowed",
        }),
      },
    });

    api.addGatewayResponse("AccessDeniedResponse", {
      type: apigateway.ResponseType.ACCESS_DENIED,
      responseHeaders: {
        "Access-Control-Allow-Origin": "'*'",
        "Access-Control-Allow-Headers": "'Content-Type,Authorization'",
        // "Access-Control-Allow-Methods": "GET, PUT, OPTIONS, DELETE",
      },
      statusCode: "403",
      templates: {
        "application/json": JSON.stringify({ message: "Forbidden" }),
      },
    });
  }
}
