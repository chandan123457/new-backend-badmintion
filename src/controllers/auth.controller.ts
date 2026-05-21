import type { Request, Response } from 'express';
import { z } from 'zod';
import { verifyAdminCredentials } from '../services/auth.service';

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function signIn(request: Request, response: Response) {
  const parsed = signInSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      message: 'Invalid sign-in payload.'
    });
    return;
  }

  const isValid = verifyAdminCredentials(parsed.data.email, parsed.data.password);

  if (!isValid) {
    response.status(401).json({
      message: 'Invalid email or password.'
    });
    return;
  }

  response.json({
    data: {
      email: parsed.data.email
    }
  });
}
