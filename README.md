# thevapeclub

# How to install anchor

Make sure you already have installed `rust` `cargo`
```bash
➜  thevapeclub git:(main) cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
    Updating git repository `https://github.com/coral-xyz/anchor`
       Fetch [===>                     ]  18.65%, 214.04KiB/s 
```

- Select the latest verion

```bash
➜  thevapeclub git:(main) ✗ avm use latest
Version 0.30.1 is not installed. Would you like to install? [y/n] y

➜  thevapeclub git:(main) avm list
```

Add to .zshrc

export PATH=$PATH:/Users/<name>/.avm/bin

- Verify version

```bash
anchor --version
```


# How to start a project by anchor

- Init
```bash
anchor init vape
```


# Structure of TVL data
Q: What kind of data does The Vape Labs collect?

A: The Vape Labs collects data related to user vaping habits, including:

    • Puff count
    • Duration of puff
    • Timestamp of each puff
    • Power adjustment made by the user
    • Estimated nicotine consumption

```

 #[account]
    pub struct VapeData {
        pub data_provider: Pubkey,
        pub puff_count: i64,
        pub time_consume: f64 // duration of each puff
        pub time_submit: []f64 // timestamp of each puff, array of time in rust ?
        pub estimate_nicotin_consume: f64,
        pub is_validated: bool,
        pub reward: u64, // Tokens earned
    }
```


# How to install solana 

```bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"

```
Add to `.zshrc` 

```bash
export PATH="/Users/test/.local/share/solana/install/active_release/bin:$PATH"
```
```bash
➜ solana --version
solana-cli 1.18.25 (src:92ddaa20; feat:3241752014, client:Agave)
```
Check version

## Yarn

Go to vapeclub folder and 

```bash
 ➜  vapeclub git:(main) ✗ cargo build-sbf --force-tools-install
```

# Solana CLI Basic

- Get the current config

```bash 
 ➜ solana config get

Config File: ~/.config/solana/cli/config.yml
RPC URL: https://api.mainnet-beta.solana.com 
WebSocket URL: wss://api.mainnet-beta.solana.com/ (computed)
Keypair Path: ~/.config/solana/id.json 
Commitment: confirmed 
```

- Set url 


```bash
solana config set --url mainnet-beta
solana config set --url devnet
solana config set --url localhost
solana config set --url testnet
solana config set -um    # For mainnet-beta
solana config set -ud    # For devnet
solana config set -ul    # For localhost
solana config set -ut    # For testnet
```

- Create a keypair 

```bash

➜  vapeclub git:(main) ✗ solana-keygen new
Generating a new keypair

For added security, enter a BIP39 passphrase

NOTE! This passphrase improves security of the recovery seed phrase NOT the
keypair file itself, which is stored as insecure plain text

BIP39 Passphrase (empty for none): 

Wrote new keypair to ~/.config/solana/id.json
=================================================================================
pubkey: ByssFwPwwdh7dFuNEJAyVX53fZftDgw2uzP2PZ1wjGBm
=================================================================================
Save this seed phrase and your BIP39 passphrase to recover your new keypair:
enable dish style wonder range height universe vivid addict road giraffe acoustic
```

We have a ~/.config/solana/id.json file

See  Anchor.toml and section provider

```bash

[provider]
cluster = "Localnet"
wallet = "~/.config/solana/id.json"
```
We also have pub key: `8dBTPrjnkXyuQK3KDt9wrZBfizEZijmmUQXVHpFbVwGT`

Get address:
```bash
➜  vapeclub git:(main) ✗ solana address
ByssFwPwwdh7dFuNEJAyVX53fZftDgw2uzP2PZ1wjGBm
```

# Write a smart contract

![alt text](https://solana-developer-content.vercel.app/assets/docs/intro/developer_flow.png)


## Core concepts

Account Model

![](https://solana-developer-content.vercel.app/assets/docs/core/accounts/accounts.svg)

AccountInfo includes the following fields:
- `data`
- `executable`
- `lamports`: SOL = 1 billion lamports

Sytem Program:

- By default, all new accounts are onweed by the SP

![System Account](https://solana-developer-content.vercel.app/assets/docs/core/accounts/system-account.svg)

- Smart contract are refered to as `programs`



![Program Account](https://solana-developer-content.vercel.app/assets/docs/core/accounts/program-account-simple.svg)

![Data Account](https://solana-developer-content.vercel.app/assets/docs/core/accounts/data-account.svg)


We have some steps to be needed remember:

- Invoke the System Program to create an account, which then transfers ownership to a custom program
- Invoke the custom program, which now owns the account, to then initialize the account data as defined in the program code


## Transaction & Instrucstion


![Transaction Simplified](https://solana-developer-content.vercel.app/assets/docs/core/transactions/transaction-simple.svg)

- Sender account must be included as signer `is_signer`
- Sender and recipient accounts must be mutable `is_writable`

![SOL Transfer Process](https://solana-developer-content.vercel.app/assets/docs/core/transactions/sol-transfer-process.svg)


```ts
// Define the amount to transfer
const transferAmount = 0.01; // 0.01 SOL
 
// Create a transfer instruction for transferring SOL from wallet_1 to wallet_2
const transferInstruction = SystemProgram.transfer({
  fromPubkey: sender.publicKey,
  toPubkey: receiver.publicKey,
  lamports: transferAmount * LAMPORTS_PER_SOL, // Convert transferAmount to lamports
});
 
// Add the transfer instruction to a new transaction
const transaction = new Transaction().add(transferInstruction);
```

### Transaction

Consists of:
1. Signatures
2. Message: intructions to be processed atomically


1. Messages
![](https://solana-developer-content.vercel.app/assets/docs/core/transactions/tx_format.png)



![Transaction Message](https://solana-developer-content.vercel.app/assets/docs/core/transactions/legacy_message.png)




# Coding


The flow :

- Step 1. User need to create account when connect to vapeclub smart contract: Instruction: `init_vape_account`. The data of a user should include

```rust
pub struct VapeData {
    pub authority: Pubkey,
    pub puff_count: i64,
    pub time_consume: f64,
    pub time_submit: f64, 
    pub estimate_nicotin_consume: f64,
    pub is_validated: bool,
    pub reward: u64,
    pub bump: u8,
}
```

- Step 2. When user submit the data to the vape club, they need to sign by using `update_data`. This function will update the data of user and reward as well

- Step 3. They can claim to get `token` from `reward` by sign a transaction through `claim_reward` function




# Build anchor


go to `vapeclub` directory 


```bash
anchor build

run `cargo fix --lib -p vapeclub`
```


# Agenda

# Lesson 1: Các khái niệm cơ bản trong Solana  và cách tạo một project sử dụng anchor

# Lesson 2: SPL và Tạo token trong 

# Lesson 3: Xây dựng Dapps NFT sử dụng React on Solana

# Lesson 4: Sử dụng Metaplex để tạo ra smart contract 





# Deploy to solana devnet

```bash
anchor build
anchor deploy --provider.cluster devnet

- Config `Anchor.toml to point to `devnet`
```rust
[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"
```
```bash
➜  vapeclub git:(main) ✗ anchor deploy
Deploying cluster: https://api.devnet.solana.com
Upgrade authority: /Users/phung.anh.tuan/.config/solana/id.json
Deploying program "vapeclub"...
Program path: /Users/phung.anh.tuan/Documents/tuanpa/rust-projects/thevapeclub/vapeclub/target/deploy/vapeclub.so...
=======================================================================
Recover the intermediate account's ephemeral keypair file with
`solana-keygen recover` and the following 12-word seed phrase:
=======================================================================
spend wood trap green turtle wheat tongue reveal news oven renew timber
=======================================================================
To resume a deploy, pass the recovered keypair as the
[BUFFER_SIGNER] to `solana program deploy` or `solana program write-buffer'.
Or to recover the account's lamports, pass it as the
[BUFFER_ACCOUNT_ADDRESS] argument to `solana program close`.
=======================================================================
Error: Account ByssFwPwwdh7dFuNEJAyVX53fZftDgw2uzP2PZ1wjGBm has insufficient funds for spend (1.84849944 SOL) + fee (0.001335 SOL)
There was a problem deploying: Output { status: ExitStatus(unix_wait_status(256)), stdout: "", stderr: "" }.

```bash
➜  vapeclub git:(main) ✗ solana program close --buffers
Error: error sending request for url (https://api.devnet.solana.com/): operation timed out
```


- Connect to program using `idl.json`
https://solana.com/docs/programs/anchor/client-typescript
```ts

import { Program, AnchorProvider, setProvider } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import type { HelloAnchor } from "./idlType";
import idl from "./idl.json";
 
const { connection } = useConnection();
const wallet = useAnchorWallet();
 
const provider = new AnchorProvider(connection, wallet, {});
setProvider(provider);
 
export const program = new Program(idl as HelloAnchor, {
  connection,
});
```