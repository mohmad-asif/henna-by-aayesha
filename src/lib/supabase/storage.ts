import { createClient as createBrowserClient } from '@/lib/supabase/client';

/**
 * Helper to upload an image to Supabase Storage 'henna-images' bucket.
 * Purely client-side safe; does not import any server headers or cookies.
 */
export async function uploadImageToStorage(
  file: File,
  folder: 'designs' | 'services' | 'gallery' = 'designs'
): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = createBrowserClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('henna-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return { error: uploadError.message };
    }

    const { data } = supabase.storage.from('henna-images').getPublicUrl(fileName);
    return { url: data.publicUrl };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown upload error';
    return { error: message };
  }
}
