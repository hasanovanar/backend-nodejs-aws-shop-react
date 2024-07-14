import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
// import * as dotenv from "dotenv";

// dotenv.config();

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const basicAuthorizer = new lambda.Function(this, "basicAuthorizer", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "basicAuthorizer.handler",
      code: lambda.Code.fromAsset("lambda"),
      environment: {
        GITHUB_ACCOUNT_LOGIN: process.env.GITHUB_ACCOUNT_LOGIN || "",
        PASSWORD: process.env.PASSWORD || "",
        API_ID: process.env.API_ID || "",
      },
    });
    // Export the basicAuthorizer Lambda function ARN
    new cdk.CfnOutput(this, "BasicAuthorizerLambdaArn", {
      value: basicAuthorizer.functionArn,
      exportName: "BasicAuthorizerLambdaArn",
    });

    basicAuthorizer.addPermission("ApiGatewayInvokePermission", {
      principal: new iam.ServicePrincipal("apigateway.amazonaws.com"),
      action: "lambda:InvokeFunction",
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${process.env.API_ID}/*/*`,
    });
  }
}
