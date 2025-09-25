import Agent from '../models/agent';
import SolanaService from '../services/solanaService';

class AgentController {
  async createAgent(req, res) {
    try {
      const { agentId, name, symbol, uri, decimals = 9 } = req.body;

      // Validate input
      if (!agentId || !name || !symbol || !uri) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if agent already exists in DB
      const existingAgent = await Agent.findOne({ agentId });
      if (existingAgent) {
        return res.status(409).json({ error: 'Agent ID already exists' });
      }

      // Create agent on Solana
      const solanaResult = await SolanaService.createAgent(agentId, name, symbol, uri, decimals);

      // Store in MongoDB
      const agentRecord = new Agent({
        agentId,
        name,
        symbol,
        uri,
        decimals,
        mintAddress: solanaResult.mintPda,
        agentPda: solanaResult.agentPda,
        metadataPda: solanaResult.metadataPda,
        creatorWallet: solanaService.wallet.publicKey.toString(),
        transactionSignature: solanaResult.transactionSignature
      });

      await agentRecord.save();

      res.status(201).json({
        success: true,
        data: {
          agentId,
          transactionSignature: solanaResult.transactionSignature,
          mintAddress: solanaResult.mintPda,
          agentPda: solanaResult.agentPda,
          explorerUrl: `https://explorer.solana.com/tx/${solanaResult.transactionSignature}?cluster=devnet`
        }
      });
    } catch (error) {
      console.error('Error creating agent:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getAgent(req, res) {
    try {
      const { agentId } = req.params;
      const agent = await Agent.findOne({ agentId });
      
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      res.json({ success: true, data: agent });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async listAgents(req, res) {
    try {
      const { limit = 10, page = 1 } = req.query;
      const agents = await Agent.find()
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const total = await Agent.countDocuments();

      res.json({
        success: true,
        data: agents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AgentController();