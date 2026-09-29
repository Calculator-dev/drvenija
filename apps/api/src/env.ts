import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SECRET_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  BACKBLAZE_ENDPOINT: z.string().url().optional(),
  BACKBLAZE_REGION: z.string().optional(),
  BACKBLAZE_APP_KEY: z.string().optional(),
  BACKBLAZE_BUCKET_NAME: z.string().optional(),
  BACKBLAZE_KEY_ID: z.string().optional(),
  BACKBLAZE_APPLICATION_KEY: z.string().optional(),
  BACKBLAZE_BUCKET_ID: z.string().optional(),
  BACKBLAZE_PUBLIC_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().optional(),
  ORDER_EMAIL_FROM: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  throw new Error(`Invalid environment variables: ${parsed.error.issues.map((issue) => issue.path.join(".")).join(", ")}`)
}
export const env = parsed.data
