export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function getMediaPublicUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null;
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return storagePath;
  }
  // Strip leading bucket name if path accidentally contains it
  const cleanPath = storagePath.startsWith('business-media/')
    ? storagePath.replace(/^business-media\//, '')
    : storagePath;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
  return `${supabaseUrl}/storage/v1/object/public/business-media/${cleanPath}`;
}
