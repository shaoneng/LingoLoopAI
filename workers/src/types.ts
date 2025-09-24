import type { Queue } from '@cloudflare/workers-types';
import type { PrismaClient } from '@prisma/client/edge';

export type Bindings = {
  AUTH_JWT_SECRET: string;
  PRISMA_ACCELERATE_URL: string;
  DATABASE_URL?: string;
  GCS_BUCKET: string;
  GCLOUD_PROJECT: string;
  GCP_CLIENT_EMAIL: string;
  GCP_PRIVATE_KEY: string;
  GEMINI_API_KEY: string;
  MAIL_FROM?: string;
  SENDGRID_API_KEY?: string;
  CORS_ORIGIN?: string;
  NEXT_PUBLIC_APP_BASE_URL?: string;
  TRANSCRIBE_QUEUE?: Queue;
};

export type Variables = {
  prisma?: PrismaClient;
  auth?: {
    userId: string;
    email?: string;
  };
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
