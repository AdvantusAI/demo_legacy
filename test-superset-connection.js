const axios = require('axios');

const supersetUrl = 'https://gipsy-bi.apps-m8solutions.com/';
const supersetApiUrl = `${supersetUrl}api/v1/security`;

async function testSupersetConnection() {
  //console.log('🔍 Testing Superset connection...\n');

  // Test 1: Basic connectivity
  try {
    //console.log('1. Testing basic connectivity...');
    const healthResponse = await axios.get(`${supersetUrl}health`);
    //console.log('✅ Health check successful:', healthResponse.status);
  } catch (error) {
    //console.log('❌ Health check failed:', error.response?.status || error.message);
  }

  // Test 2: Check API accessibility
  try {
    //console.log('\n2. Testing API accessibility...');
    const apiResponse = await axios.get(`${supersetApiUrl}/auth`);
    //console.log('✅ API accessible:', apiResponse.status);
    //console.log('Auth providers:', apiResponse.data);
  } catch (error) {
    //console.log('❌ API not accessible:', error.response?.status || error.message);
    if (error.response?.data) {
      //console.log('Error details:', error.response.data);
    }
  }

  // Test 3: Check CSRF token
  try {
    //console.log('\n3. Testing CSRF token endpoint...');
    const csrfResponse = await axios.get(`${supersetApiUrl}/csrf_token/`);
    //console.log('✅ CSRF token available:', csrfResponse.status);
    //console.log('CSRF data:', csrfResponse.data);
  } catch (error) {
    //console.log('❌ CSRF token not available:', error.response?.status || error.message);
  }

  // Test 4: Try login with different credentials
  //console.log('\n4. Testing authentication...');
  
  const credentials = [
    { username: 'admin', password: 'admin' },
    { username: 'superset', password: 'superset' },
    { username: 'admin', password: 'superset' },
    { username: 'superset', password: 'admin' }
  ];

  for (const cred of credentials) {
    try {
      //console.log(`\n   Trying: ${cred.username}/${cred.password}`);
      
      const loginResponse = await axios.post(`${supersetApiUrl}/login`, {
        username: cred.username,
        password: cred.password,
        provider: 'db',
        refresh: true
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      //console.log(`✅ Login successful with ${cred.username}!`);
      //console.log('Access token:', loginResponse.data.access_token ? 'Present' : 'Missing');
      //console.log('Refresh token:', loginResponse.data.refresh_token ? 'Present' : 'Missing');
      
      // If we get here, we found working credentials
      return {
        success: true,
        credentials: cred,
        accessToken: loginResponse.data.access_token
      };
      
    } catch (error) {
      //console.log(`❌ Login failed with ${cred.username}:`, error.response?.status || error.message);
      if (error.response?.data) {
        //console.log('   Error details:', error.response.data);
      }
    }
  }

  //console.log('\n❌ All authentication attempts failed');
  return { success: false };
}

// Run the test
testSupersetConnection()
  .then(result => {
    if (result.success) {
      //console.log('\n🎉 Found working credentials!');
      //console.log('Username:', result.credentials.username);
      //console.log('Password:', result.credentials.password);
    } else {
      //console.log('\n💡 Suggestions:');
      //console.log('1. Check if Superset is properly configured');
      //console.log('2. Verify the correct credentials');
      //console.log('3. Check if authentication is enabled');
      //console.log('4. Verify CORS settings');
    }
  })
  .catch(error => {
    console.error('Test failed:', error.message);
  });
