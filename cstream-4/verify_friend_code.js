
// VERIFICATION SCRIPT
// Copy this into your browser console or a temporary .js file to run with `node` if you have the env vars set.

import { createClient } from '@supabase/supabase-js';

// Replace with your actual project URL and Anon Key from .env
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyFriendCodes() {
    console.log("🔍 Verifying Friend Codes...");

    // 1. Check current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        console.log("⚠️ No active session. Please log in first.");
        return;
    }

    const userId = session.user.id;
    console.log(`👤 User ID: ${userId}`);

    // 2. Fetch Profile
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, username, display_code')
        .eq('id', userId)
        .single();

    if (error) {
        console.error("❌ Error fetching profile:", error);
        return;
    }

    // 3. Verify Display Code
    console.log(`✅ Profile Found: ${profile.username}`);
    console.log(`🔢 Display Code (Raw): ${profile.display_code}`);

    if (profile.display_code) {
        const formattedCode = profile.display_code.toString().padStart(5, '0');
        console.log(`✨ Formatted Code: #${formattedCode}`);
        console.log("🚀 Friend System Ready!");
    } else {
        console.error("❌ No display_code found! Did you run the migration SQL?");
    }
}

// verifyFriendCodes();
