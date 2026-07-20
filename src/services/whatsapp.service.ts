import { env } from '../config/env';
import { resolvePaymentQrUrl } from './payment-qr.service';
import { sanitizeIndianPhoneNumber } from './sms.service';

const FAST2SMS_WHATSAPP_ENDPOINT = 'https://www.fast2sms.com/dev/whatsapp';

// Sends one approved Fast2SMS WhatsApp template. Returns false (no-op) when the
// base WhatsApp credentials are missing, so callers never depend on it.
async function sendWhatsAppTemplate({
  messageId,
  phoneNumber,
  variablesValues,
  mediaUrl
}: {
  messageId: string;
  phoneNumber: string;
  variablesValues: string;
  mediaUrl?: string;
}) {
  if (!env.FAST2SMS_API_KEY || !env.FAST2SMS_WHATSAPP_PHONE_NUMBER_ID) {
    return;
  }

  const normalizedPhoneNumber = sanitizeIndianPhoneNumber(phoneNumber);
  const requestUrl = new URL(FAST2SMS_WHATSAPP_ENDPOINT);
  requestUrl.searchParams.set('message_id', messageId);
  requestUrl.searchParams.set('phone_number_id', env.FAST2SMS_WHATSAPP_PHONE_NUMBER_ID);
  requestUrl.searchParams.set('numbers', normalizedPhoneNumber);
  requestUrl.searchParams.set('variables_values', variablesValues);

  if (mediaUrl) {
    requestUrl.searchParams.set('media_url', mediaUrl);
  }

  const response = await fetch(requestUrl, {
    headers: {
      authorization: env.FAST2SMS_API_KEY
    }
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`Fast2SMS WhatsApp request failed with status ${response.status}: ${responseText}`);
  }

  let parsedResponse: unknown = null;

  try {
    parsedResponse = JSON.parse(responseText);
  } catch {
    return;
  }

  if (parsedResponse && typeof parsedResponse === 'object' && 'status' in parsedResponse && parsedResponse.status === false) {
    const messageText =
      'message' in parsedResponse && typeof parsedResponse.message === 'string'
        ? parsedResponse.message
        : 'Unknown Fast2SMS WhatsApp error';
    throw new Error(`Fast2SMS WhatsApp rejected the message: ${messageText}`);
  }
}

// Sends the payment QR (dynamic UPI QR or static fallback) on registration and
// reactivation. No-op until the payment template + a QR source are configured.
export async function sendPaymentQrOnWhatsApp({
  fullName,
  phoneNumber,
  monthlyFee
}: {
  fullName: string;
  phoneNumber: string;
  monthlyFee: number;
}) {
  if (!env.FAST2SMS_WHATSAPP_PAYMENT_MESSAGE_ID) {
    return;
  }

  const qrImageUrl = await resolvePaymentQrUrl(monthlyFee);

  if (!qrImageUrl) {
    return;
  }

  await sendWhatsAppTemplate({
    messageId: env.FAST2SMS_WHATSAPP_PAYMENT_MESSAGE_ID,
    phoneNumber,
    variablesValues: `${fullName.trim()}|${monthlyFee}`,
    mediaUrl: qrImageUrl
  });
}

// Sends a "payment received, access granted" confirmation when staff mark a
// student's payment as paid. No-op until the confirmation template is configured.
export async function sendPaymentConfirmationOnWhatsApp({
  fullName,
  phoneNumber,
  courseName
}: {
  fullName: string;
  phoneNumber: string;
  courseName: string;
}) {
  if (!env.FAST2SMS_WHATSAPP_PAYMENT_CONFIRM_MESSAGE_ID) {
    return;
  }

  await sendWhatsAppTemplate({
    messageId: env.FAST2SMS_WHATSAPP_PAYMENT_CONFIRM_MESSAGE_ID,
    phoneNumber,
    variablesValues: `${fullName.trim()}|${courseName.trim()}`
  });
}
