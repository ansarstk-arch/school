// Simple test script to verify exam API endpoints
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api/v1';

// Test data
const testExam = {
  examTitle: "د ریاضیاتو امتحان",
  institutionType: "School",
  assignedClasses: [1, 2], // Assuming these class IDs exist
  startDate: "2024-03-15",
  endDate: "2024-03-20",
  status: "فعال",
  academicYear: "1403"
};

async function testExamAPI() {
  try {
    console.log('🧪 Testing Exam API endpoints...\n');

    // Test 1: Get all exams
    console.log('1️⃣ Testing GET /exams');
    const getResponse = await fetch(`${API_BASE}/exams`);
    const getResult = await getResponse.json();
    console.log('Status:', getResponse.status);
    console.log('Response:', JSON.stringify(getResult, null, 2));
    console.log('✅ GET /exams test completed\n');

    // Test 2: Get classes by institution
    console.log('2️⃣ Testing GET /exams/classes-by-institution');
    const classesResponse = await fetch(`${API_BASE}/exams/classes-by-institution?institutionType=School&academicYear=1403`);
    const classesResult = await classesResponse.json();
    console.log('Status:', classesResponse.status);
    console.log('Response:', JSON.stringify(classesResult, null, 2));
    console.log('✅ GET /exams/classes-by-institution test completed\n');

    // Test 3: Create exam (this will fail without auth, but we can see the validation)
    console.log('3️⃣ Testing POST /exams (without auth - should fail)');
    const createResponse = await fetch(`${API_BASE}/exams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testExam)
    });
    const createResult = await createResponse.json();
    console.log('Status:', createResponse.status);
    console.log('Response:', JSON.stringify(createResult, null, 2));
    console.log('✅ POST /exams test completed\n');

    console.log('🎉 All API tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testExamAPI();