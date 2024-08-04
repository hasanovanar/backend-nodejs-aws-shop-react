import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

export class NestjsCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the Lambda function
    const nestLambda = new lambda.Function(this, "NestLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "lambda.handler",
      code: lambda.Code.fromAsset("../nodejs-aws-cart-api/dist"),
    });

    // Define API Gateway to trigger the Lambda function
    const api = new apigateway.RestApi(this, "Api", {
      deployOptions: {
        stageName: "prod",
      },
    });

    api.root.addProxy({
      defaultIntegration: new apigateway.LambdaIntegration(nestLambda, {
        proxy: true,
      }),
    });
  }
}
