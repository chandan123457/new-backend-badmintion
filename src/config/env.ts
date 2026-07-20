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
    FAST2SMS_ENTITY_ID: z.string().min(1).optional(),
    FAST2SMS_WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),
    FAST2SMS_WHATSAPP_PAYMENT_MESSAGE_ID: z.string().min(1).optional(),
    FAST2SMS_WHATSAPP_PAYMENT_CONFIRM_MESSAGE_ID: z.string().min(1).optional(),
    PAYMENT_QR_IMAGE_URL: z.string().url().optional(),
    // When set, a dynamic UPI QR (with the exact fee pre-filled) is generated
    // per payment instead of using the static PAYMENT_QR_IMAGE_URL.
    PAYMENT_UPI_ID: z.string().min(3).optional(),
    PAYMENT_UPI_PAYEE_NAME: z.string().min(1).default('Rishi Badminton Academy'),
    // Merchant category code (mc) from a PhonePe/UPI merchant QR. When set, the
    // generated QR carries merchant params so UPI apps treat it as a verified
    // merchant QR (exempt from the ₹2000 gallery-scan cap on personal payees).
    PAYMENT_UPI_MERCHANT_CODE: z.string().min(1).optional()
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
