const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
// Accessing key from environment
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
  console.error("❌ Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL in environment");
  process.exit(1);
}
if (!key) {
  console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY in environment");
  process.exit(1);
}

const supabase = createClient(url, key);

async function testConnection() {
  console.log("Testing connection to " + url + "...");
  
  // Try to read users table
  const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
  
  if (error) {
    console.error("❌ Connection Failed:", error.message);
  } else {
    console.log("✅ Connection Successful!");
    console.log(`   User count: ${data === null ? '0 (table empty or RLS)' : 'Accessible'}`);
  }
}

testConnection();