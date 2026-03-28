const http = require('http');

function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

async function runTests() {
  console.log('Testing Admin Route Protection...');

  try {
    // 1. Test /admin/dashboard (Should redirect to /admin/login)
    console.log('\n--- 1. Testing /admin/dashboard (No Token) ---');
    const res1 = await makeRequest('/admin/dashboard');
    console.log(`Status Code: ${res1.statusCode}`);
    if (res1.statusCode === 307 || res1.statusCode === 302) {
       console.log(`Redirect Location: ${res1.headers.location}`);
       console.log('PASS: Redirected to login.');
    } else {
       console.log('FAIL: Did not redirect.');
    }

    // 2. Test /api/admin/generate-codes (Should return 401 Unauthorized)
    console.log('\n--- 2. Testing /api/admin/generate-codes (No Token) ---');
    const res2 = await makeRequest('/api/admin/generate-codes', 'POST');
    console.log(`Status Code: ${res2.statusCode}`);
    if (res2.statusCode === 401) {
       console.log('PASS: Returned 401 Unauthorized.');
       console.log(`Body: ${res2.data}`);
    } else {
       console.log('FAIL: Did not return 401.');
       console.log(`Body: ${res2.data}`);
    }

  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

runTests();
