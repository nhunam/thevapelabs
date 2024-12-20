import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Misttoken } from "../target/types/misttoken";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { BN } from "bn.js";
import { assert } from "chai";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

describe("misttoken", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Misttoken as Program<Misttoken>;

  const authority = Keypair.generate();
  console.log(`Authority public key: `, authority.publicKey.toString());

  const verifier = Keypair.generate();
  console.log(`Verifier public key: `, verifier.publicKey.toString());

  const user = Keypair.generate();
  console.log(`User public key: `, user.publicKey.toString());

  const mint = Keypair.generate();
  console.log(`Mist Token: `, mint.publicKey.toString());

  const confirmOptions = {
    skipPreflight: true,
  };

  const [globalPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("global")],
    program.programId
  );

  before(async () => {
    await airdropSol(
      program.provider.connection,
      authority.publicKey,
      100 * LAMPORTS_PER_SOL
    );

    await airdropSol(
      program.provider.connection,
      verifier.publicKey,
      100 * LAMPORTS_PER_SOL
    );
  });

  it("Is initialized!", async () => {
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

    let global = await program.account.global.fetch(globalPDA);
    assert.equal(global.authority.toBase58(), authority.publicKey.toBase58());
    assert.equal(global.initialized, true);
  });

  it("Is claimed!", async () => {
    const userTokenAccount = await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      verifier,
      mint.publicKey,
      user.publicKey
    );

    const mintAmount = new BN(1000 * 10 ** 6);

    const tx = await program.methods
      .claim({
        amount: mintAmount,
        isBurn: false,
      })
      .accounts({
        signer: verifier.publicKey,
        user: user.publicKey,
        mint: mint.publicKey,
        global: globalPDA,
        userTokenAccount: userTokenAccount.address,
      })
      .signers([verifier, user])
      .rpc(confirmOptions);

    const tokenBalance =
      await program.provider.connection.getTokenAccountBalance(
        userTokenAccount.address
      );
    assert.equal(
      tokenBalance.value.uiAmount * 10 ** tokenBalance.value.decimals,
      mintAmount.toNumber()
    );
    console.log("Claim transaction signature", tx);
  });

  it("Is burned!", async () => {
    const userTokenAccount = await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      verifier,
      mint.publicKey,
      user.publicKey
    );

    const oldBalance = await program.provider.connection.getTokenAccountBalance(
      userTokenAccount.address
    );
    console.log("Old balance", oldBalance.value.uiAmount);

    assert.equal(
      oldBalance.value.uiAmount * 10 ** oldBalance.value.decimals > 0,
      true
    );

    const burnAmount = new BN(1000);
    const txBurn = await program.methods
      .claim({
        amount: burnAmount,
        isBurn: true,
      })
      .accounts({
        signer: verifier.publicKey,
        user: user.publicKey,
        mint: mint.publicKey,
        global: globalPDA,
        userTokenAccount: userTokenAccount.address,
      })
      .signers([verifier, user])
      .rpc(confirmOptions);

    const newBalance = await program.provider.connection.getTokenAccountBalance(
      userTokenAccount.address
    );

    assert.equal(
      oldBalance.value.uiAmount * 10 ** oldBalance.value.decimals -
        newBalance.value.uiAmount * 10 ** newBalance.value.decimals,
      burnAmount.toNumber()
    );

    console.log("Burn transaction signature", txBurn);
  });
});

const airdropSol = async (
  connection: anchor.web3.Connection,
  publicKey: anchor.web3.PublicKey,
  amount: number
) => {
  let signature = await connection.requestAirdrop(publicKey, amount);
  return getTxDetails(connection, signature);
};

const getTxDetails = async (
  connection: anchor.web3.Connection,
  signature: string
) => {
  const latestBlockHash = await connection.getLatestBlockhash("processed");

  await connection.confirmTransaction(
    {
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: signature,
    },
    "confirmed"
  );

  return await connection.getTransaction(signature, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });
};
