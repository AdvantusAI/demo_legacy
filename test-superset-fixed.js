import axios from 'axios';

const supersetUrl = 'https://gipsy-bi.apps-m8solutions.com/';
const supersetApiUrl = `${supersetUrl}api/v1/`;

async function testFixedSupersetConnection() {
  //console.log('🔍 Testing fixed Superset connection...\n');

  try {
    // Step 1: Login with correct credentials
    //console.log('1. Testing login with admin/Gipsy2025!...');
    const loginResponse = await axios.post(`${supersetApiUrl}security/login`, {
      username: "admin",
      password: "Gipsy2025!",
      provider: "db",
      refresh: true,
    }, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    const access_token = loginResponse.data.access_token;
    //console.log('✅ Login successful!');
    //console.log('Access token:', access_token ? 'Present' : 'Missing');

    if (!access_token) {
      throw new Error('No access token received');
    }

    // Step 2: Get CSRF token
    //console.log('\n2. Getting CSRF token...');
    const csrfResponse = await axios.get(`${supersetApiUrl}security/csrf_token/`, {
      headers: {
        "Authorization": `Bearer ${access_token}`,
      }
    });

    const csrf_token = csrfResponse.data.result;
    //console.log('✅ CSRF token received:', csrf_token ? 'Present' : 'Missing');

    if (!csrf_token) {
      throw new Error('No CSRF token received');
    }

    // Step 3: Try different CSRF token approaches
    //console.log('\n3. Testing different CSRF token approaches...');
    
    const approaches = [
      {
        name: 'X-CSRFToken header',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${access_token}`,
          "X-CSRFToken": csrf_token,
        }
      },
      {
        name: 'X-CSRF-Token header',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${access_token}`,
          "X-CSRF-Token": csrf_token,
        }
      },
      {
        name: 'CSRF-Token header',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${access_token}`,
          "CSRF-Token": csrf_token,
        }
      },
      {
        name: 'Authorization header only (no CSRF)',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${access_token}`,
        }
      }
    ];

    for (const approach of approaches) {
      try {
        //console.log(`\n   Trying: ${approach.name}...`);
        const guestTokenResponse = await axios.post(`${supersetApiUrl}security/guest_token/`, {
          resources: [
            {
              type: "dashboard",
              id: "1"
            }
          ],
          rls: [],
          user: {
            username: "sup_user",
            first_name: "superset",
            last_name: "user",
          }
        }, {
          headers: approach.headers
        });

        const guest_token = guestTokenResponse.data.token;
        //console.log(`   ✅ ${approach.name} - SUCCESS!`);
        //console.log('   Guest token:', guest_token ? 'Present' : 'Missing');

        if (guest_token) {
          //console.log('\n🎉 Found working approach!');
          //console.log(`Working method: ${approach.name}`);
          //console.log('\n📋 Summary:');
          //console.log('- Login: ✅');
          //console.log('- CSRF Token: ✅');
          //console.log('- Guest Token: ✅');
          //console.log(`- Method: ${approach.name}`);
          //console.log('\nThe AdvancedReportsDashboard component should now work correctly.');
          return;
        }
      } catch (error) {
        //console.log(`   ❌ ${approach.name} - Failed:`, error.response?.status || error.message);
        if (error.response?.data) {
          //console.log('   Error details:', error.response.data);
        }
      }
    }

    //console.log('\n❌ All CSRF token approaches failed');
    //console.log('This might indicate a server-side configuration issue.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testFixedSupersetConnection();
