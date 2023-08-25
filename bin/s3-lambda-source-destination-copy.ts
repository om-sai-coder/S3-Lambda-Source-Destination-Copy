#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { S3LambdaSourceDestinationCopyStack } from "../lib/s3-lambda-source-destination-copy-stack";
import { LambdaTriggerS3ContentTransferDestinationStack } from "../lib/destination-stack";

const app = new cdk.App();
// Deploy the Source Account Stack.
new S3LambdaSourceDestinationCopyStack(
  app,
  "S3LambdaSourceDestinationCopyStackSource",
  {
    deployment_environment: "sbx",
    application_name: "S3LambdaSourceStack",
    env: { account: "ACCOUNT_NUMBER", region: "REGION" }, // Source Account.
  }
);
// Deploy the Destination Account Stack.
new LambdaTriggerS3ContentTransferDestinationStack(
  app,
  "S3LambdaSourceDestinationCopyStackDestination",
  {
    deployment_environment: "sbx",
    application_name: "S3LambdaDestinationStack",
    env: { account: "ACCOUNT_NUMBER", region: "REGION" }, // Destination Account.
  }
);
