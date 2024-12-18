import { AnchorProvider, BN, Program, setProvider } from "@coral-xyz/anchor";
import { Misttoken } from "../target/types/misttoken";
import idl from "../target/idl/misttoken.json";

import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { readFileSync } from "fs-extra";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

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

const userSecret = Uint8Array.from(
  JSON.parse(readFileSync("keys/user.json").toString()) as number[]
);
const user = Keypair.fromSecretKey(new Uint8Array(userSecret));
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

const main = async () => {
  const userTokenAccount = await getOrCreateAssociatedTokenAccount(
    program.provider.connection,
    verifier,
    mint.publicKey,
    user.publicKey
  );

  const amount = new BN(1000 * 10 ** 6);

  const tx = await program.methods
    .claim({
      amount: amount,
    })
    .accounts({
      signer: verifier.publicKey,
      mint: mint.publicKey,
      global: globalPDA,
      userTokenAccount: userTokenAccount.address,
    })
    .signers([verifier])
    .rpc(confirmOptions);
  console.log("Claim transaction signature", tx);
};

main();
