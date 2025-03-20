import { Idl } from "@coral-xyz/anchor";

/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/holders.json`.
 */
export const holdersIdl: Idl = {
  "address": "4Co2woPDqhNfG5H7PLvkzUFDMLiuk4PkGyPNdaqEmzyW",
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
        },
        {
          "name": "treasureAuthority",
          "type": "pubkey"
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
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
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
          "name": "controller",
          "type": "pubkey"
        },
        {
          "name": "treasureAuthority",
          "type": "pubkey"
        },
        {
          "name": "gracefulPeriod",
          "type": "i64"
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
    }
  ],
  "events": [
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
      "name": "incorrectSeqno",
      "msg": "Incorrect seqno"
    },
    {
      "code": 6001,
      "name": "incorrectTimestamp",
      "msg": "Incorrect timestamp"
    },
    {
      "code": 6002,
      "name": "incorrectWithdrawA",
      "msg": "Incorrect withdraw a"
    },
    {
      "code": 6003,
      "name": "incorrectWithdrawB",
      "msg": "Incorrect withdraw b"
    },
    {
      "code": 6004,
      "name": "incorrectTransferredA",
      "msg": "Incorrect transferred a"
    },
    {
      "code": 6005,
      "name": "incorrectTransferredB",
      "msg": "Incorrect transferred b"
    },
    {
      "code": 6006,
      "name": "incorrectBalanceA",
      "msg": "Incorrect balance a"
    },
    {
      "code": 6007,
      "name": "incorrectBalanceB",
      "msg": "Incorrect balance b"
    },
    {
      "code": 6008,
      "name": "limitReached",
      "msg": "Limit reached"
    }
  ],
  "types": [
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
    }
  ]
};

