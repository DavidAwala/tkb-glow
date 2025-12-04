#!/usr/bin/env node
/**
 * Apply the fixed redeem_promo RPC function to Supabase
 * This script uses the Supabase REST API to execute the migration
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server/.env');
  process.exit(1);
}

// Read the migration SQL
const migrationSQL = fs.readFileSync(
  path.join(__dirname, 'supabase', 'migrations', '20251129_create_redeem_promo_rpc.sql'),
  'utf-8'
);

// Since we can't execute raw SQL via REST API directly,
// we'll suggest the user run this manually or provide curl command
const projectId = SUPABASE_URL.split('//')[1].split('.')[0];
const dbUrl = `postgresql://<user>:<password>@db.${projectId}.supabase.co:5432/postgres`;

console.log('\n🔐 SUPABASE RPC FUNCTION MIGRATION');
console.log('=====================================\n');

console.log('📌 Your Supabase Project ID:', projectId);
console.log('🌐 Console URL:', `https://app.supabase.com/project/${projectId}/sql`);

console.log('\n📋 MIGRATION SQL:');
console.log('─'.repeat(80));
console.log(migrationSQL);
console.log('─'.repeat(80));

console.log('\n✅ STEPS TO APPLY MIGRATION:');
console.log('\n1️⃣  Option A - Supabase Web Console (Recommended):');
console.log('   • Go to: https://app.supabase.com/project/' + projectId + '/sql');
console.log('   • Click "New Query"');
console.log('   • Paste the SQL above');
console.log('   • Click "Run"');
console.log('   • Confirm the function was created');

console.log('\n2️⃣  Option B - Using psql (if you have PostgreSQL installed):');
console.log('   • Get your DB password from Supabase settings');
console.log('   • Run: psql -h db.' + projectId + '.supabase.co -U postgres -d postgres -c "' + migrationSQL + '"');

console.log('\n3️⃣  Option C - Using Node.js script:');
console.log('   • Run: node apply-migration-via-node.js');

console.log('\n✨ After applying the migration:');
console.log('   • Restart the server: node server/index.js');
console.log('   • Test promo code at: http://localhost:5173/checkout/payment');
console.log('\n');
