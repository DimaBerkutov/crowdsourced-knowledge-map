// True only when both Supabase env vars are present. Used to degrade
// gracefully (show a setup screen) before the project is connected.
export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
