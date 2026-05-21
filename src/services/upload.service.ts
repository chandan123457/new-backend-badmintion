import { cloudinary } from '../lib/cloudinary';

export async function uploadStudentPhoto(dataUri: string) {
  const uploadResult = await cloudinary.uploader.upload(dataUri, {
    folder: 'shuttlepro/students'
  });

  return {
    secureUrl: uploadResult.secure_url,
    publicId: uploadResult.public_id
  };
}
