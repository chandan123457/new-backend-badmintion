import type { Request, Response } from 'express';
import { z } from 'zod';
import { uploadStudentPhoto } from '../services/upload.service';

const uploadSchema = z.object({
  image: z.string().min(1)
});

export async function postStudentPhoto(request: Request, response: Response) {
  const parsed = uploadSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      message: 'Invalid upload payload',
      errors: parsed.error.flatten()
    });
    return;
  }

  try {
    const upload = await uploadStudentPhoto(parsed.data.image);

    response.status(201).json({
      data: upload
    });
  } catch (error) {
    console.error('Failed to upload student photo', error);
    response.status(500).json({
      message: 'Unable to upload photo right now.'
    });
  }
}
