import express from 'express';
import Agent from '../models/agent';
import { SolanaService } from '../services/SolanaService';

const router = express.Router();

// Add route logging middleware
router.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// Test route to verify router is working
router.get('/test', (req, res) => {
  console.log('✅ /test route hit');
  res.json({ message: 'Agent routes are working!', path: req.path });
});


// Get all agents
router.get('/', async (req, res) => {
  try {
    const agents = await Agent.find();
    res.json(agents);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

// Get agent by ID
router.get('/:agentId', async (req, res) => {
  try {
    const agent = await Agent.findOne({ agentId: req.params.agentId });
    if (!agent) return res.status(404).json({ message: 'Agent not found' });
    res.json(agent);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

// Create new agent
router.post('/deploy', async (req, res) => {
  console.log('Received request to create agent!');
  try {
    const { agentId, name, symbol, uri, decimals } = req.body;

    // Validate inputs
    if (!agentId || !name || !symbol || !uri) {
      return res.status(400).json({ error: 'All fields are required: agentId, name, symbol, uri' });
    }

    // Validate agentId format
    if (agentId.length > 32) {
      return res.status(400).json({ 
        error: 'Agent ID too long (max 32 characters)' 
      });
    }

    const dec = decimals ? Number(decimals) : 9;
    
    if (isNaN(dec)) {
      return res.status(400).json({ error: 'Decimals must be a number' });
    }

    // Get program from app settings
    const program = req.app.get('program');
    const solanaService = new SolanaService(program);

    // Create agent on Solana
    const solanaResult = await solanaService.createAgent({
      agentId,
      name, 
      symbol, 
      uri
    });

    // Store in database
    const agentRecord = new Agent({
      agentId,
      name,
      symbol,
      uri,
      decimals: dec,
      mintAddress: solanaResult.mintPda.toString(),
      agentPda: solanaResult.agentPda.toString(),
      metadataPda: solanaResult.metadataPda.toString(),
      transactionSignature: solanaResult.tx,
      createdAt: new Date()
    });

    await agentRecord.save();

    console.log('Agent created with ID:', agentId);
    res.status(201).json({
      success: true,
      agentId,
      tx: solanaResult.tx,
      mintAddress: solanaResult.mintPda.toString(),
      agentPda: solanaResult.agentPda.toString(),
      explorerUrl: `https://explorer.solana.com/tx/${solanaResult.tx}?cluster=devnet`
    });
  } catch (err) {
    console.error('Agent creation error:', err);
    res.status(400).json({ message: err });
  }
});

// Mint tokens to agent
router.post('/mint', async (req, res) => {
  console.log('Received request to mint tokens to agent!');
  try {

    const { agentId, amount, recipient } = req.body;

    // Validate inputs
    // ✅ FIX: Validate ALL required fields including agentId
    if (!agentId || !amount || !recipient) {
      return res.status(400).json({ 
        error: 'All fields are required: agentId, amount, recipient' 
      });
    }

    const amt = Number(amount);
    
    if (isNaN(amt) || amt <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    /*
    // Check if agent exists
    const agent = await Agent.findOne({ agentId });
    if (!agent) {
      console.log(`Agent not found: ${agentId}`);
      return res.status(404).json({ error: `Agent '${agentId}' not found` });
    }
      */

    // Get program from app settings
    const program = req.app.get('program');
    const solanaService = new SolanaService(program);

    // Mint tokens
    const mintResult = await solanaService.mintToAgent({
      agentId,
      amount: amt,
      recipient: recipient
    });

    // Update agent with mint history
    await Agent.findOneAndUpdate(
      { agentId },
      { 
        $push: {
          mintHistory: {
            amount: amt,
            recipient: recipient,
            transactionSignature: mintResult.tx,
            timestamp: new Date()
          }
        },
        $inc: { totalMinted: amt }
      }
    );

    console.log('Tokens minted for agent:', agentId);
    res.status(201).json({
      success: true,
      agentId,
      amount: amt,
      recipient,
      tx: mintResult.tx,
      explorerUrl: `https://explorer.solana.com/tx/${mintResult.tx}?cluster=devnet`
    });
  } catch (err) {
    console.error('Mint tokens error:', err);
    res.status(400).json({ message: err });
  }
});

export default router;