import { Router } from 'express';
import { signIn } from '../controllers/auth.controller';
import { asyncHandler } from '../lib/async-handler';

export const authRouter = Router();

authRouter.post('/sign-in', asyncHandler(signIn));
