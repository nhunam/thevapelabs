import { AnchorProvider, Program, setProvider } from "@coral-xyz/anchor";
import { Misttoken } from "../target/types/misttoken";
import idl from "../target/idl/misttoken.json";

import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { readFileSync } from "fs-extra";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

const connection = new Connection(
  "https://devnet.helius-rpc.com/?api-key=1c0f8676-0ead-45f1-a6ed-0e0b16d5b11d"
);

const confirmOptions = {
  skipPreflight: true,
};

const mintSecret = Uint8Array.from(
  JSON.parse(
    readFileSync(
      "keys/mistVpcymdyB5bEMdMJvmCcacjqaL2SeUCw38wyz6MF.json"
    ).toString()
  ) as number[]
);
const mint = Keypair.fromSecretKey(new Uint8Array(mintSecret));
console.log("mint address: ", mint.publicKey.toString());

const authoritySecret = Uint8Array.from(
  JSON.parse(readFileSync("keys/thevapelabs.json").toString()) as number[]
);
const authority = Keypair.fromSecretKey(new Uint8Array(authoritySecret));
console.log("authority address: ", authority.publicKey.toString());

const verifierSecret = Uint8Array.from(
  JSON.parse(readFileSync("keys/verifier.json").toString()) as number[]
);
const verifier = Keypair.fromSecretKey(new Uint8Array(verifierSecret));
console.log("verifier address: ", verifier.publicKey.toString());

const wallet = new NodeWallet(authority);

const provider = new AnchorProvider(
  connection,
  wallet,
  AnchorProvider.defaultOptions()
);

setProvider(provider);

const program = new Program<Misttoken>(idl as Misttoken, provider);

const main = async () => {
  const name = "Mist Token";
  const symbol = "MIST";
  const uri =
    "https://arweave.net/DKCh5pBTvRABEEJvxDeAXhXXAfE8a3hKV2i8TaECznQ7";

  const tx = await program.methods
    .initialize({
      name,
      symbol,
      uri,
      verifier: verifier.publicKey,
    })
    .accounts({
      authority: authority.publicKey,
      mint: mint.publicKey,
    })
    .signers([authority, mint])
    .rpc(confirmOptions);

  console.log("Initialized transaction signature", tx);
};

main();
