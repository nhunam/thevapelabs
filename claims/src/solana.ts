import { AnchorProvider, BN, Program, setProvider } from "@coral-xyz/anchor";
import { Misttoken } from "./idl/misttoken";
import idl from "./idl/misttoken.json";
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

const loadKeypair = (path: string): Keypair => {
  const secret = Uint8Array.from(
    JSON.parse(readFileSync(path).toString()) as number[]
  );
  return Keypair.fromSecretKey(new Uint8Array(secret));
};

const mint = loadKeypair(
  "keys/mistVpcymdyB5bEMdMJvmCcacjqaL2SeUCw38wyz6MF.json"
);
const authority = loadKeypair("keys/thevapelabs.json");
const verifier = loadKeypair("keys/verifier.json");
const user = loadKeypair("keys/user.json");

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
