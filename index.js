import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';
import { Wallet } from '@project-serum/anchor';
import bs58 from 'bs58';
import dotenv from 'dotenv';
dotenv.config();

const connection = new Connection('https://api.mainnet-beta.solana.com');

const privateKey = process.env.PRIVATE_KEY;
const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
const wallet = new Wallet(keypair);
// If you wanna generate a new wallet
// const wallet = new Wallet(Keypair.generate());


// Get quotes using Jupiter API
async function getQuote(inputMint, outputMint, amount, slippageBps) {
  const response = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`);
  const data = await response.json();
  return data;
}

// Execute the swap
async function executeSwap(quoteResponse) {
    const { swapTransaction } = await (
      await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quoteResponse, // quoteResponse from /quote api
          userPublicKey: wallet.publicKey.toString(), // user public key to be used for the swap
          wrapAndUnwrapSol: true,
        })
      })
    ).json();
    
    console.log(`Request Wallet: ${wallet.publicKey.toString()}`)
    
    // deserialize the transaction
    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
    var transaction = VersionedTransaction.deserialize(swapTransactionBuf);
    console.log(transaction);

    // sign the transaction
    transaction.sign([wallet.payer]);

    // Execute the transaction
    const rawTransaction = transaction.serialize()
    const txid = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: true,
      maxRetries: 2
    });
    await connection.confirmTransaction(txid);
    console.log(`https://solscan.io/tx/${txid}`);
}

// Main function to get quote and execute swap
async function main() {
    const inputMint = 'So11111111111111111111111111111111111111112'; // SOL
    const outputMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC
    const amount = 100000000 / 1000; // 0.001 SOL
    const slippageBps = 30; // 0.3% slippage
  
    const quoteResponse = await getQuote(inputMint, outputMint, amount, slippageBps);
    console.log(quoteResponse);
    await executeSwap(quoteResponse);
  }
  
  main();
  