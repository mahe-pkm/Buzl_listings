'use server';

import { createClient, getSessionUser } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, getMediaPublicUrl } from '@/lib/media-utils';

export { getMediaPublicUrl };

export async function uploadBusinessMedia(
  businessId: string,
  role: 'logo' | 'cover' | 'gallery' | 'product',
  formData: FormData
): Promise<{ success: boolean; error?: string; storagePath?: string; publicUrl?: string; mediaId?: string }> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: 'Authentication required' };
  }

  const supabase = await createClient();

  // Check authorization
  if (!user.isAdmin) {
    const { data: manager } = await supabase
      .from('business_managers')
      .select('business_id')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!manager) {
      return { success: false, error: 'Not authorized to manage media for this business' };
    }
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return { success: false, error: 'No file provided' };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { success: false, error: `Invalid image type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}` };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: 'File size exceeds maximum limit of 5 MB' };
  }

  const caption = (formData.get('caption') as string) || null;
  const sortOrder = parseInt((formData.get('sort_order') as string) || '0', 10);

  // Derive file extension
  const extMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
  };
  const ext = extMap[file.type] || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
  const storagePath = `${businessId}/${role}/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from('business-media')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return { success: false, error: `Storage upload failed: ${uploadError.message}` };
  }

  const publicUrl = getMediaPublicUrl(storagePath) || '';

  // If role is 'product', return path for product attachment without creating business_media row
  if (role === 'product') {
    return { success: true, storagePath, publicUrl };
  }

  // If role is logo or cover, remove previous media entry of that kind
  if (role === 'logo' || role === 'cover') {
    const { data: existing } = await supabase
      .from('business_media')
      .select('id, storage_path')
      .eq('business_id', businessId)
      .eq('kind', role)
      .maybeSingle();

    if (existing) {
      await supabase.from('business_media').delete().eq('id', existing.id);
      await supabase.storage.from('business-media').remove([existing.storage_path]);
    }
  }

  // Insert into business_media
  const { data: mediaRow, error: insertError } = await supabase
    .from('business_media')
    .insert({
      business_id: businessId,
      kind: role,
      storage_path: storagePath,
      mime_type: file.type,
      byte_size: file.size,
      sort_order: sortOrder,
      caption: caption ? caption.slice(0, 200) : null,
    })
    .select('id')
    .single();

  if (insertError) {
    return { success: false, error: `Database insert failed: ${insertError.message}` };
  }

  revalidatePath(`/dashboard/businesses/${businessId}/edit`);
  return {
    success: true,
    storagePath,
    publicUrl,
    mediaId: mediaRow?.id,
  };
}

export async function deleteBusinessMedia(
  businessId: string,
  mediaId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: 'Authentication required' };
  }

  const supabase = await createClient();

  if (!user.isAdmin) {
    const { data: manager } = await supabase
      .from('business_managers')
      .select('business_id')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!manager) {
      return { success: false, error: 'Not authorized to manage media for this business' };
    }
  }

  const { data: mediaRow } = await supabase
    .from('business_media')
    .select('id, storage_path')
    .eq('id', mediaId)
    .eq('business_id', businessId)
    .maybeSingle();

  if (!mediaRow) {
    return { success: false, error: 'Media not found' };
  }

  await supabase.storage.from('business-media').remove([mediaRow.storage_path]);
  const { error } = await supabase.from('business_media').delete().eq('id', mediaId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/dashboard/businesses/${businessId}/edit`);
  return { success: true };
}

export async function reorderBusinessGallery(
  businessId: string,
  mediaIdsInOrder: string[]
): Promise<{ success: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: 'Authentication required' };
  }

  const supabase = await createClient();

  if (!user.isAdmin) {
    const { data: manager } = await supabase
      .from('business_managers')
      .select('business_id')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!manager) {
      return { success: false, error: 'Not authorized' };
    }
  }

  for (let i = 0; i < mediaIdsInOrder.length; i++) {
    await supabase
      .from('business_media')
      .update({ sort_order: i + 1 })
      .eq('id', mediaIdsInOrder[i])
      .eq('business_id', businessId);
  }

  revalidatePath(`/dashboard/businesses/${businessId}/edit`);
  return { success: true };
}
