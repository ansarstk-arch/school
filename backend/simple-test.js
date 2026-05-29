// Simple test to check if exam routes are working
import http from 'http';

function testAPI(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/v1${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Exam API...\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint');
    const health = await testAPI('/../../health');
    console.log('Health Status:', health.status);
    console.log('Health Response:', health.data);
    console.log('');

    // Test 2: Get exams (should require auth)
    console.log('2️⃣ Testing GET /exams');
    const exams = await testAPI('/exams');
    console.log('Exams Status:', exams.status);
    console.log('Exams Response:', exams.data);
    console.log('');

    // Test 3: Get classes by institution (should require auth)
    console.log('3️⃣ Testing GET /exams/classes-by-institution');
    const classes = await testAPI('/exams/classes-by-institution?institutionType=School&academicYear=1403');
    console.log('Classes Status:', classes.status);
    console.log('Classes Response:', classes.data);
    console.log('');

    console.log('✅ All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runTests();