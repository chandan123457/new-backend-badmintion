import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1),
    PORT: z.coerce.number().default(4000),
    FRONTEND_ORIGIN: z.string().default('*'),
    ADMIN_EMAIL: z.string().email(),
    ADMIN_PASSWORD: z.string().min(1),
    CLOUDINARY_CLOUD_NAME: z.string().min(1),
    CLOUDINARY_API_KEY: z.string().min(1),
    CLOUDINARY_API_SECRET: z.string().min(1),
    FAST2SMS_API_KEY: z.string().min(1).optional(),
    FAST2SMS_ROUTE: z.enum(['q', 'dlt_manual']).default('q'),
    FAST2SMS_SENDER_ID: z.string().min(1).optional(),
    FAST2SMS_TEMPLATE_ID: z.string().min(1).optional(),
    FAST2SMS_ENTITY_ID: z.string().min(1).optional()
  })
  .superRefine((value, context) => {
    if (value.FAST2SMS_ROUTE !== 'dlt_manual') {
      return;
    }

    if (!value.FAST2SMS_SENDER_ID) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'FAST2SMS_SENDER_ID is required when FAST2SMS_ROUTE is dlt_manual',
        path: ['FAST2SMS_SENDER_ID']
      });
    }

    if (!value.FAST2SMS_TEMPLATE_ID) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'FAST2SMS_TEMPLATE_ID is required when FAST2SMS_ROUTE is dlt_manual',
        path: ['FAST2SMS_TEMPLATE_ID']
      });
    }

    if (!value.FAST2SMS_ENTITY_ID) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'FAST2SMS_ENTITY_ID is required when FAST2SMS_ROUTE is dlt_manual',
        path: ['FAST2SMS_ENTITY_ID']
      });
    }
  });

export const env = envSchema.parse(process.env);
