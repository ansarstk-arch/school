import fetch from 'node:fetch';

const API_BASE = 'http://localhost:3000/api/v1';

// Simple performance test for dashboard endpoints
async function testDashboardPerformance() {
  console.log('🧪 Testing Dashboard Performance...\n');

  const endpoints = [
    { name: 'Dashboard Cards', url: '/dashboard/cards?type=all' },
    { name: 'Revenue/Expense Chart', url: '/dashboard/charts/revenue-expense?type=all&months=5' },
    { name: 'Attendance Chart', url: '/dashboard/charts/attendance?type=all' },
    { name: 'Student Growth Chart', url: '/dashboard/charts/student-growth?type=all&months=6' },
    { name: 'Monthly Expenses Chart', url: '/dashboard/charts/monthly-expenses?type=all&months=5' },
    { name: 'Recent Admissions', url: '/dashboard/recent-admissions?type=all&limit=10' },
    { name: 'Upcoming Exams', url: '/dashboard/upcoming-exams?type=all&limit=5' },
    { name: 'System Status', url: '/dashboard/system-status' },
  ];

  const results = [];

  for (const endpoint of endpoints) {
    const start = Date.now();
    try {
      const response = await fetch(`${API_BASE}${endpoint.url}`);
      const duration = Date.now() - start;
      const data = await response.json();
      
      if (data.success) {
        results.push({ name: endpoint.name, duration, status: '✅' });
        console.log(`✅ ${endpoint.name}: ${duration}ms`);
      } else {
        results.push({ name: endpoint.name, duration, status: '❌', error: data.message });
        console.log(`❌ ${endpoint.name}: ${duration}ms - ${data.message}`);
      }
    } catch (error) {
      const duration = Date.now() - start;
      results.push({ name: endpoint.name, duration, status: '❌', error: error.message });
      console.log(`❌ ${endpoint.name}: ${duration}ms - ${error.message}`);
    }
  }

  console.log('\n📊 Performance Summary:');
  console.log('─'.repeat(50));
  
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);
  const avgTime = Math.round(totalTime / results.length);
  const successCount = results.filter(r => r.status === '✅').length;
  
  console.log(`Total Time: ${totalTime}ms`);
  console.log(`Average Time: ${avgTime}ms`);
  console.log(`Success Rate: ${successCount}/${results.length}`);
  console.log('─'.repeat(50));

  if (successCount === results.length) {
    console.log('\n🎉 All dashboard endpoints working correctly!');
  } else {
    console.log('\n⚠️  Some endpoints failed. Check the logs above.');
  }
}

// Run the test
testDashboardPerformance().catch(console.error);
