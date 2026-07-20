import { env } from '../config/env';

const FAST2SMS_ENDPOINT = 'https://www.fast2sms.com/dev/bulkV2';
const indianDateFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
});

export function sanitizeIndianPhoneNumber(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, '');

  if (digits.length === 10) {
    return digits;
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }

  throw new Error(`Invalid Indian mobile number: ${phoneNumber}`);
}

function buildReminderMessage(fullName: string, courseEndAt: Date) {
  const displayName = fullName.trim();
  const expiryDate = indianDateFormatter.format(courseEndAt);

  return `Dear ${displayName},\nYour badminton membership will expire on ${expiryDate}.\nPlease renew it before the expiry date to continue enjoying uninterrupted access to the academy.\n-Rishi Badminton Academy`;
}

export async function sendMembershipExpirySms({
  fullName,
  phoneNumber,
  courseEndAt
}: {
  fullName: string;
  phoneNumber: string;
  courseEndAt: Date;
}) {
  if (!env.FAST2SMS_API_KEY) {
    return;
  }

  const normalizedPhoneNumber = sanitizeIndianPhoneNumber(phoneNumber);
  const message = buildReminderMessage(fullName, courseEndAt);
  const requestBody =
    env.FAST2SMS_ROUTE === 'dlt_manual'
      ? {
          route: 'dlt_manual',
          sender_id: env.FAST2SMS_SENDER_ID,
          template_id: env.FAST2SMS_TEMPLATE_ID,
          entity_id: env.FAST2SMS_ENTITY_ID,
          message,
          numbers: normalizedPhoneNumber
        }
      : {
          route: 'q',
          language: 'english',
          message,
          numbers: normalizedPhoneNumber
        };

  const response = await fetch(FAST2SMS_ENDPOINT, {
    method: 'POST',
    headers: {
      authorization: env.FAST2SMS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`Fast2SMS request failed with status ${response.status}: ${responseText}`);
  }

  let parsedResponse: unknown = null;

  try {
    parsedResponse = JSON.parse(responseText);
  } catch {
    return;
  }

  if (
    parsedResponse &&
    typeof parsedResponse === 'object' &&
    'return' in parsedResponse &&
    parsedResponse.return === false
  ) {
    const messageText =
      'message' in parsedResponse && typeof parsedResponse.message === 'string'
        ? parsedResponse.message
        : 'Unknown Fast2SMS error';
    throw new Error(`Fast2SMS rejected the message: ${messageText}`);
  }
}
