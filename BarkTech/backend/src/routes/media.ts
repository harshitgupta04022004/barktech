import { FastifyInstance } from 'fastify';
import { S3Client, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';
import { authenticate } from '../middleware/auth.js';
import { z } from 'zod';

const s3 = new S3Client({
  region: env.AWS_REGION || 'us-east-005',
  endpoint: env.S3_ENDPOINT_URL,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY || '',
  },
});

function buildPublicUrl(key: string): string {
  // Backblaze B2 public URL: https://<bucket>.s3.<region>.backblazeb2.com/<key>
  if (env.S3_ENDPOINT_URL) {
    return `${env.S3_ENDPOINT_URL}/${env.S3_BUCKET}/${key}`;
  }
  return `https://${env.S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
}

const presignSchema = z.object({
  key: z.string().min(1),
  contentType: z.string().min(1),
  expiresIn: z.number().optional().default(3600),
});

export async function mediaRoutes(app: FastifyInstance) {

  // Generate presigned upload URL
  app.post('/presign', { preHandler: [authenticate] }, async (request) => {
    const body = presignSchema.parse(request.body);
    const fullKey = body.key.replace(/^\//, '');

    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: fullKey,
      ContentType: body.contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: body.expiresIn });
    const publicUrl = buildPublicUrl(fullKey);

    return {
      success: true,
      data: { uploadUrl, publicUrl, key: fullKey, expiresIn: body.expiresIn },
    };
  });

  // List files
  app.get('/list', { preHandler: [authenticate] }, async (request) => {
    const { prefix, limit } = request.query as { prefix?: string; limit?: string };

    const command = new ListObjectsV2Command({
      Bucket: env.S3_BUCKET,
      Prefix: prefix || '',
      MaxKeys: parseInt(limit || '100'),
    });

    const response = await s3.send(command);
    const objects = (response.Contents || []).map((obj) => ({
      key: obj.Key,
      size: obj.Size,
      lastModified: obj.LastModified?.toISOString(),
      publicUrl: buildPublicUrl(obj.Key!),
    }));

    return { success: true, data: objects, count: objects.length, isTruncated: response.IsTruncated };
  });

  // Check if file exists (use query param instead of wildcard)
  app.get('/exists', { preHandler: [authenticate] }, async (request) => {
    const { key } = request.query as { key: string };
    if (!key) return { success: false, error: 'key query param required' };

    try {
      await s3.send(new HeadObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
      return { success: true, exists: true, publicUrl: buildPublicUrl(key) };
    } catch (err: any) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        return { success: true, exists: false };
      }
      throw err;
    }
  });

  // Delete file (use query param instead of wildcard)
  app.delete('/file', { preHandler: [authenticate] }, async (request) => {
    const { key } = request.query as { key: string };
    if (!key) return { success: false, error: 'key query param required' };

    await s3.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
    return { success: true };
  });
}
