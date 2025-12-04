#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🔐 Connecting to Supabase...');
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

(async () => {
  try {
    // Read migration SQL
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'supabase', 'migrations', '20251129_create_redeem_promo_rpc.sql'),
      'utf-8'
    );

    console.log('📝 Executing migration SQL...\n');
    
    // The Supabase client doesn't support raw SQL execution directly
    // We need to use the RPC approach or provide manual instructions
    console.log('⚠️  Supabase JS Client limitation: Cannot execute raw SQL directly.');
    console.log('\n✅ SOLUTION: Using Supabase Console SQL Editor\n');

    // For now, just show what needs to be done
    console.log('📋 MIGRATION SQL to apply:\n');
    console.log('─'.repeat(80));
    console.log(migrationSQL);
    console.log('─'.repeat(80));
    console.log('\n');

    console.log('🌐 GO TO SUPABASE CONSOLE:');
    const projectId = SUPABASE_URL.split('.')[0].split('//')[1];
    console.log(`   https://app.supabase.com/project/${projectId}/sql/new`);
    console.log('\n✏️  Steps:');
    console.log('   1. Open the link above');
    console.log('   2. Copy the SQL shown above');
    console.log('   3. Paste it in the SQL editor');
    console.log('   4. Click "Run"');
    console.log('   5. Return here and run: node server/index.js\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
