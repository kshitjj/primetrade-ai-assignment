import { S3Client } from "@aws-sdk/client-s3"

const s3 = new S3Client({
  endpoint: process.env.AWS_ENDPOINT as string,
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY as string,
    secretAccessKey: process.env.AWS_SECRET_KEY as string
  },
  forcePathStyle: true // required for MinIO
})

export default s3
