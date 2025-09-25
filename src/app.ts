import express from 'express';
import mongoose from 'mongoose';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Keypair, Connection, clusterApiUrl } from '@solana/web3.js';
import idl from '../idl/ai_agent_factory.json';
import agentRoutes from './routes/agentRoutes';
require('dotenv').config();
import type { Idl } from '@coral-xyz/anchor';

// Define AiAgentFactory type from your IDL if not generated
type AiAgentFactory = Idl;

const app = express();

//middle ware
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Solana Wallet Setup
const setupSolana = () => {
  try {
    const walletPrivateKey = JSON.parse(process.env.WALLET_PRIVATE_KEY!);
    const keypair = Keypair.fromSecretKey(new Uint8Array(walletPrivateKey));

    const wallet = {
      publicKey: keypair.publicKey,
      signTransaction: async (transaction: any) => {
        transaction.partialSign(keypair);
        return transaction;
      },
      signAllTransactions: async (transactions: any[]) => {
        return transactions.map(transaction => {
          transaction.partialSign(keypair);
          return transaction;
        });
      },
    };

    const connection = new Connection(
      clusterApiUrl('devnet'), // 'mainnet', 'testnet'
      'confirmed' 
    );

    const provider = new AnchorProvider(connection, wallet, {});

    const program = new Program(
      idl as AiAgentFactory,
      provider
    );

    console.log('✅ Solana wallet configured:', wallet.publicKey.toString());
    console.log('✅ RPC URL:', process.env.SOLANA_RPC_URL);
    console.log('✅ Program ID:', process.env.PROGRAM_ID);
    return program;
  } catch (error) {
    console.error('❌ Solana/program setup error:', error);
    process.exit(1);
  }
};


// Initialize services
const initializeApp = async () => {

  await connectDB();
  const program = setupSolana();
  console.log("this is the routesd dammit",agentRoutes.stack)
  app.set('program', program);
  app.use('/api/v1/agents', agentRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found!' });
  });

  // Error handler
  app.use((error: any, req: any, res: any, next: any) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  });

  return app;
};

// Handle shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down....');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed');
  process.exit(0);
});

export default initializeApp;