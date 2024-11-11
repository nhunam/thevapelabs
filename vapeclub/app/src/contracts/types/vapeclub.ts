/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/vapeclub.json`.
 */
export type Vapeclub = {
  "address": "qSSQdrgbWD7cXNE4S25Gbadkr6Yd878c4vJ7bWApxyD",
  "metadata": {
    "name": "vapeclub",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "claimReward",
      "discriminator": [
        149,
        95,
        181,
        242,
        94,
        90,
        158,
        162
      ],
      "accounts": [
        {
          "name": "rewardData",
          "writable": true,
          "signer": true
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initVapeAccount",
      "discriminator": [
        52,
        33,
        118,
        71,
        59,
        162,
        16,
        63
      ],
      "accounts": [
        {
          "name": "vapeData",
          "writable": true,
          "signer": true
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "updateData",
      "discriminator": [
        62,
        209,
        63,
        231,
        204,
        93,
        148,
        123
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "vapeData",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  112,
                  101,
                  99,
                  108,
                  117,
                  98
                ]
              },
              {
                "kind": "account",
                "path": "signer"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newData",
          "type": {
            "defined": {
              "name": "vapeData"
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "reward",
      "discriminator": [
        174,
        129,
        42,
        212,
        190,
        18,
        45,
        34
      ]
    },
    {
      "name": "vapeData",
      "discriminator": [
        9,
        241,
        149,
        243,
        201,
        249,
        187,
        153
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "numberCastError",
      "msg": "Number cast error"
    }
  ],
  "types": [
    {
      "name": "reward",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "reward",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "vapeData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "puffCount",
            "type": "i64"
          },
          {
            "name": "timeConsume",
            "type": "f64"
          },
          {
            "name": "timeSubmit",
            "type": "f64"
          },
          {
            "name": "estimateNicotinConsume",
            "type": "f64"
          },
          {
            "name": "isValidated",
            "type": "bool"
          },
          {
            "name": "reward",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
