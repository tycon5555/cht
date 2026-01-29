// Supabase Setup
const SUPABASE_URL = "https://sygyjczuagaifdinjivd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Nn-iEz0XfUV-oRwpfkXBaA_eMcdnRSM";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
