import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Misttoken } from "../target/types/misttoken";
import { Keypair } from "@solana/web3.js";

describe("misttoken", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Misttoken as Program<Misttoken>;

  const verifier = Keypair.generate();

  it("Is initialized!", async () => {
    const name = "Mist Token";
    const symbol = "MIST";
    const uri = "https://test.com";
    const tx = await program.methods
      .initialize({
        name,
        symbol,
        uri,
        verifier: verifier.publicKey,
      })
      .rpc();
    console.log("Your transaction signature", tx);
  });

  it("Is claimed!", async () => {});
});
