import { Idl } from "@coral-xyz/anchor";

/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/holders.json`.
 */
export const holdersIdl: Idl = {
  "address": "6bES2dKy1ee13HQ4uW4ycw4Kw4od9ziZeWMyAxVySYEd",
  "metadata": {
    "name": "holders",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "addToWhitelist",
      "discriminator": [
        157,
        211,
        52,
        54,
        144,
        81,
        5,
        55
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "root"
          ]
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "root",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "rootSeed"
              }
            ]
          }
        },
        {
          "name": "recipientTokenAccount"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "rootSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "allocateWithdrawals",
      "discriminator": [
        223,
        55,
        64,
        247,
        72,
        82,
        44,
        43
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "root",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "rootSeed"
              }
            ]
          }
        },
        {
          "name": "card",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "cardTokenAccount"
              }
            ]
          }
        },
        {
          "name": "cardTokenAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  114,
                  100,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "cardSeed"
              },
              {
                "kind": "account",
                "path": "root"
              }
            ]
          }
        },
        {
          "name": "withdrawals",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  119,
                  105,
                  116,
                  104,
                  100,
                  114,
                  97,
                  119,
                  97,
                  108,
                  115
                ]
              },
              {
                "kind": "arg",
                "path": "cardSeed"
              },
              {
                "kind": "account",
                "path": "root"
              }
            ]
          }
        },
        {
          "name": "withdrawalsTokenAccount",
          "writable": true
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "rootSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "cardSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "assignNewTreasureAuthority",
      "discriminator": [
        165,
        2,
        203,
        251,
        150,
        203,
        101,
        144
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "root"
          ]
        },
        {
          "name": "treasureAuthority"
        },
        {
          "name": "root",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "rootSeed"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "rootSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "treasureAuthority",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "cancelWithdrawal",
      "discriminator": [
        183,
        104,
        181,
        250,
        28,
        128,
        210,
        70
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "root",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "rootSeed"
              }
            ]
          }
        },
        {
          "name": "card",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "cardTokenAccount"
              }
            ]
          }
        },
        {
          "name": "cardTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  114,
                  100,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "cardSeed"
              },
              {
                "kind": "account",
                "path": "root"
              }
            ]
          }
        },
        {
          "name": "withdrawals",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  119,
                  105,
                  116,
                  104,
                  100,
                  114,
                  97,
                  119,
                  97,
                  108,
                  115
                ]
              },
              {
                "kind": "arg",
                "path": "cardSeed"
              },
              {
                "kind": "account",
                "path": "root"
              }
            ]
          }
        },
        {
          "name": "withdrawalsTokenAccount",
          "writable": true
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "rootSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "cardSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "withdrawalSeqno",
          "type": "u32"
        }
      ]
    },
    {
      "name": "changeController",
      "discriminator": [
        191,
        5,
        46,
        10,
        82,
        189,
        89,
        219
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "root"
          ]
        },
        {
          "name": "controller"
        },
        {
          "name": "root",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "rootSeed"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "rootSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "controller",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "changeGracefulPeriod",
      "discriminator": [
        145,
        4,
        98,
        5,
        20,
        246,
        158,
        126
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "root"
          ]
        },
        {
          "name": "root",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "rootSeed"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "rootSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "gracefulPeriod",
          "type": "i64"
        }
      ]
    },
    {
      "name": "closeCard",
      "discriminator": [
        142,
        206,
        170,
        182,
        227,
        204,
        185,
        115
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "writable": true,
          "relations": [
            "card"
          ]
        },
        {
          "name": "root",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "rootSeed"
              }
            ]
          }
        },
        {
          "name": "treasureTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  101,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "root"
              }
            ]
          }
        },
        {
          "name": "card",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "cardTokenAccount"
              }
            ]
          }
        },
        {
          "name": "cardTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  114,
                  100,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "cardSeed"
              },
              {
                "kind": "account",
                "path": "root"
              }
            ]
          }
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "rootSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "cardSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "createRoot",
      "discriminator": [
        115,
        195,
        96,
        208,
        249,
        205,
        56,
        27
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "controller"
        },
        {
          "name": "supportAuthority"
        },
        {
          "name": "root",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "rootSeed"
              }
            ]
          }
        },
        {
          "name": "treasureAuthority"
        },
        {
          "name": "treasureTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  101,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "root"
              }
            ]
          }
        },
        {
          "name": "withdrawalController"
        },
        {
          "name": "withdrawalTreasury"
        },
        {
          "name": "tokenMint"
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
      "args": [
        {
          "name": "rootSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "gracefulPeriod",
          "type": "i64"
        }
      ]
    },
    {
      "name": "deleteCard",
      "discriminator": [
        199,
        58,
        181,
        228,
        23,
        155,
        200,
        173
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "controller",
          "writable": true
        },
        {
          "name": "authority",
          "writable": true,
          "relations": [
            "card"
          ]
        },
        {
          "name": "root",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "rootSeed"
              }
            ]
          }
        },
        {
          "name": "card",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "cardTokenAccount"
              }
            ]
          }
        },
        {
          "name": "cardTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  114,
                  100,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "cardSeed"
              },
              {
                "kind": "account",
                "path": "root"
              }
            ]
          }
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "rootSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "cardSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "depositCard",
      "discriminator": [
        221,
        131,
        111,
        52,
        236,
        215,
        120,
        228
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "root",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "rootSeed"
              }
            ]
          }
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "senderTokenAccount",
          "writable": true
        },
        {
          "name": "card",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "cardTokenAccount"
              }
            ]
          }
        },
        {
          "name": "cardTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  114,
                  100,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "cardSeed"
              },
              {
                "kind": "account",
                "path": "root"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "rootSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "cardSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "executeWithdrawal",
      "discriminator": [
        113,
        121,
        203,
        232,
        137,
        139,
        248,
        249
      ],
      "accounts": [
        {
          "name": "withdrawalController",
          "writable": true,
          "signer": true
        },
        {
          "name": "cardAuthority",
          "signer": true
        },
        {
          "name": "cardAuthorityTokenAccount"
        },
        {
          "name": "root",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "rootSeed"
              }
            ]
          }
        },
        {
          "name": "card",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "cardTokenAccount"
              }
            ]
          }
        },
        {
          "name": "cardTokenAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  114,
                  100,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "cardSeed"
              },
              {
                "kind": "account",
                "path": "root"
              }
            ]
          }
        },
        {
          "name": "withdrawals",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  119,
                  105,
                  116,
                  104,
                  100,
                  114,
                  97,
                  119,
                  97,
                  108,
                  115
                ]
              },
              {
                "kind": "arg",
                "path": "cardSeed"
              },
              {
                "kind": "account",
                "path": "root"
              }
            ]
          }
        },
        {
          "name": "withdrawalsTokenAccount",
          "writable": true
        },
        {
          "name": "destinationTokenAccount",
          "writable": true
        },
        {
          "name": "withdrawalTreasury"
        },
        {
          "name": "withdrawalTreasuryTokenAccount",
          "writable": true
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "rootSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "cardSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "withdrawalSeqno",
          "type": "u32"
        },
        {
          "name": "feeAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "fixIncorrectDeposit",
      "discriminator": [
        158,
        48,
        134,
        50,
        85,
        60,
        29,
        32
      ],
      "accounts": [
        {
          "name": "supportAuthority",
          "writable": true,
          "signer": true
        },
        {
          "name": "controller",
          "writable": true,
          "relations": [
            "root"
          ]
        },
        {
          "name": "root",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "rootSeed"
              }
            ]
          }
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "cardTokenAccountFrom",
          "writable": true
        },
        {
          "name": "cardTokenAccountTo",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  114,
                  100,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "cardSeed"
              },
              {
                "kind": "account",
                "path": "root"
              }
            ]
          }
        },
        {
          "name": "card",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "cardTokenAccountTo"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "rootSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "cardSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "issueCard",
      "discriminator": [
        85,
        225,
        118,
        108,
        55,
        196,
        187,
        32
      ],
      "accounts": [
        {
          "name": "controller",
          "writable": true,
          "signer": true,
          "relations": [
            "root"
          ]
        },
        {
          "name": "root",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "rootSeed"
              }
            ]
          }
        },
        {
          "name": "card",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "cardTokenAccount"
              }
            ]
          }
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "authorityTokenAccount"
        },
        {
          "name": "cardTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  114,
                  100,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "cardSeed"
              },
              {
                "kind": "account",
                "path": "root"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "rootSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "cardSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "tzOffset",
          "type": "i32"
        }
      ]
    },
    {
      "name": "refund",
      "discriminator": [
        2,
        96,
        183,
        251,
        63,
        208,
        46,
        46
      ],
      "accounts": [
        {
          "name": "treasureAuthority",
          "writable": true,
          "signer": true,
          "relations": [
            "root"
          ]
        },
        {
          "name": "root",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "rootSeed"
              }
            ]
          }
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "treasureTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  101,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "root"
              }
            ]
          }
        },
        {
          "name": "card",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "cardTokenAccount"
              }
            ]
          }
        },
        {
          "name": "cardTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  114,
                  100,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "cardSeed"
              },
              {
                "kind": "account",
                "path": "root"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "rootSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "cardSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "queryId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "removeFromWhitelist",
      "discriminator": [
        7,
        144,
        216,
        239,
        243,
        236,
        193,
        235
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "root"
          ]
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "root",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "rootSeed"
              }
            ]
          }
        },
        {
          "name": "recipientTokenAccount"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "rootSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "resetWhitelist",
      "discriminator": [
        63,
        65,
        221,
        162,
        75,
        79,
        86,
        174
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "root"
          ]
        },
        {
          "name": "root",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "rootSeed"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "rootSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "setSupportAuthority",
      "discriminator": [
        180,
        237,
        50,
        89,
        95,
        203,
        215,
        156
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "root"
          ]
        },
        {
          "name": "supportAuthority"
        },
        {
          "name": "root",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "rootSeed"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "rootSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "setWithdrawalConfig",
      "discriminator": [
        222,
        0,
        218,
        19,
        105,
        74,
        204,
        211
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "root"
          ]
        },
        {
          "name": "withdrawalController"
        },
        {
          "name": "withdrawalTreasury"
        },
        {
          "name": "root",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "rootSeed"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "rootSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "syncCardBalance",
      "discriminator": [
        29,
        234,
        106,
        252,
        50,
        237,
        78,
        42
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "root",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "rootSeed"
              }
            ]
          }
        },
        {
          "name": "tokenMint",
          "writable": true
        },
        {
          "name": "card",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "cardTokenAccount"
              }
            ]
          }
        },
        {
          "name": "cardTokenAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  114,
                  100,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "cardSeed"
              },
              {
                "kind": "account",
                "path": "root"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "rootSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "cardSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "updateCardLimits",
      "discriminator": [
        139,
        136,
        98,
        120,
        163,
        16,
        216,
        197
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "root",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "rootSeed"
              }
            ]
          }
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "authority",
          "relations": [
            "card"
          ]
        },
        {
          "name": "card",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "cardTokenAccount"
              }
            ]
          }
        },
        {
          "name": "cardTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  114,
                  100,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "cardSeed"
              },
              {
                "kind": "account",
                "path": "root"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "rootSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "cardSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "newOnetime",
          "type": "u64"
        },
        {
          "name": "newDaily",
          "type": "u64"
        },
        {
          "name": "newMonthly",
          "type": "u64"
        },
        {
          "name": "newSeqno",
          "type": "u32"
        }
      ]
    },
    {
      "name": "updateCardState",
      "discriminator": [
        143,
        199,
        250,
        162,
        184,
        67,
        241,
        82
      ],
      "accounts": [
        {
          "name": "controller",
          "writable": true,
          "signer": true,
          "relations": [
            "root"
          ]
        },
        {
          "name": "root",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "rootSeed"
              }
            ]
          }
        },
        {
          "name": "treasureTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  101,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "root"
              }
            ]
          }
        },
        {
          "name": "recipientTokenAccount",
          "writable": true
        },
        {
          "name": "card",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "cardTokenAccount"
              }
            ]
          }
        },
        {
          "name": "cardTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  114,
                  100,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "cardSeed"
              },
              {
                "kind": "account",
                "path": "root"
              }
            ]
          }
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "rootSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "cardSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "state",
          "type": {
            "defined": {
              "name": "updateCardData"
            }
          }
        },
        {
          "name": "limitsSeqno",
          "type": "u32"
        }
      ]
    },
    {
      "name": "updateCardStateV2",
      "discriminator": [
        104,
        88,
        177,
        106,
        101,
        131,
        218,
        212
      ],
      "accounts": [
        {
          "name": "controller",
          "writable": true,
          "signer": true,
          "relations": [
            "root"
          ]
        },
        {
          "name": "root",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "rootSeed"
              }
            ]
          }
        },
        {
          "name": "treasureTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  101,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "root"
              }
            ]
          }
        },
        {
          "name": "cardAuthority",
          "writable": true
        },
        {
          "name": "card",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "cardTokenAccount"
              }
            ]
          }
        },
        {
          "name": "cardTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  114,
                  100,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "cardSeed"
              },
              {
                "kind": "account",
                "path": "root"
              }
            ]
          }
        },
        {
          "name": "withdrawals",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  119,
                  105,
                  116,
                  104,
                  100,
                  114,
                  97,
                  119,
                  97,
                  108,
                  115
                ]
              },
              {
                "kind": "arg",
                "path": "cardSeed"
              },
              {
                "kind": "account",
                "path": "root"
              }
            ]
          }
        },
        {
          "name": "withdrawalsTokenAccount",
          "writable": true
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "rootSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "cardSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "state",
          "type": {
            "defined": {
              "name": "updateCardDataV2"
            }
          }
        },
        {
          "name": "limitsSeqno",
          "type": "u32"
        }
      ]
    },
    {
      "name": "withdrawFromTreasure",
      "discriminator": [
        223,
        238,
        204,
        12,
        224,
        1,
        29,
        134
      ],
      "accounts": [
        {
          "name": "treasureAuthority",
          "writable": true,
          "signer": true,
          "relations": [
            "root"
          ]
        },
        {
          "name": "root",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "rootSeed"
              }
            ]
          }
        },
        {
          "name": "treasureTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  101,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "root"
              }
            ]
          }
        },
        {
          "name": "recipientTokenAccount",
          "writable": true
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "rootSeed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "card",
      "discriminator": [
        166,
        250,
        46,
        230,
        152,
        63,
        140,
        182
      ]
    },
    {
      "name": "root",
      "discriminator": [
        46,
        159,
        131,
        37,
        245,
        84,
        5,
        9
      ]
    },
    {
      "name": "withdrawals",
      "discriminator": [
        180,
        60,
        32,
        127,
        107,
        92,
        120,
        74
      ]
    }
  ],
  "events": [
    {
      "name": "canceledWithdrawal",
      "discriminator": [
        213,
        1,
        107,
        62,
        62,
        25,
        147,
        0
      ]
    },
    {
      "name": "executedWithdrawal",
      "discriminator": [
        7,
        193,
        241,
        41,
        55,
        11,
        106,
        112
      ]
    },
    {
      "name": "refunded",
      "discriminator": [
        35,
        103,
        149,
        246,
        196,
        123,
        221,
        99
      ]
    },
    {
      "name": "updatedCard",
      "discriminator": [
        213,
        115,
        105,
        7,
        254,
        239,
        150,
        134
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "incorrectTzOffset"
    },
    {
      "code": 6001,
      "name": "incorrectSeqno"
    },
    {
      "code": 6002,
      "name": "incorrectTimestamp"
    },
    {
      "code": 6003,
      "name": "incorrectWithdrawA"
    },
    {
      "code": 6004,
      "name": "incorrectWithdrawB"
    },
    {
      "code": 6005,
      "name": "incorrectTransferredA"
    },
    {
      "code": 6006,
      "name": "incorrectTransferredB"
    },
    {
      "code": 6007,
      "name": "incorrectBalanceA"
    },
    {
      "code": 6008,
      "name": "incorrectBalanceB"
    },
    {
      "code": 6009,
      "name": "limitReached"
    },
    {
      "code": 6010,
      "name": "incosistentReservedBalance"
    },
    {
      "code": 6011,
      "name": "incorrectBalance"
    },
    {
      "code": 6012,
      "name": "incorrectNewLimits"
    },
    {
      "code": 6013,
      "name": "incorrectNewSeqno"
    },
    {
      "code": 6014,
      "name": "tooManyPendingLimits"
    },
    {
      "code": 6015,
      "name": "gracefulPeriodInProgress"
    },
    {
      "code": 6016,
      "name": "inconsistentBalanceA"
    },
    {
      "code": 6017,
      "name": "inconsistentBalanceB"
    },
    {
      "code": 6018,
      "name": "notWhitelisted"
    },
    {
      "code": 6019,
      "name": "alreadyWhitelisted"
    },
    {
      "code": 6020,
      "name": "depositAOverflow"
    },
    {
      "code": 6021,
      "name": "newWithdrawnAOverflow"
    },
    {
      "code": 6022,
      "name": "newWithdrawnBOverflow"
    },
    {
      "code": 6023,
      "name": "depositBOverflow"
    },
    {
      "code": 6024,
      "name": "withdrawnAOverflow"
    },
    {
      "code": 6025,
      "name": "withdrawnBOverflow"
    },
    {
      "code": 6026,
      "name": "transferredAUnderflow"
    },
    {
      "code": 6027,
      "name": "noWithdrawalBySeqno"
    },
    {
      "code": 6028,
      "name": "incorrectWithdrawalAmounts"
    },
    {
      "code": 6029,
      "name": "notAuthorized"
    },
    {
      "code": 6030,
      "name": "maxWithdrawalsExceeded"
    },
    {
      "code": 6031,
      "name": "maxWithdrawalSeqnoExceeded"
    }
  ],
  "types": [
    {
      "name": "canceledWithdrawal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "seqno",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "card",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "tokenAccount",
            "type": "pubkey"
          },
          {
            "name": "seed",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "seqno",
            "type": "u32"
          },
          {
            "name": "lastStateAt",
            "type": "i64"
          },
          {
            "name": "transferredA",
            "type": "u64"
          },
          {
            "name": "transferredB",
            "type": "u64"
          },
          {
            "name": "depositedA",
            "type": "u64"
          },
          {
            "name": "depositedB",
            "type": "u64"
          },
          {
            "name": "withdrawnA",
            "type": "u64"
          },
          {
            "name": "withdrawnB",
            "type": "u64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "cardStatus"
              }
            }
          },
          {
            "name": "deadline",
            "type": "i64"
          },
          {
            "name": "tzOffset",
            "type": {
              "defined": {
                "name": "tzOffset"
              }
            }
          },
          {
            "name": "limits",
            "type": {
              "defined": {
                "name": "limits"
              }
            }
          }
        ]
      }
    },
    {
      "name": "cardStatus",
      "repr": {
        "kind": "rust"
      },
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "active"
          },
          {
            "name": "requestCloseA"
          },
          {
            "name": "closed"
          }
        ]
      }
    },
    {
      "name": "executedWithdrawal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "seqno",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "limits",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "onetime",
            "type": "u64"
          },
          {
            "name": "daily",
            "type": "u64"
          },
          {
            "name": "monthly",
            "type": "u64"
          },
          {
            "name": "spentDaily",
            "type": "u64"
          },
          {
            "name": "spentMonthly",
            "type": "u64"
          },
          {
            "name": "dailyDeadline",
            "type": "i64"
          },
          {
            "name": "monthlyDeadline",
            "type": "i64"
          },
          {
            "name": "seqno",
            "type": "u32"
          },
          {
            "name": "pendingLimitsQueue",
            "type": {
              "defined": {
                "name": "orderedList",
                "generics": [
                  {
                    "kind": "const",
                    "value": "5"
                  }
                ]
              }
            }
          }
        ]
      }
    },
    {
      "name": "orderedList",
      "generics": [
        {
          "kind": "const",
          "name": "l",
          "type": "usize"
        }
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "inner",
            "type": {
              "vec": {
                "defined": {
                  "name": "pendingLimits"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "pendingLimits",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "onetime",
            "type": "u64"
          },
          {
            "name": "daily",
            "type": "u64"
          },
          {
            "name": "monthly",
            "type": "u64"
          },
          {
            "name": "seqno",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "refunded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "queryId",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "root",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "seed",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "controller",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "gracefulPeriod",
            "type": "i64"
          },
          {
            "name": "treasureAuthority",
            "type": "pubkey"
          },
          {
            "name": "treasureTokenAccount",
            "type": "pubkey"
          },
          {
            "name": "whitelist",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "supportAuthority",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "withdrawalConfig",
            "type": {
              "option": {
                "defined": {
                  "name": "withdrawalConfig"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "tzOffset",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "value",
            "type": "i32"
          }
        ]
      }
    },
    {
      "name": "updateCardData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "seqno",
            "type": "u32"
          },
          {
            "name": "transferredA",
            "type": "u64"
          },
          {
            "name": "transferredB",
            "type": "u64"
          },
          {
            "name": "withdrawA",
            "type": "u64"
          },
          {
            "name": "withdrawB",
            "type": "u64"
          },
          {
            "name": "close",
            "type": "bool"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "updateCardDataV2",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "seqno",
            "type": "u32"
          },
          {
            "name": "transferredA",
            "type": "u64"
          },
          {
            "name": "transferredB",
            "type": "u64"
          },
          {
            "name": "withdrawA",
            "type": "u64"
          },
          {
            "name": "withdrawB",
            "type": "u64"
          },
          {
            "name": "close",
            "type": "bool"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "isMultisigWithdrawalA",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "updatedCard",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "tokenAccount",
            "type": "pubkey"
          },
          {
            "name": "seed",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "seqno",
            "type": "u32"
          },
          {
            "name": "lastStateAt",
            "type": "i64"
          },
          {
            "name": "transferredA",
            "type": "u64"
          },
          {
            "name": "transferredB",
            "type": "u64"
          },
          {
            "name": "depositedA",
            "type": "u64"
          },
          {
            "name": "depositedB",
            "type": "u64"
          },
          {
            "name": "withdrawnA",
            "type": "u64"
          },
          {
            "name": "withdrawnB",
            "type": "u64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "cardStatus"
              }
            }
          },
          {
            "name": "deadline",
            "type": "i64"
          },
          {
            "name": "tzOffset",
            "type": {
              "defined": {
                "name": "tzOffset"
              }
            }
          },
          {
            "name": "limits",
            "type": {
              "defined": {
                "name": "limits"
              }
            }
          }
        ]
      }
    },
    {
      "name": "withdrawal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "seqno",
            "type": "u32"
          },
          {
            "name": "totalAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "withdrawalConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "controller",
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "withdrawals",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "seqno",
            "type": "u32"
          },
          {
            "name": "withdrawals",
            "type": {
              "vec": {
                "defined": {
                  "name": "withdrawal"
                }
              }
            }
          }
        ]
      }
    }
  ]
};
