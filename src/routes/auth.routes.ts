import { Router } from 'express';
import { signIn } from '../controllers/auth.controller';

export const authRouter = Router();

authRouter.post('/sign-in', signIn);
