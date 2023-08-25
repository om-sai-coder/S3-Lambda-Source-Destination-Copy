// Imports.
// This is the Source Account Stack.
import { Construct } from "constructs";
import {
  Stack,
  StackProps,
  aws_lambda as lambda,
  aws_s3 as s3,
  aws_iam as iam,
  aws_s3_notifications as s3_notifications,
} from "aws-cdk-lib";

export interface S3LambdaSourceDestinationCopyStackProps extends StackProps {
  deployment_environment: string;
  application_name: string;
}

export class S3LambdaSourceDestinationCopyStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: S3LambdaSourceDestinationCopyStackProps
  ) {
    super(scope, id, props);
    const deployment_environment = props.deployment_environment;
    const application_name = props.application_name;
    // Get the Existing Source Bucket in the Source Account.
    const source_bucket = s3.Bucket.fromBucketName(
      this,
      "Source_Bucket",
      "SOURCE_BUCKET_NAME" // Enter your Source Bucket Name here.
    );
    // Creating a Source Role that is Assumed by the Source Lambda Function the Allows Lambda to Publish CloudWatch Logs and Allows Read Action on Source S3 Bucket.
    const source_role = new iam.Role(
      this,
      `role-${application_name}-${deployment_environment}`,
      {
        roleName: `role-${application_name}-${deployment_environment}-01`,
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "service-role/AWSLambdaBasicExecutionRole"
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3ReadOnlyAccess"),
        ],
      }
    );
    // Creating an IAM Policy Statement that Allows Source Role Access to List the Destination Bucket.
    const source_list_access = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["s3:ListBucket"],
      resources: ["arn:aws:s3:::DESTINATION_BUCKET_NAME"], // Enter the ARN of the Destination Bucket Here.
    });
    // Adding the Above Policy Statement to the Source Role.
    source_role.addToPolicy(source_list_access);
    // Creating an IAM Policy Statement that Allows Source Role Access to Perform Actions on the Destination Bucket.
    const source_read_write_access = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "s3:DeleteObject",
        "s3:GetObject",
        "s3:PutObject",
        "s3:PutObjectAcl",
      ],
      resources: ["arn:aws:s3:::DESTINATION_BUCKET_NAME/*"], // Enter the ARN of the Destination Bucket Here.
    });
    // Adding the Above Policy Statement to the Source Role.
    source_role.addToPolicy(source_read_write_access);
    // Creating an IAM Policy Statement that Allows Source Role To Assume the Destination Account Role.
    const assume_dest_role = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["sts:AssumeRole", "iam:PassRole"],
      resources: [
        "arn:aws:iam::DESTINATION_ACCOUNT_NUMBER:role/DESTINATION_ROLE_NAME", // Enter the ARN of Destination Role.
      ],
    });
    // Adding the Above Policy Statement to the Source Role.
    source_role.addToPolicy(assume_dest_role);
    // Creating a Lambda Function in the Source Account and Attaching the Source Account Role to it.
    const testlambda = new lambda.Function(
      this,
      `lambda-${application_name}-${deployment_environment}`,
      {
        functionName: `lambda-${application_name}-${deployment_environment}-01`,
        code: lambda.Code.fromAsset("lambda"),
        handler: "index.handler",
        runtime: lambda.Runtime.NODEJS_16_X,
        role: source_role,
      }
    );
    // Configuring the Source S3 Bucket so as to trigger the Source Lambda Function whenever an Object is Created.
    const bucket_lambda_trigger = source_bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3_notifications.LambdaDestination(testlambda)
    );
  }
}
