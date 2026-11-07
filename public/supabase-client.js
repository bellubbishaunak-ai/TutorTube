// TutorTube uses Supabase's browser-safe publishable key.
// Never put a Supabase secret/service-role key in this file.
(function () {
  const SUPABASE_URL = 'https://putbfrjnxhuoquzgcfio.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_jjXvND4PHh4BYHLzGC_Lrg_2ylrcbGe';

  window.tutorSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
})();
