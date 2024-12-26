import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { readFileSync } from "fs";

export const getOrCreateATAInstruction = async (
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

export const loadKeypair = (path: string): Keypair => {
  const secret = Uint8Array.from(
    JSON.parse(readFileSync(path).toString()) as number[]
  );
  return Keypair.fromSecretKey(new Uint8Array(secret));
};
