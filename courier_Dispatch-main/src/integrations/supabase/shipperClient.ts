// Shipper backend client for real-time load notifications
// This connects to the shipper app's Supabase project to receive load posts
import { createClient } from '@supabase/supabase-js';

const SHIPPER_SUPABASE_URL = "https://qgrwsyxrqgravziylgdp.supabase.co";
const SHIPPER_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFncndzeXhycWdyYXZ6aXlsZ2RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMDcyMTMsImV4cCI6MjA4NDY4MzIxM30.3EWxWYgUUzpsOt-dC3o0sYyonAK9Spgbln-j9u6LAvM";

// Import the shipper client for notifications:
// import { shipperSupabase } from "@/integrations/supabase/shipperClient";

export const shipperSupabase = createClient(SHIPPER_SUPABASE_URL, SHIPPER_SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
