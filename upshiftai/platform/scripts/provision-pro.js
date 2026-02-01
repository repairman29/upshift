// Script to manually provision a Pro subscription for testing
// Run with: node scripts/provision-pro.js <user_email>

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node provision-pro.js <email>');
    process.exit(1);
  }

  console.log(`Provisioning PRO for ${email}...`);

  // 1. Get User ID
  let { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (userError || !user) {
    // If user doesn't exist in our table, we might need to create them
    // (Assuming NextAuth manages its own user table or we sync)
    console.log('User not found in DB. Creating placeholder...');
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([{ email }])
      .select()
      .single();
    
    if (createError) {
      console.error('Failed to create user:', createError);
      process.exit(1);
    }
    user = newUser;
  }

  // 2. Insert/Update Subscription
  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: user.id,
      status: 'active',
      plan_tier: 'pro',
      customer_id: 'cus_manual_test',
      subscription_id: 'sub_manual_test_' + Date.now(),
      updated_at: new Date().toISOString()
    });

  if (subError) {
    console.error('Failed to provision sub:', subError);
    process.exit(1);
  }

  // 3. Generate API Key
  const key = `uai_pro_test_${Date.now()}`;
  const { error: keyError } = await supabase
    .from('api_keys')
    .insert({
      api_key_value: key,
      user_id: user.id,
      name: 'Manual Test Key'
    });

  if (keyError) {
    console.error('Failed to create key:', keyError);
  } else {
    console.log('✅ Success! User has Pro.');
    console.log(`🔑 Test API Key: ${key}`);
    console.log(`👉 Export this: export UPSHIFTAI_API_KEY=${key}`);
  }
}

main();