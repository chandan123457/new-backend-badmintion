import { env } from '../config/env';

export function verifyAdminCredentials(email: string, password: string) {
  return email.trim().toLowerCase() === env.ADMIN_EMAIL.trim().toLowerCase() && password === env.ADMIN_PASSWORD;
}
