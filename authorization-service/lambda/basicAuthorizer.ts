import {
  APIGatewayTokenAuthorizerEvent,
  Context,
  Callback,
  APIGatewayAuthorizerResult,
} from "aws-lambda";

// import * as dotenv from "dotenv";

// dotenv.config();

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent,
  context: Context,
  callback: Callback<APIGatewayAuthorizerResult>
) => {
  console.log("Event: ", JSON.stringify(event, null, 2));
  console.log("Context: ", JSON.stringify(context, null, 2));

  const authorizationToken = event.authorizationToken;

  if (!authorizationToken || authorizationToken.split(" ")[1] === "null") {
    console.log("No authorization token provided or token is null.");
    callback("Unauthorized", undefined);
    return;
  }

  const encodedCredentials = authorizationToken.split(" ")[1];
  const decodedCredentials = Buffer.from(encodedCredentials, "base64").toString(
    "utf-8"
  );
  const [username, password] = decodedCredentials.split("=");

  console.log("Decoded Credentials: ", { username, password });

  const validUsername = process.env.GITHUB_ACCOUNT_LOGIN;
  const validPassword = process.env.PASSWORD;

  const methodArn = event.methodArn;

  if (username === validUsername && password === validPassword) {
    callback(null, generatePolicy(username, "Allow", methodArn));
  } else {
    callback(null, generatePolicy(username, "Deny", methodArn));
  }
};

const generatePolicy = (
  principalId: string,
  effect: "Allow" | "Deny",
  resource: string
) => {
  const policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "execute-api:Invoke",
        Effect: effect,
        Resource: resource,
      },
    ],
  };

  return {
    principalId,
    policyDocument: policy,
  };
};
