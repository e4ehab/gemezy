import { z } from 'zod';

const cloudinarySignatureSchema = z.object({
  cloudName: z.string(),
  apiKey: z.string(),
  timestamp: z.number(),
  folder: z.string(),
  signature: z.string(),
  allowedFormats: z.string(),
});
const cloudinaryUploadSchema = z.object({ secure_url: z.string().url() });

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    throw new Error('The image upload service returned an invalid response.');
  }
}

export async function uploadProfileImage(file: File) {
  const signatureResponse = await fetch('/api/uploads/cloudinary-signature?purpose=profile', {
    method: 'POST',
  });
  const signatureResult: unknown = await readJson(signatureResponse);

  if (!signatureResponse.ok) {
    const message =
      typeof signatureResult === 'object' &&
      signatureResult !== null &&
      'error' in signatureResult &&
      typeof signatureResult.error === 'string'
        ? signatureResult.error
        : 'Could not prepare image upload.';
    throw new Error(message);
  }

  const signature = cloudinarySignatureSchema.parse(signatureResult);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signature.apiKey);
  formData.append('timestamp', String(signature.timestamp));
  formData.append('folder', signature.folder);
  formData.append('allowed_formats', signature.allowedFormats);
  formData.append('signature', signature.signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/image/upload`,
    { method: 'POST', body: formData },
  );
  const result: unknown = await readJson(response);
  if (!response.ok) {
    throw new Error('Cloudinary could not upload your profile photo. Please try again.');
  }

  return cloudinaryUploadSchema.parse(result).secure_url;
}
