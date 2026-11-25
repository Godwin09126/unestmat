
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://wnwqnoxgckscqeovypcj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_npK3CwGIs4Y_eKh7TRgOcQ_nJc-zLC2";

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

export { supabase };
console.log("UNEST MARKET Supabase connection configured");