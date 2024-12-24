import { AnchorProvider, BN, Program, setProvider } from "@coral-xyz/anchor";
import { Misttoken } from "./idl/misttoken";
import idl from "./idl/misttoken.json";
import {
  ConfirmOptions,
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { readFileSync } from "fs-extra";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

const connection = new Connection(
  "https://devnet.helius-rpc.com/?api-key=1c0f8676-0ead-45f1-a6ed-0e0b16d5b11d"
);

const confirmOptions = {
  skipPreflight: true,
};

const loadKeypair = (path: string): Keypair => {
  const secret = Uint8Array.from(
    JSON.parse(readFileSync(path).toString()) as number[]
  );
  return Keypair.fromSecretKey(new Uint8Array(secret));
};

const mint = loadKeypair(
  "./src/keys/mistVpcymdyB5bEMdMJvmCcacjqaL2SeUCw38wyz6MF.json"
);
const authority = loadKeypair(
  "./src/keys/thevapelabs.json"
);
const verifier = loadKeypair(
  "./src/keys/verifier.json"
);
const user = loadKeypair(
  "./src/keys/user.json"
);

console.log("mint address: ", mint.publicKey.toString());
console.log("authority address: ", authority.publicKey.toString());
console.log("verifier address: ", verifier.publicKey.toString());
console.log("user address: ", user.publicKey.toString());

const wallet = new NodeWallet(authority);

const provider = new AnchorProvider(
  connection,
  wallet,
  AnchorProvider.defaultOptions()
);

setProvider(provider);

const program = new Program<Misttoken>(idl as Misttoken, provider);

console.log("program id: ", program.programId.toString());

const [globalPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("global")],
  program.programId
);

interface UserClaimRequest {
  user: Keypair;
  amount: number;
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
    console.error('Claims failed:', error);
    throw error;
  }
};

export const claim = async (
  program: Program<Misttoken>,
  mint: PublicKey,
  verifier: Keypair,
  user: Keypair,
  amount: number,
  isBurn: boolean = true,
  confirmOptions: ConfirmOptions
): Promise<string> => {
  try {
    const [globalPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("global")],
      program.programId
    );

    const [userTokenAccount, createUserMoveAtaTx] = await getOrCreateATAInstruction(verifier.publicKey, mint, user.publicKey, program.provider.connection);
    const preInstructions: Array<TransactionInstruction> = [];
    createUserMoveAtaTx && preInstructions.push(createUserMoveAtaTx);

    const bnAmount = new BN(amount * 10 ** 6);

    const tx = await program.methods
      .claim({
        amount: bnAmount,
        isBurn,
      })
      .accounts({
        signer: verifier.publicKey,
        user: user.publicKey,
        mint: mint,
        global: globalPDA,
        userTokenAccount: userTokenAccount,
      })
      .preInstructions(preInstructions)
      .transaction();
    const txHash = await sendAndConfirmTransaction(connection, tx, [verifier, user], confirmOptions);
    return txHash;
  } catch (error) {
    console.error("Claim failed:", error);
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

export const getPrivateKeyHex = (keypair: Keypair): string => {
  return Buffer.from(keypair.secretKey).toString('hex');
}

const main = async () => {
  // const tx = await claims(
  //   program,
  //   mint.publicKey,
  //   verifier,
  //   [
  //     {
  //       user,
  //       amount: 100,
  //     },
  //     {
  //       user,
  //       amount: 200,
  //     }
  //   ],
  //   confirmOptions
  // );
  // console.log("Claim transaction signature", tx);
};

main();
