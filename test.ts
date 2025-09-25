async function createAgentExample() {
  try {
    
      const response = await fetch('http://localhost:3001/api/v1/agents/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentId: "test-agent-105",
        name: "fly agent", 
        symbol: "FLY",
        uri: "https://gist.github.com/theBatm4n/b712e212060f556eae6bdd591fd9d005.js"
      })
    });
    const result = await response.json();
    console.log(result)
    
    const mint_result = await fetch('http://localhost:3001/api/v1/agents/mint', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            agentId: "test-agent-105",  
            amount: 70, 
            recipient: "D3hMdwkmMHcucbHdwFtjjS8uPviqvao9dSc5pxR9mpY9" // any wallet address is fine
        })
    });
    const mint_result_final = await mint_result.json()
    console.log(mint_result_final);
    

  } catch (error) {
    console.error(" Error creating agent:", error);
    throw error;
  }
}


createAgentExample()
  .then(result => {
    console.log("Agent creation completed!");
  })
  .catch(error => {
    console.error("Failed to create agent:", error);
  });
  