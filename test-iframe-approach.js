import axios from 'axios';

const supersetUrl = 'https://gipsy-bi.apps-m8solutions.com/';

async function testIframeApproach() {
  //console.log('🔍 Testing direct iframe approach...\n');

  try {
    // Test 1: Check if the dashboard URL is accessible
    //console.log('1. Testing dashboard URL accessibility...');
    const dashboardUrl = `${supersetUrl}superset/dashboard/1/?standalone=3`;
    //console.log('Dashboard URL:', dashboardUrl);
    
    const response = await axios.get(dashboardUrl, {
      maxRedirects: 5,
      validateStatus: function (status) {
        return status < 500; // Accept redirects and client errors
      }
    });
    
    //console.log('Response status:', response.status);
    //console.log('Response headers:', response.headers);
    
    if (response.status === 200) {
      //console.log('✅ Dashboard URL is accessible');
      
      // Check if it's a login page or the actual dashboard
      if (response.data.includes('login') || response.data.includes('Login')) {
        //console.log('⚠️ Dashboard requires authentication');
      } else if (response.data.includes('dashboard') || response.data.includes('Dashboard')) {
        //console.log('✅ Dashboard content detected');
      } else {
        //console.log('📄 Dashboard page loaded (content type: ' + response.headers['content-type'] + ')');
      }
    } else if (response.status === 302 || response.status === 301) {
      //console.log('🔄 Dashboard redirects to:', response.headers.location);
    } else {
      //console.log('❌ Dashboard not accessible:', response.status);
    }
    
    // Test 2: Check if we can access the main Superset page
    //console.log('\n2. Testing main Superset page...');
    const mainResponse = await axios.get(supersetUrl);
    //console.log('Main page status:', mainResponse.status);
    
    if (mainResponse.data.includes('login') || mainResponse.data.includes('Login')) {
      //console.log('✅ Login form detected on main page');
    }
    
    //console.log('\n📋 Summary:');
    //console.log('- Direct iframe approach should work if user is authenticated');
    //console.log('- If not authenticated, user will see login form in iframe');
    //console.log('- This is a simpler approach that avoids CSRF token issues');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
  }
}

// Run the test
testIframeApproach();
