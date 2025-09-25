import { Program, BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from '@solana/web3.js';
import * as anchor from "@coral-xyz/anchor";
import { Buffer } from "buffer";

const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

export class SolanaService {
  constructor(public program: Program) {}

  async testConnection(): Promise<boolean> {
    try {
      const version = await this.program.provider.connection.getVersion();
      console.log('✅ Solana connection OK. RPC URL:', this.program.provider.connection.rpcEndpoint);
      console.log('✅ Version:', version);
      return true;
    } catch (error) {
      console.error('❌ Solana connection failed:', error);
      return false;
    }
  }

  async createAgent(params: {
    agentId: string;
    name: string;
    symbol: string;
    uri: string;
  }): Promise<{ tx: string; agentPda: PublicKey; mintPda: PublicKey; metadataPda: PublicKey }> {

    console.log("Creating agent with program ID:", this.program.programId);

    if (!this.program.provider.publicKey) {
      throw new Error("Provider public key is undefined. Make sure wallet is connected.");
    }
    
    const [agentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), Buffer.from(params.agentId)],
      this.program.programId
    );

    const [mintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint"), Buffer.from(params.agentId)],
      this.program.programId
    );

    const [metadataPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintPda.toBuffer()
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    const accounts = {
      metadata: metadataPda,
      payer: this.program.provider.publicKey,
      agentAccount: agentPda,
      mint: mintPda,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: SystemProgram.programId,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    };

    const tx = await this.program.methods
      .createAgent(params.agentId, params.name, params.symbol, params.uri)
      .accounts(accounts)
      .rpc();

    return { tx, agentPda, mintPda, metadataPda };
  }

  async mintToAgent(params: {
    agentId: string;
    amount: number;
    recipient: PublicKey;
  }): Promise<{ tx: string }> {

    if (!this.program.provider.publicKey) {
      throw new Error("Provider public key is undefined. Make sure wallet is connected.");
    }
    
    const [agentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), Buffer.from(params.agentId)],
      this.program.programId
    );

    const [mintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint"), Buffer.from(params.agentId)],
      this.program.programId
    );

    const decimals = await this.getMintDecimals(mintPda);
    const tokenAmount = new BN(params.amount * Math.pow(10, decimals));

    const destinationTokenAccount = anchor.utils.token.associatedAddress({
      mint: mintPda,
      owner: new PublicKey(params.recipient)
    });

    const tx = await this.program.methods
      .mintToAgent(params.agentId, tokenAmount)
      .accounts({
        payer: this.program.provider.publicKey,
        agentAccount: agentPda,
        mint: mintPda,
        recipient: params.recipient,
        destination: destinationTokenAccount,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID, 
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return { tx };
  }

  async getMintDecimals(mintAddress: PublicKey): Promise<number> {
    try {
      const mintInfo = await this.program.provider.connection.getTokenSupply(mintAddress);
      return mintInfo.value.decimals;
    } catch (error) {
      console.error("Error fetching mint decimals:", error);
      throw new Error("Could not fetch token decimals");
    }
  }
}