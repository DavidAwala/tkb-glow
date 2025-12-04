import fetch from 'node-fetch';

async function test() {
  try {
    const resp = await fetch('http://localhost:3000/api/admin/test-flutterwave', {
      method: 'GET',
      headers: {
        'x-admin-secret': 'some-super-secret-string',
        'Content-Type': 'application/json'
      }
    });
    const json = await resp.json();
    console.log('Response:', JSON.stringify(json, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  }
}

test();
