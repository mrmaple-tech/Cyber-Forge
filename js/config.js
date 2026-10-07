/*
 * CyberForge public runtime configuration.
 * ONLY public values belong here. Never put secrets, service-role keys or
 * AI provider keys in frontend code. See SECURITY.md.
 */
window.CF_CONFIG = {
  backend: 'local',          // 'local' (localStorage) | 'supabase' (future)
  supabaseUrl: '',           // e.g. https://xyzcompany.supabase.co  (public)
  supabaseAnonKey: '',       // public anon key only; protected by Row Level Security
  mentorEndpoint: '',        // future: URL of YOUR backend proxy for the AI mentor
  storageKey: 'cyberforge.v1'
};
