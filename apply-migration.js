// Quick migration applier for the redeem_promo function
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

(async () => {
  try {
    console.log('📝 Reading migration file...');
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251129_create_redeem_promo_rpc.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('🚀 Applying migration to Supabase...');
    
    // Use rpc to execute raw SQL (requires pg_execute_sql function or use the query builder carefully)
    // Since we can't directly execute raw SQL via client, we'll break it into parts and execute
    
    // First, drop the old function
    const dropSQL = 'DROP FUNCTION IF EXISTS public.redeem_promo(TEXT, NUMERIC);';
    console.log('🔄 Dropping old function...');
    const { data: dropData, error: dropErr } = await supabase.rpc('pg_execute', { query: dropSQL });
    
    if (dropErr && !dropErr.message.includes('function pg_execute')) {
      console.error('⚠️  Drop function note:', dropErr?.message);
      // Continue anyway - the function might not exist or we'll handle this differently
    }

    // Create the new function (split into manageable chunks if needed)
    console.log('✨ Creating new function with proper column qualification...');
    
    // Since Supabase client doesn't directly support raw SQL execution,
    // we'll use the SQL directly and inform the user they need to run this manually
    console.log('\n⚠️  The Supabase JS client cannot execute raw SQL directly.');
    console.log('📋 Please apply this migration manually:\n');
    console.log('1. Open Supabase Console: https://app.supabase.com');
    console.log('2. Go to your project SQL Editor');
    console.log('3. Create a new query and paste the following SQL:\n');
    console.log('---START SQL---');
    console.log(migrationSQL);
    console.log('---END SQL---\n');
    console.log('4. Click "Run" button\n');
    console.log('✅ After running the migration, restart your server with: node server/index.js\n');

  } catch (err) {
    console.error('❌ Error:', err.message || err);
    process.exit(1);
  }
})();
