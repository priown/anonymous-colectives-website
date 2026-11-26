/**
 * Public browser configuration. These values are published in the frontend by
 * design: a Supabase publishable/anon key and a Cloudinary unsigned upload
 * preset. Never add a Supabase service-role key or a Cloudinary API secret.
 */
export const PUBLIC_CONFIG = {
  supabaseUrl: "https://gltvawfuvabnzfvcmucd.supabase.co",
  supabaseAnonKey: "sb_publishable_1taARrX0DXJw3Sn97jCcAg_-V3Maif_",
  cloudinaryCloudName: "skxsjrii",
  cloudinaryUploadPreset: "anonymous_collectives",
}
