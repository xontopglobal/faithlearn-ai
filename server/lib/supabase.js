import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://rkzfoxroilaijcdwowmg.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY; sb_publishable_kz72Bqz4E0gZoGmPw0Xrdw_wF_mvyQV

export const supabase = createClient(
    supabaseUrl,
    supabaseKey,
    {
        auth: {
            flowType: 'pkce',
            detectSessionInUrl: true,
            persistSession: true,
            autoRefreshToken: true,
        },
    }
);