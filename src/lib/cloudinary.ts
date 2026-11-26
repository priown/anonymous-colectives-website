const cloudName = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '').trim()
const uploadPreset = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '').trim()

export const isCloudinaryConfigured = Boolean(cloudName && uploadPreset)

/**
 * Uses Cloudinary's unsigned upload endpoint. Only the cloud name and unsigned
 * preset are exposed to the browser; never put an API secret here.
 */
export async function uploadImageToCloudinary(dataUrl: string): Promise<string> {
  if (!isCloudinaryConfigured) {
    throw new Error(
      'Cloudinary is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.',
    )
  }

  const body = new FormData()
  body.append('file', dataUrl)
  body.append('upload_preset', uploadPreset)
  body.append('folder', 'anonymous-collectives/products')

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body },
  )

  if (!response.ok) {
    let message = 'Cloudinary image upload failed.'
    try {
      const error = (await response.json()) as { error?: { message?: string } }
      message = error.error?.message || message
    } catch {
      /* keep the generic message */
    }
    throw new Error(message)
  }

  const result = (await response.json()) as { secure_url?: string }
  if (!result.secure_url) throw new Error('Cloudinary did not return an image URL.')
  return result.secure_url
}
