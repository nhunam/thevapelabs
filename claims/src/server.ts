import express from "express";
import {
  ComputeBudgetProgram,
  ConfirmOptions,
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { AnchorProvider, BN, Program, setProvider } from "@coral-xyz/anchor";
import { Misttoken } from "./idl/misttoken";
import idl from "./idl/misttoken.json";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { getOrCreateATAInstruction, loadKeypair } from "./utils";

const app = express();
const PORT: number = 4000;

const confirmOptions = {
  skipPreflight: true,
};

const connection = new Connection(
  "https://devnet.helius-rpc.com/?api-key=1c0f8676-0ead-45f1-a6ed-0e0b16d5b11d"
);

const mint = loadKeypair(
  "./src/keys/mistVpcymdyB5bEMdMJvmCcacjqaL2SeUCw38wyz6MF.json"
);
const authority = loadKeypair("./src/keys/thevapelabs.json");
const verifier = loadKeypair("./src/keys/verifier.json");

const wallet = new NodeWallet(authority);
const provider = new AnchorProvider(
  connection,
  wallet,
  AnchorProvider.defaultOptions()
);
setProvider(provider);
const program = new Program<Misttoken>(idl as Misttoken, provider);

app.use(express.json());

interface UserClaimRequest {
  user: Keypair;
  amount: number;
}

interface UserRequest {
  privateKey: string;
  amount: number;
}

interface ClaimBatchRequest {
  users: UserRequest[];
}

const claims = async (
  program: Program<Misttoken>,
  mint: PublicKey,
  verifier: Keypair,
  request: UserClaimRequest[],
  confirmOptions: ConfirmOptions
): Promise<string> => {
  try {
    const [globalPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("global")],
      program.programId
    );

    // Initialize arrays for instructions and signers
    const instructions: TransactionInstruction[] = [];
    const signers: Keypair[] = [verifier];

    // Process each claim request
    for (const r of request) {
      const [userTokenAccount, createATAIx] = await getOrCreateATAInstruction(
        verifier.publicKey,
        mint,
        r.user.publicKey,
        program.provider.connection
      );

      if (createATAIx) {
        instructions.push(createATAIx);
      }

      const bnAmount = new BN(r.amount * 10 ** 6);

      let isBurn = false;
      if (r.amount < 0) {
        isBurn = true;
      }
      const claimIns = await program.methods
        .claim({
          amount: bnAmount,
          isBurn,
        })
        .accounts({
          signer: verifier.publicKey,
          user: r.user.publicKey,
          mint: mint,
          global: globalPDA,
          userTokenAccount: userTokenAccount,
        })
        .instruction();

      instructions.push(claimIns);
      signers.push(r.user);
    }
    const tx = new Transaction();
    tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 }));
    tx.add(...instructions);
    // Send and confirm transaction
    const txHash = await sendAndConfirmTransaction(
      program.provider.connection,
      tx,
      signers,
      confirmOptions
    );

    return txHash;
  } catch (error) {
    console.error("Claims failed:", error);
    throw error;
  }
};

const claimsV0 = async (
  program: Program<Misttoken>,
  mint: PublicKey,
  verifier: Keypair,
  request: UserClaimRequest[]
): Promise<string> => {
  try {
    const connection = program.provider.connection;
    const [globalPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("global")],
      program.programId
    );

    const instructions: TransactionInstruction[] = [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 }),
    ];
    const signers: Keypair[] = [verifier];

    for (const r of request) {
      const [userTokenAccount, createATAIx] = await getOrCreateATAInstruction(
        verifier.publicKey,
        mint,
        r.user.publicKey,
        connection
      );

      if (createATAIx) {
        instructions.push(createATAIx);
      }

      const bnAmount = new BN(r.amount * 10 ** 6);

      let isBurn = false;
      if (r.amount < 0) {
        isBurn = true;
      }
      const claimIns = await program.methods
        .claim({
          amount: bnAmount,
          isBurn,
        })
        .accounts({
          signer: verifier.publicKey,
          user: r.user.publicKey,
          mint: mint,
          global: globalPDA,
          userTokenAccount: userTokenAccount,
        })
        .instruction();

      instructions.push(claimIns);
      signers.push(r.user);
    }
    let latestBlockhash = await connection.getLatestBlockhash("confirmed");
    const messageV0 = new TransactionMessage({
      payerKey: verifier.publicKey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions: instructions,
    }).compileToV0Message();
    const transaction = new VersionedTransaction(messageV0);
    transaction.sign(signers);
    // Send and confirm transaction
    const txHash = connection.sendTransaction(transaction, {
      maxRetries: 5,
      skipPreflight: true,
      preflightCommitment: "confirmed",
    });
    return txHash;
  } catch (error) {
    console.error("Claims failed:", error);
    throw error;
  }
};

app.post("/claims", async (req: express.Request, res: express.Response) => {
  try {
    const { users } = req.body as ClaimBatchRequest;
    const claimRequests = users.map((user) => ({
      user: Keypair.fromSecretKey(Buffer.from(bs58.decode(user.privateKey))),
      amount: user.amount,
    }));

    // Process claims
    const signature = await claimsV0(
      program,
      mint.publicKey,
      verifier,
      claimRequests
    );

    res.status(200).json({
      success: true,
      signature,
      message: "Claims processed successfully",
    });
  } catch (error) {
    console.error("Claim processing error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process claims",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
