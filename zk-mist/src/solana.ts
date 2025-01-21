import * as web3 from "@solana/web3.js";
import * as splToken from "@solana/spl-token";
import {
  CompressedTokenProgram,
  createTokenPool,
} from "@lightprotocol/compressed-token";
import { buildAndSignTx, createRpc, Rpc } from "@lightprotocol/stateless.js";
import { logger } from "./logger";
import { loadKeypair, sleep } from "./utils/common";
import { getSnapshots, Snapshot } from "./db";

const maxAddressesPerInstruction = 5;
const maxAddressesPerTransaction = 15;
const defaultComputeUnitLimit = 1_000_000;
const defaultComputeUnitPrice = 10_000_000;
const lookupTableAddressDevnet = new web3.PublicKey(
  "qAJZMgnQJ8G6vA3WRcjD9Jan1wtKkaCFWLWskxJrR5V"
);
const lookupTableAddressMainnet = new web3.PublicKey(
  "9NYFyEqPkyXUhkerbGHXUXkvb4qpzeEdHuGpgbgpH1NJ"
);

async function createInstructions(
  keypair: web3.Keypair,
  mintAddress: web3.PublicKey,
  sourceTokenAccount: splToken.Account,
  addresses: web3.PublicKey[],
  amounts: bigint[],
  tokenProgramId: web3.PublicKey
): Promise<web3.TransactionInstruction[]> {
  if (addresses.length === 0) {
    throw new Error("empty addresses");
  }
  if (addresses.length > maxAddressesPerTransaction) {
    throw new Error("limit max addresses per transaction");
  }
  if (addresses.length !== amounts.length) {
    throw new Error("addresses and amounts arrays must have the same length");
  }

  const instructions: web3.TransactionInstruction[] = [];
  const unitLimitIX = web3.ComputeBudgetProgram.setComputeUnitLimit({
    units: defaultComputeUnitLimit,
  });
  instructions.push(unitLimitIX);
  const unitPriceIX = web3.ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: defaultComputeUnitPrice,
  });

  instructions.push(unitPriceIX);

  const batches = Math.ceil(addresses.length / maxAddressesPerInstruction);

  for (let i = 0; i < batches; i++) {
    const batchAddresses = addresses.slice(
      i * maxAddressesPerInstruction,
      (i + 1) * maxAddressesPerInstruction
    );
    const batchAmounts = amounts.slice(
      i * maxAddressesPerInstruction,
      (i + 1) * maxAddressesPerInstruction
    );

    const compressIx = await CompressedTokenProgram.compress({
      payer: keypair.publicKey, // The payer of the transaction.
      owner: keypair.publicKey, // owner of the *uncompressed* token account.
      source: sourceTokenAccount.address, // source (associated) token account address.
      toAddress: batchAddresses, // address to send the compressed tokens to.
      amount: batchAmounts.map((amount) => Number(amount)), // amount of tokens to compress.
      mint: mintAddress,
      tokenProgramId: tokenProgramId,
    });
    instructions.push(compressIx);
  }
  return instructions;
}

async function processBatch(
  connection: Rpc,
  keypair: web3.Keypair,
  lookupTableAccount: web3.AddressLookupTableAccount,
  snapshots: Snapshot[],
  sourceTokenAccount: splToken.Account,
  mintAddress: web3.PublicKey,
  tokenProgramId: web3.PublicKey
): Promise<void> {
  const addresses = [];
  const amounts = [];
  for (const snapshot of snapshots) {
    if (snapshot.points <= 0) {
      logger.info("skipping non positive points");
      continue;
    }
    addresses.push(loadKeypair(snapshot.priv_key).publicKey);
    amounts.push(BigInt(snapshot.points));
  }
  try {
    const instructions = await createInstructions(
      keypair,
      mintAddress,
      sourceTokenAccount,
      addresses,
      amounts,
      tokenProgramId
    );

    const { blockhash } = await connection.getLatestBlockhash();

    const signedTx = buildAndSignTx(
      instructions,
      keypair,
      blockhash,
      undefined,
      [lookupTableAccount]
    );

    const signature = await connection.sendRawTransaction(
      signedTx.serialize(),
      {
        skipPreflight: false,
      }
    );
    logger.info(`Transaction sent: ${signature}`);
    return;
  } catch (error) {
    if (error instanceof web3.SendTransactionError) {
      if (
        error.logs?.includes("Program log: Error: insufficient funds") ||
        error.message.includes("insufficient funds")
      ) {
        throw new Error("insufficient funds");
      }
    } else {
    }
  }
}

export interface Token {
  pubkey: web3.PublicKey;
  name?: string;
  symbol?: string;
  logoURI?: string;
  amount: number;
  decimals: number;
  mintAddress: web3.PublicKey;
  tokenType: "SPL" | "Token-2022";
}

interface GetTokenParams {
  mintAddress: web3.PublicKey;
  url: string;
}

export async function getToken(params: GetTokenParams): Promise<Token | null> {
  const { mintAddress, url } = params;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "helius-airdrop-core",
      method: "getAsset",
      params: {
        id: mintAddress.toBase58(),
      },
    }),
  });

  const data = await response.json();

  if (!data.result) {
    return null;
  }

  const item = data.result;

  if (
    item.interface === "FungibleToken" &&
    (item.token_info?.token_program === splToken.TOKEN_PROGRAM_ID.toBase58() ||
      item.token_info?.token_program ===
        splToken.TOKEN_2022_PROGRAM_ID.toBase58())
  ) {
    return {
      pubkey: new web3.PublicKey(
        item.token_info?.associated_token_address || item.id
      ),
      name: item.content?.metadata?.name,
      symbol: item.token_info?.symbol,
      logoURI: item.content?.links?.image,
      amount: item.token_info?.balance || 0,
      decimals: item.token_info?.decimals || 0,
      mintAddress: new web3.PublicKey(item.id),
      tokenType:
        item.token_info?.token_program === splToken.TOKEN_PROGRAM_ID.toBase58()
          ? "SPL"
          : "Token-2022",
    };
  }

  return null;
}

interface SendParams {
  // The keypair to sign the transactions
  keypair: web3.Keypair;
  // The RPC URL
  url: string;
  // The mint address of the token, shoule be created by signer
  mintAddress: web3.PublicKey;

  // If this is a test, using fake data
  isTest: boolean;
}

export async function send(date: string, params: SendParams) {
  const { keypair, url, mintAddress } = params;
  const connection: Rpc = createRpc(url, url, undefined, {
    commitment: "confirmed",
  });

  const lookupTableAccountDevnet = (
    await connection.getAddressLookupTable(lookupTableAddressDevnet)
  ).value!;
  const lookupTableAccount = lookupTableAccountDevnet;

  const token = await getToken({ mintAddress, url });
  if (!token) {
    throw new Error(
      `Token not found for mint address: ${mintAddress.toBase58()}`
    );
  }

  const tokenProgramId =
    token.tokenType === "SPL"
      ? splToken.TOKEN_PROGRAM_ID
      : splToken.TOKEN_2022_PROGRAM_ID;

  // Get or create the source token account for the mint address
  let sourceTokenAccount: splToken.Account;
  try {
    sourceTokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mintAddress,
      keypair.publicKey,
      undefined,
      undefined,
      undefined,
      tokenProgramId
    );
  } catch (error) {
    throw new Error(
      "Source token account not found and failed to create it. Please add funds to your wallet and try again."
    );
  }

  // Create a token pool for the mint address if it doesn't exist
  try {
    await createTokenPool(
      connection,
      keypair,
      mintAddress,
      undefined,
      tokenProgramId
    );
    logger.info("Token pool created.");
  } catch (error: any) {
    if (error.message.includes("already in use")) {
      logger.info("Token pool already exists. Skipping...");
    } else {
      logger.error("Failed to create token pool:", error);
    }
  }

  const snapshots = await getSnapshots(date, params.isTest);
  const batchSize = maxAddressesPerTransaction;
  let index = 0;

  while (index < snapshots.length) {
    const batch = snapshots.slice(index, index + batchSize);
    await processBatch(
      connection,
      keypair,
      lookupTableAccount,
      batch,
      sourceTokenAccount,
      mintAddress,
      tokenProgramId
    );
    index += batchSize;
    await sleep(1000);
  }
}
