const http = require('http');

function makePostRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let resultData = '';
      res.on('data', (chunk) => {
        resultData += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: resultData
        });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('Testing NoSQL Injection & Input Validation...');

  try {
    // 1. Test /api/admin/login with NoSQL Injection payload
    console.log('\n--- 1. Testing /api/admin/login with {"username": {"$gt": ""}} ---');
    const injectionData1 = { username: { "$gt": "" }, password: "password" };
    const res1 = await makePostRequest('/api/admin/login', injectionData1);
    console.log(`Status Code: ${res1.statusCode}`);
    console.log(`Body: ${res1.data}`);
    // A 500 error or validation error means they couldn't bypass. A 200 means bypass success (bad).
    if (res1.statusCode !== 200) {
        console.log('PASS: Login bypassed prevented.');
    } else {
        console.error('FAIL: Login bypassed!');
    }

    // 2. Test /api/validate-code with NoSQL Injection Payload
    console.log('\n--- 2. Testing /api/validate-code with {"code": {"$ne": null}} ---');
    const injectionData2 = { code: { "$ne": null } };
    const res2 = await makePostRequest('/api/validate-code', injectionData2);
    console.log(`Status Code: ${res2.statusCode}`);
    console.log(`Body: ${res2.data}`);
    if (res2.statusCode !== 200) {
        console.log('PASS: Code validation bypassed prevented.');
    } else {
        console.error('FAIL: Code validation bypassed!');
    }

    // 3. Test /api/admin/login with empty credentials
    console.log('\n--- 3. Testing /api/admin/login with empty credentials ---');
    const res3 = await makePostRequest('/api/admin/login', { username: '', password: '' });
    console.log(`Status Code: ${res3.statusCode}`);
    console.log(`Body: ${res3.data}`);

  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

runTests();
