/*
 * CyberForge data service.
 *
 * All persistence goes through CF.db so the storage backend can be swapped
 * without touching UI code. Today: localStorage. Future: Supabase.
 *
 * SUPABASE (future) — implement the same interface as `local` below:
 *   1. Load @supabase/supabase-js from a pinned CDN URL (and add it to the CSP).
 *   2. createClient(CF_CONFIG.supabaseUrl, CF_CONFIG.supabaseAnonKey)  // PUBLIC anon key only
 *   3. Enforce authorization with Row Level Security (see supabase/schema.sql).
 *   4. NEVER ship a service-role key or any secret in frontend code.
 * XP and badge awards should ultimately be computed server-side (Edge Function / RPC)
 * so progress cannot be forged from the browser console.
 */
(function () {
  'use strict';
  const CF = (window.CF = window.CF || {});
  const cfg = window.CF_CONFIG || {};
  const KEY = cfg.storageKey || 'cyberforge.v1';
  const CUSTOM_KEY = KEY + '.custom';

  function read(key) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; }
  }

  const local = {
    name: 'localStorage',
    loadState: () => read(KEY),
    saveState: (s) => write(KEY, s),
    clearState: () => { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } },
    customAll: () => { const c = read(CUSTOM_KEY); return c && typeof c === 'object' ? c : {}; },
    customList: (kind) => { const a = local.customAll()[kind]; return Array.isArray(a) ? a : []; },
    customAdd: (kind, item) => { const all = local.customAll(); all[kind] = (all[kind] || []).concat([item]); return write(CUSTOM_KEY, all); },
    customRemove: (kind, id) => { const all = local.customAll(); all[kind] = (all[kind] || []).filter((x) => x.id !== id); return write(CUSTOM_KEY, all); },
    customClear: () => { try { localStorage.removeItem(CUSTOM_KEY); } catch (e) { /* ignore */ } }
  };

  // Placeholder for the future adapter. Intentionally not active.
  const supabaseStub = null;

  CF.db = cfg.backend === 'supabase' && supabaseStub ? supabaseStub : local;
})();
