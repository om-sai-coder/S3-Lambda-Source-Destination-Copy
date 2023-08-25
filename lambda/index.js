var aws = require("aws-sdk");
const sts = new aws.STS();
const s3 = new aws.S3({ apiVersion: "2006-03-01" });
aws.config.update({ region: "REGION" }); // Enter name of REGION here.
exports.handler = async (event, context) => {
  // Get the Event whenever an Object is uploded to S3.
  console.log("Received event:", JSON.stringify(event, null, 2));
  // Name of the Destination Bucket.
  const destination_bucket = "DESTINATION_BUCKET"; // Enter name of the Destination Bucket Here.
  const source_bucket = event.Records[0].s3.bucket.name;
  const source_key = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, " ")
  );
  try {
    // Assume Role Params for the "Destination Account"
    const assumeRoleParams = {
      RoleArn: "DESTINATION_ROLE_ARN",
      RoleSessionName: "LambdaDestinationAssumedRole",
    };
    const assumeRoleResponse = await sts.assumeRole(assumeRoleParams).promise();
    // Copy Object Function
    const copyobjectparams = {
      CopySource: "/" + source_bucket + "/" + source_key,
      Bucket: destination_bucket,
      Key: source_key,
    };
    console.log(
      "Your Copy Object Params are: ",
      JSON.stringify(copyobjectparams, null, 2)
    );
    const copyresponse = await s3.copyObject(copyobjectparams).promise();
    console.log(
      "Your Copy Response is: ",
      JSON.stringify(copyresponse, null, 2)
    );
  } catch (err) {
    console.log("Error: ", JSON.stringify(err, null, 2));
  }
};
