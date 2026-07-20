import QRCode from 'qrcode';
import { env } from '../config/env';
import { cloudinary } from '../lib/cloudinary';

// Builds a standard UPI deep link. When scanned by any UPI app (PhonePe, GPay,
// Paytm, …) it opens the payment screen with the amount pre-filled.
function buildUpiUri(amount: number) {
  if (!env.PAYMENT_UPI_ID) {
    throw new Error('PAYMENT_UPI_ID is not configured');
  }

  const params = new URLSearchParams({
    pa: env.PAYMENT_UPI_ID,
    pn: env.PAYMENT_UPI_PAYEE_NAME,
    am: String(amount),
    cu: 'INR',
    tn: `Fee payment - ${env.PAYMENT_UPI_PAYEE_NAME}`
  });

  // For a merchant account, carry the merchant params so UPI apps recognise a
  // verified-merchant QR (exempt from the ₹2000 gallery-scan cap).
  if (env.PAYMENT_UPI_MERCHANT_CODE) {
    params.set('mc', env.PAYMENT_UPI_MERCHANT_CODE);
    params.set('mode', '02');
    params.set('purpose', '00');
  }

  // UPI apps expect %20 for spaces; URLSearchParams emits + which some apps show
  // literally in the payee name / note.
  return `upi://pay?${params.toString().replace(/\+/g, '%20')}`;
}

// Generates (and caches on Cloudinary) a dynamic UPI QR image for a given fee
// amount. The Cloudinary public_id is keyed by amount, so the same fee reuses
// one stable image instead of creating a new upload per student.
export async function getDynamicPaymentQrUrl(amount: number) {
  const upiUri = buildUpiUri(amount);
  const qrDataUri = await QRCode.toDataURL(upiUri, {
    width: 600,
    margin: 2,
    errorCorrectionLevel: 'M'
  });

  // Cloudinary uploads can intermittently time out on a slow network, so retry
  // a couple of times with a generous timeout before giving up.
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const uploadResult = await cloudinary.uploader.upload(qrDataUri, {
        folder: 'shuttlepro/payment-qr',
        public_id: `upi-${amount}`,
        overwrite: true,
        timeout: 20000
      });

      return uploadResult.secure_url;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

// Resolves the QR image URL to send: a dynamic UPI QR when PAYMENT_UPI_ID is
// configured, otherwise the static PAYMENT_QR_IMAGE_URL fallback.
export async function resolvePaymentQrUrl(amount: number) {
  if (env.PAYMENT_UPI_ID) {
    return getDynamicPaymentQrUrl(amount);
  }

  return env.PAYMENT_QR_IMAGE_URL ?? null;
}
