// test-all-routes.ts
async function testAllRoutes() {
  const baseUrl = 'http://localhost:3001/api/v1/agents';
  
  const tests = [
    { method: 'GET', endpoint: '/test', body: null },
    { method: 'POST', endpoint: '/deploy', body: {
      agentId: "test-mint-route",
      name: "Test Mint Route", 
      symbol: "TEST",
      uri: "https://example.com/metadata.json"
    }},
    { method: 'POST', endpoint: '/mint', body: {
      agentId: "test-mint-route",
      amount: 100, 
      recipient: "D3hMdwkmMHcucbHdwFtjjS8uPviqvao9dSc5pxR9mpY9"
    }}
  ];

  for (const test of tests) {
    console.log(`\n🧪 Testing ${test.method} ${test.endpoint}`);
    
    try {
      const response = await fetch(baseUrl + test.endpoint, {
        method: test.method,
        headers: test.body ? { 'Content-Type': 'application/json' } : {},
        body: test.body ? JSON.stringify(test.body) : null
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error:', errorText);
      } else {
        const result = await response.json();
        console.log('Success:', result);
      }
    } catch (error) {
      console.log('Request failed:', error);
    }
  }
}

testAllRoutes();