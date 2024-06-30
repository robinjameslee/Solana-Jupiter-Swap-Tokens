import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Wallet } from '@project-serum/anchor';
import bs58 from 'bs58';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const privateKey = process.env.PRIVATE_KEY;
  const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
  const wallet = new Wallet(keypair);

  const myAddress = wallet.publicKey;  
  const signature = await connection.requestAirdrop(myAddress, LAMPORTS_PER_SOL);
  await connection.confirmTransaction(signature);
})();