import express from "express";
import {
  ConfirmOptions,
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { AnchorProvider, BN, Program, setProvider } from "@coral-xyz/anchor";
import { Misttoken } from "./idl/misttoken";
import idl from "./idl/misttoken.json";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { readFileSync } from "fs";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

const app = express();
const PORT: number = 3000;

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
      const claimIx = await program.methods
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

      instructions.push(claimIx);
      signers.push(r.user);
    }

    // Send and confirm transaction
    const tx = await sendAndConfirmTransaction(
      program.provider.connection,
      new Transaction().add(...instructions),
      signers,
      confirmOptions
    );

    return tx;
  } catch (error) {
    console.error("Claims failed:", error);
    throw error;
  }
};

const getOrCreateATAInstruction = async (
  payer: PublicKey,
  mint: PublicKey,
  user: PublicKey,
  connection: Connection
): Promise<[PublicKey, TransactionInstruction?]> => {
  let toAccount;
  try {
    toAccount = getAssociatedTokenAddressSync(mint, user);
    const account = await connection.getAccountInfo(toAccount);
    if (!account) {
      const ix = createAssociatedTokenAccountInstruction(
        payer,
        toAccount,
        user,
        mint
      );
      return [toAccount, ix];
    }
    return [toAccount, undefined];
  } catch (e) {
    console.error("Error::getOrCreateATAInstruction", e);
    throw e;
  }
};

const loadKeypair = (path: string): Keypair => {
  const secret = Uint8Array.from(
    JSON.parse(readFileSync(path).toString()) as number[]
  );
  return Keypair.fromSecretKey(new Uint8Array(secret));
};

const confirmOptions = {
  skipPreflight: true,
};

const connection = new Connection(
  "https://devnet.helius-rpc.com/?api-key=1c0f8676-0ead-45f1-a6ed-0e0b16d5b11d"
);

const mint = loadKeypair(
  "/Users/tiennv/work/ext/thevapelabs/claims/src/keys/mistVpcymdyB5bEMdMJvmCcacjqaL2SeUCw38wyz6MF.json"
);
const authority = loadKeypair(
  "/Users/tiennv/work/ext/thevapelabs/claims/src/keys/thevapelabs.json"
);
const verifier = loadKeypair(
  "/Users/tiennv/work/ext/thevapelabs/claims/src/keys/verifier.json"
);

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

app.post("/claims", async (req: express.Request, res: express.Response) => {
  try {
    const { users } = req.body as ClaimBatchRequest;
    const claimRequests = users.map((user) => ({
      user: Keypair.fromSecretKey(Buffer.from(bs58.decode(user.privateKey))),
      amount: user.amount,
    }));

    // Process claims
    const signature = await claims(
      program,
      mint.publicKey,
      verifier,
      claimRequests,
      confirmOptions
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
