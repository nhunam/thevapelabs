import { FC } from "react";
import { SignMessage } from "../../components/SignMessage";
import { SendTransaction } from "../../components/SendTransaction";
import { SendVersionedTransaction } from "../../components/SendVersionedTransaction";
import { Program, AnchorProvider, setProvider } from "@coral-xyz/anchor";
import idl from "../../contracts/idl/vapeclub.json";
import type { Vapeclub } from "../../contracts/types/vapeclub";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";

export const BasicsView: FC = ({}) => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const handleUpdateData = async () => {
    const provider = new AnchorProvider(connection, wallet, {});
    setProvider(provider);
    const program = new Program(idl as Vapeclub, {
      connection,
    });
    // console.log("kito", program);
    const vapeData = {}; // Define or import VapeData appropriately
    program.methods.updateData(vapeData).accounts({}).signers([]).rpc();
    const accounts = await program.account.vapeData.all();
    console.log("accounts", accounts);
  };

  return (
    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col">
        <h1 className="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mt-10 mb-8">
          Basics
        </h1>
        {/* CONTENT GOES HERE */}
        <div className="text-center">
          <SignMessage />
          <SendTransaction />
          <SendVersionedTransaction />
          <button onClick={() => handleUpdateData()}> Update vape club</button>
        </div>
      </div>
    </div>
  );
};
