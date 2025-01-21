import { Keypair, PublicKey } from "@solana/web3.js";
import dotenv from "dotenv";
import { logger } from "./logger";
import { send } from "./solana";
import bs58 from "bs58";

dotenv.config();

async function main() {
  logger.info("Hello, world!");

  console.log(process.env.RPC_URL);
  console.log(process.env.MINT_ADDRESS);

  const secret = Buffer.from(bs58.decode(process.env.PRIVATE_KEY || ""));
  await send("", {
    keypair: Keypair.fromSecretKey(secret),
    url: process.env.RPC_URL || "",
    mintAddress: new PublicKey(process.env.MINT_ADDRESS || ""),
    isTest: true,
  });
}

main();
