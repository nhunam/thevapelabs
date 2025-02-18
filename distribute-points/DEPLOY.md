Run:

```
$ forge create --rpc-url <your_rpc_url> --private-key <your_private_key> src/MyContract.sol:MyContract --chain-id $MONAD_CHAIN_ID --broadcast
```
```
compiling...
success.
Deployer: 0xa735b3c25f...
Deployed to: 0x4054415432...
Transaction hash: 0x6b4e0ff93a...
```

Khi có 2 address thì verify.

```
forge verify-contract --rpc-url https://testnet-rpc.monad.xyz --verifier sourcify --verifier-url 'https://sourcify-api-monad.blockvision.org'  0x464096059a0EaB283F98212735a4f79BC5Ff2C13 src/MistToken.sol:MistToken
```

```
forge verify-contract --rpc-url https://testnet-rpc.monad.xyz --verifier sourcify --verifier-url 'https://sourcify-api-monad.blockvision.org'  0x63d5fdb523A621bD9138CC7adC8B7dCAc2cF2AD2 src/PointSyncer.sol:PointSyncer
```
