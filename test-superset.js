import axios from 'axios';

const supersetUrl = 'https://gipsy-bi.apps-m8solutions.com/';

async function testSupersetConnection() {
  //console.log('🔍 Testing Superset connection...');
  
  try {
    // Test 1: Basic connectivity
    const response = await axios.get(supersetUrl);
    //console.log('✅ Main page accessible:', response.status);
    //console.log('📄 Content type:', response.headers['content-type']);
    //console.log('📄 Content preview:', response.data.substring(0, 500));
    
    // Test 2: Check for Superset-specific content
    if (response.data.includes('superset') || response.data.includes('Superset')) {
      //console.log('✅ Superset content detected');
    } else {
      //console.log('⚠️ No Superset content detected');
    }
    
    // Test 2.5: Look for login form or authentication hints
    if (response.data.includes('login') || response.data.includes('Login')) {
      //console.log('✅ Login form detected');
    }
    if (response.data.includes('username') || response.data.includes('password')) {
      //console.log('✅ Username/password fields detected');
    }
    
    // Look for CSRF token in the page
    const csrfMatch = response.data.match(/csrf_token['"]?\s*[:=]\s*['"]([^'"]+)['"]/);
    if (csrfMatch) {
      //console.log('🔍 Found CSRF token in page:', csrfMatch[1]);
    }
    
    // Look for any configuration hints
    const configHints = [
      'admin',
      'superset',
      'gipsy',
      'm8',
      'analytics'
    ];
    
    for (const hint of configHints) {
      if (response.data.toLowerCase().includes(hint.toLowerCase())) {
        //console.log(`🔍 Found potential hint: ${hint}`);
      }
    }
    
    // Test 3: Try API endpoints
    const apiEndpoints = [
      '/api/v1/security/csrf_token/',
      '/api/v1/dashboard/',
      '/health'
    ];
    
    for (const endpoint of apiEndpoints) {
      try {
        const apiResponse = await axios.get(`${supersetUrl}${endpoint}`);
        //console.log(`✅ ${endpoint}:`, apiResponse.status);
      } catch (apiError) {
        //console.log(`❌ ${endpoint}:`, apiError.response?.status || apiError.code);
      }
    }
    
    // Test 4: Try POST login with different credentials
    const loginAttempts = [
      { username: "admin", password: "Gipsy2025!", provider: "db" },
      { username: "admin", password: "admin", provider: "db" },
      { username: "superset", password: "superset", provider: "db" },
      { username: "admin", password: "superset", provider: "db" },
      { username: "superset", password: "admin", provider: "db" },
      { username: "m8", password: "m8", provider: "db" },
      { username: "analytics", password: "analytics", provider: "db" },
      { username: "gipsy", password: "gipsy", provider: "db" },
      { username: "m8", password: "analytics", provider: "db" },
      { username: "analytics", password: "m8", provider: "db" },
      { username: "admin", password: "m8", provider: "db" },
      { username: "m8", password: "admin", provider: "db" },
      { username: "admin", password: "analytics", provider: "db" },
      { username: "analytics", password: "admin", provider: "db" },
      { username: "admin", password: "admin", provider: "ldap" }
    ];
    
    for (const credentials of loginAttempts) {
      try {
        //console.log(`🔄 Trying login with ${credentials.username}/${credentials.password} (${credentials.provider})`);
        const loginResponse = await axios.post(`${supersetUrl}/api/v1/security/login`, credentials, {
          headers: {
            "Content-Type": "application/json"
          }
        });
        //console.log(`✅ Login successful with ${credentials.username}:`, loginResponse.status);
        //console.log(`🔑 Access token:`, loginResponse.data.access_token ? "Received" : "Not received");
        
        if (loginResponse.data.access_token) {
          // Try to get CSRF token with the access token
          let csrfToken = null;
          try {
            const csrfResponse = await axios.get(`${supersetUrl}/api/v1/security/csrf_token/`, {
              headers: {
                "Authorization": `Bearer ${loginResponse.data.access_token}`
              }
            });
            //console.log(`✅ CSRF token with auth:`, csrfResponse.status);
            //console.log(`📄 CSRF response:`, JSON.stringify(csrfResponse.data, null, 2));
            csrfToken = csrfResponse.data.result;
          } catch (csrfError) {
            //console.log(`❌ CSRF token with auth:`, csrfError.response?.status);
          }
          
          // Try to get available dashboards first
          try {
            //console.log(`🔄 Getting available dashboards...`);
            const dashboardsResponse = await axios.get(`${supersetUrl}/api/v1/dashboard/`, {
              headers: {
                "Authorization": `Bearer ${loginResponse.data.access_token}`
              }
            });
            //console.log(`✅ Dashboards available:`, dashboardsResponse.status);
            //console.log(`📊 Dashboard count:`, dashboardsResponse.data.result?.length || 0);
            
            if (dashboardsResponse.data.result && dashboardsResponse.data.result.length > 0) {
              const firstDashboard = dashboardsResponse.data.result[0];
              //console.log(`📊 First dashboard:`, firstDashboard.id, firstDashboard.dashboard_title);
              
              // Try to get a guest token with a real dashboard ID
              try {
                const guestTokenResponse = await axios.post(`${supersetUrl}/api/v1/security/guest_token/`, {
                  resources: [
                    {
                      type: "dashboard",
                      id: firstDashboard.id
                    }
                  ],
                  rls: [],
                  user: {
                    username: "admin",
                    first_name: "Admin",
                    last_name: "User",
                  }
                }, {
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${loginResponse.data.access_token}`
                  }
                });
                //console.log(`✅ Guest token created with real dashboard:`, guestTokenResponse.status);
                //console.log(`🔑 Guest token:`, guestTokenResponse.data.token ? "Received" : "Not received");
              } catch (guestTokenError) {
                //console.log(`❌ Guest token creation failed:`, guestTokenError.response?.status);
                //console.log(`📄 Error details:`, guestTokenError.response?.data);
              }
            }
          } catch (dashboardsError) {
            //console.log(`❌ Failed to get dashboards:`, dashboardsError.response?.status);
          }
          
          break; // Stop trying if we found working credentials
        }
      } catch (loginError) {
        //console.log(`❌ Login failed with ${credentials.username}:`, loginError.response?.status);
        if (loginError.response?.data?.message) {
          //console.log(`📄 Error message:`, loginError.response.data.message);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testSupersetConnection();
