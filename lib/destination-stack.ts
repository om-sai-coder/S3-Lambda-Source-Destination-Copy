import { Construct } from "constructs";
import { Stack, StackProps, aws_s3 as s3, aws_iam as iam } from "aws-cdk-lib";

export interface LambdaTriggerS3ContentTransferDestinationStackProps
  extends StackProps {
  deployment_environment: string;
  application_name: string;
}

export class LambdaTriggerS3ContentTransferDestinationStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: LambdaTriggerS3ContentTransferDestinationStackProps
  ) {
    super(scope, id, props);
    const deployment_environment = props.deployment_environment;
    const application_name = props.application_name;
    // Creating Destination S3 Bucket.
    const destination_bucket = new s3.Bucket(
      this,
      `s3-${application_name}-${deployment_environment}`,
      {
        bucketName: "DESTINATION_BUCKET_NAME", // Give a Destination Bucket Name here.
      }
    );
    // Creating a Destination Bucket Resource Policy that Allows the Source Role to perform Actions on the Destination S3 Bucket Objects.
    const destination_bucket_policy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.ArnPrincipal("SOURCE_ACCOUNT_ROLE_ARN")], // Paste the Source Role ARN here.
      resources: ["DESTINATION_BUCKET_ARN/*"], // Enter the Destination Bucket ARN here (Objects).
      actions: [
        "s3:DeleteObject",
        "s3:GetObject",
        "s3:PutObject",
        "s3:PutObjectAcl",
      ],
    });
    // Adding the Destination Bucket Resource Policy.
    destination_bucket.addToResourcePolicy(destination_bucket_policy);
    // Creating an Role in the Destination Account that is Assumed by the Role in the Source Account.
    const destination_role = new iam.Role(
      this,
      `role-${application_name}-${deployment_environment}`,
      {
        roleName: `role-${application_name}-${deployment_environment}-01`,
        assumedBy: new iam.ArnPrincipal("SOURCE_ACCOUNT_ROLE_ARN"), // Paste the Source Role ARN here.
      }
    );
    // Creating an IAM Policy Statement that allows Source Role to List Destination Bucket.
    const list = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["s3:ListBucket"],
      resources: [destination_bucket.bucketArn],
    });
    // Creating an IAM Policy Statement that allows Source Role to Perform Actions on the Destination Bucket Objects.
    const read_write = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "s3:DeleteObject",
        "s3:GetObject",
        "s3:PutObject",
        "s3:PutObjectAcl",
      ],
      resources: ["DESTINATION_BUCKET_ARN/*"], // Destination Bucket ARN here.
    });
    // Adding the "List" IAM Policy Statement to the Destination Role.
    destination_role.addToPolicy(list);
    // Adding the "Read-Write" IAM Policy Statement to the Destination Role.
    destination_role.addToPolicy(read_write);
  }
}
