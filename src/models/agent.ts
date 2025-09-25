import mongoose from 'mongoose';


const agentSchema = new mongoose.Schema({
  agentId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  symbol: { type: String, required: true },
  uri: { type: String, required: true },
  decimals: { type: Number, default: 9 },
  mintAddress: { type: String, required: true },
  agentPda: { type: String, required: true },
  metadataPda: { type: String, required: true },
  transactionSignature: { type: String, required: true },
  totalMinted: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Agent', agentSchema);