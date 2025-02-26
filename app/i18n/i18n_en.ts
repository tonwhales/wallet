import { LocalizationSchema, PrepareSchema } from "./schema";

const schema: PrepareSchema<LocalizationSchema, "" | "_plural"> = {
    "lang": "en",
    "common": {
        "and": "and",
        "accept": "Accept",
        "start": "Start",
        "continue": "Continue",
        "continueAnyway": "Continue anyway",
        "back": "Back",
        "logout": "Log Out",
        "logoutFrom": "Log Out from {{name}}",
        "cancel": "Cancel",
        "balance": "Balance",
        "totalBalance": "Total balance",
        "walletAddress": "Wallet address",
        "recipientAddress": "Recipient address",
        "recipient": "Recipient",
        "copy": "Copy",
        "copiedAlert": "Copied to clipboard",
        "copied": "Copied",
        "share": "Share",
        "send": "Send",
        "yes": "Yes",
        "no": "No",
        "amount": "Amount",
        "today": "Today",
        "yesterday": "Yesterday",
        "comment": "Comment",
        "products": "Products",
        "confirm": "Confirm",
        "soon": "soon",
        "in": "in",
        "max": "Max",
        "close": "Close",
        "delete": "Delete",
        "apply": "Apply",
        "domainOrAddress": "Wallet address or domain",
        "domainOrAddressOrContact": "Address, domain or name",
        "domain": "Domain",
        "search": "Search",
        "termsOfService": "Terms\u00A0Of\u00A0Service",
        "privacyPolicy": "Privacy\u00A0Policy",
        "apy": "APY",
        "tx": "Transaction",
        "add": "Add",
        "connect": "Connect",
        "gotIt": "Got it",
        "error": "Error",
        "wallet": "Wallet",
        "wallets": "Wallets",
        "later": "Later",
        "select": "Select",
        "show": "Show",
        "hide": "Hide",
        "showAll": "Show all",
        "hideAll": "Hide all",
        "done": "Done",
        "mainWallet": "Main wallet",
        "walletName": "Wallet name",
        "from": "From",
        "to": "To",
        "transaction": "Transaction",
        "somethingWentWrong": "Something went wrong",
        "checkInternetConnection": "Check your internet connection",
        "reload": "Reload",
        "errorOccurred": "Error occurred: {{error}}",
        "recent": "Recent",
        "ok": "OK",
        "attention": "Attention",
        "save": "Save",
        "assets": "Assets",
        "message": "Message",
        "messages": "Messages",
        "airdrop": "Airdrop",
        "myWallets": "My wallets",
        "showMore": "Show more",
        "balances": "Balances",
        "loading": "Loading...",
        "notFound": "Not found",
        "unverified": "Unverified",
        "addressBook": "Address book",
        "gasless": "Gasless",
        "address": "Address",
        "currencyChanged": "Currency changed",
        "required": "required"
    },
    "syncStatus": {
        "connecting": "Connecting",
        "updating": "Updating",
        "online": "Connected"
    },
    "home": {
        "home": "Home",
        "history": "History",
        "browser": "Browser",
        "more": "More"
    },
    "settings": {
        "title": "More",
        "backupKeys": "Backup keys",
        "holdersAccounts": "Spending accounts",
        "migrateOldWallets": "Migrate old wallets",
        "termsOfService": "Terms of Service",
        "privacyPolicy": "Privacy policy",
        "developerTools": "Developer Tools",
        "spamFilter": "SPAM filter",
        "primaryCurrency": "Primary currency",
        "experimental": "Experimental",
        "support": {
            "title": "Support",
            "telegram": "Telegram",
            "form": "Support form",
            "holders": "Bank card & accounts",
            "tonhub": "Tonhub"
        },
        "telegram": "Telegram",
        "rateApp": "Rate app",
        "deleteAccount": "Delete account",
        "theme": "Theme",
        "searchEngine": "Search engine",
        "language": "Language"
    },
    "theme": {
        "title": "Theme",
        "light": "Light",
        "dark": "Dark",
        "system": "System"
    },
    "wallet": {
        "sync": "Downloading wallet data",
        "balanceTitle": "Ton balance",
        "actions": {
            "receive": "Receive",
            "send": "Send",
            "buy": "Buy",
            "swap": "Swap",
            "deposit": "Deposit"
        },
        "empty": {
            "message": "You have no transactions",
            "receive": "Receive TON",
            "description": "Make your first transaction"
        },
        "pendingTransactions": "Pending transactions"
    },
    "transactions": {
        "title": "Transactions",
        "history": "History",
        "filter": {
            "holders": "Cards",
            "ton": "Wallet transactions",
            "any": "All",
            "type": "Type",
            "accounts": "Spendings",
        }
    },
    "tx": {
        "sending": "Sending",
        "sent": "Sent",
        "received": "Received",
        "bounced": "Bounced",
        "tokenTransfer": "Token transfer",
        "airdrop": "Airdrop",
        "failed": "Failed",
        "timeout": "Timed out",
        "batch": "Batch"
    },
    "txPreview": {
        "sendAgain": "Send again",
        "blockchainFee": "Network fee",
        "blockchainFeeDescription": "This fee is also referred to as GAS. It is required for a transaction to be successfully processed in blockchain. The size of the GAS depends on the amount of work that validators need to do to include a transaction in the block."
    },
    "receive": {
        "title": "Receive",
        "subtitle": "Send only Toncoin and tokens in TON network to this address, or you might lose your funds.",
        "share": {
            "title": "My Tonhub Address",
            "error": "Failed to share address, please try again or contact support"
        },
        "holdersJettonWarning": "Transfer to this address only {{symbol}}, if you send another token, you will lose it.",
        "assets": "Tokens and Accounts",
        "fromExchange": "From an exchange",
        "otherCoins": "Other tokens",
        "deposit": "Deposit to"
    },
    "transfer": {
        "title": "Send",
        "titleAction": "Action",
        "confirm": "Are you sure want to proceed?",
        "error": {
            "invalidAddress": "Invalid address",
            "invalidAddressMessage": "Please check the recipient address",
            "invalidAmount": "Invalid amount",
            "invalidDomain": "Invalid domain",
            "invalidDomainString": "Minimum 4 characters, maximum 126 characters. Latin letters (a-z), numbers (0-9) and a hyphen (-) are allowed. A hyphen cannot be at the beginning or end.",
            "sendingToYourself": "You can't send coins to yourself",
            "zeroCoins": "Unfortunately you can't send zero coins",
            "zeroCoinsAlert": "You are trying to send zero coins",
            "notEnoughCoins": "You don't have enough funds on your balance",
            "addressIsForTestnet": "This address is for testnet",
            "addressCantReceive": "This address can't receive coins",
            "addressIsNotActive": "This wallet has no history",
            "addressIsNotActiveDescription": "This means that no transactions have been made from this wallet address",
            "invalidTransaction": "Invalid transaction",
            "invalidTransactionMessage": "Please check the transaction details",
            "memoRequired": "Add a memo/tag to avoid losing funds",
            "holdersMemoRequired": "Comment/MEMO",
            "memoChange": "Change memo/tag to \"{{memo}}\"",
            "gaslessFailed": "Failed to send transaction",
            "gaslessFailedMessage": "Please try again or contact support",
            "gaslessFailedEstimate": "Failed to estimate fees, please try again later or contact support",
            "gaslessCooldown": "You can only pay the gas fee in the token currency once every few minutes. Please wait or pay the transaction fee in TON.",
            "gaslessCooldownTitle": "Wait a few minutes before the next transaction",
            "gaslessCooldownWait": "I'll wait",
            "gaslessCooldownPayTon": "Pay gas in TON",
            "gaslessNotEnoughFunds": "Not enough funds",
            "gaslessNotEnoughFundsMessage": "Gasless transfer amount with fee is higher than your balance, try to send a smaller amount or contact support",
            "gaslessTryLater": "Try again later",
            "gaslessTryLaterMessage": "You can try again later or contact support",
            "gaslessNotEnoughCoins": "{{fee}} in fees required to send, missing {{missing}}",
            "notEnoughJettons": "Not enough {{symbol}}",
            "jettonChange": "Recipient supports only {{symbol}} transfers, please change the recipient or the transfer currency",
            "ledgerErrorConnectionTitle": "Ledger is not connected",
            "ledgerErrorConnectionMessage": "Please, connect ledger and try again",
            "notEnoughGasTitle": "Insufficient TON to cover the gas fee",
            "notEnoughGasMessage": "Please top up your wallet with TON (at least {{diff}} TON more is needed) and try again"
        },
        "changeJetton": "Switch to {{symbol}}",
        "sendAll": "Max",
        "scanQR": "scan qr code",
        "sendTo": "Send to",
        "fee": "Blockchain fee: {{fee}}",
        "feeEmpty": "Fees will be calculated later",
        "feeTitle": "Blockchain fees",
        "feeTotalTitle": "Total blockchain fees",
        "purpose": "Purpose of transaction",
        "comment": "Message (optional)",
        "commentDescription": "Message will be visible to everyone on the blockchain",
        "commentRequired": "Check your memo/tag before sending",
        "commentLabel": "Message",
        "checkComment": "Check before sending",
        "confirmTitle": "Confirm transaction",
        "confirmManyTitle": "Confirm {{count}} transactions",
        "unknown": "Unknown operation",
        "moreDetails": "More details",
        "gasFee": "Gas fee",
        "contact": "Your contact",
        "firstTime": "Sending first time",
        "requestsToSign": "{{app}} requests to sign",
        "smartContract": "Smart contract operation",
        "txsSummary": "Total",
        "txsTotal": "Total amount",
        "gasDetails": "Gas details",
        "jettonGas": "Gas for sending tokens",
        "unusualJettonsGas": "Gas is higher than usual",
        "unusualJettonsGasTitle": "The fee for sending tokens is {{amount}} TON",
        "unusualJettonsGasMessage": "Tokens transaction fee (Gas) is higher than usual",
        "addressNotActive": "This wallet had no outgoing transactions",
        "wrongJettonTitle": "Wrong token",
        "wrongJettonMessage": "You are trying to send a token that that you don't have",
        "notEnoughJettonsTitle": "Not enough tokens",
        "notEnoughJettonsMessage": "You are trying to send more tokens than you have",
        "aboutFees": "About fees",
        "aboutFeesDescription": "The fees for transactions on the blockchain depend on several factors, such as network congestion, transaction size, gas price, and blockchain configuration parameters. The higher the demand for transaction processing on the blockchain or the larger the transaction size (message/comment), the higher the fees will be.",
        "gaslessTransferSwitch": "Pay gas fee in {{symbol}}"
    },
    "auth": {
        "phoneVerify": "Verify phone",
        "phoneNumber": "Phone number",
        "phoneTitle": "Your number",
        "phoneSubtitle": "We will send verification code to verify\nyour number.",
        "codeTitle": "Enter code",
        "codeSubtitle": "We sent verification code to ",
        "codeHint": "Code",
        "title": "Login into {{name}}",
        "message": "requests to connect to your wallet account {{wallet}}",
        "hint": "No funds would be transfered to the app and no access to your coins would be granted.",
        "action": "Allow",
        "expired": "This authentication request already expired",
        "failed": "Authentication failed",
        "completed": "This authentication request already completed",
        "authorized": "Authorization request approved",
        "authorizedDescription": "Now you can get back the app.",
        "noExtensions": "No extensions yet",
        "noApps": "No connected apps yet",
        "name": "Connected apps",
        "yourWallet": "Your wallet",
        "revoke": {
            "title": "Are you sure want to revoke this app?",
            "message": "This will destroy link between your wallet and app, but you can always try to connect again.",
            "action": "Revoke"
        },
        "apps": {
            "title": "Trusted Apps",
            "delete": {
                "title": "Delete this extension?",
                "message": "This will destroy link between your wallet and the extension, but you can always try to connect again."
            },
            "description": "Applications or extensions you have authorized will be displayed here. You can revoke access from any app or extension at any time.",
            "installExtension": "Install and open extension for this application",
            "moreWallets": "More wallets ({{count}})",
            "connectionSecureDescription": "No funds would be transfered to the app and no access to your coins would be granted"
        },
        "consent": "By clicking continue you accepting our"
    },
    "install": {
        "title": "Connection request",
        "message": "<strong>{{name}}</strong> wants to connect to your account",
        "action": "Install"
    },
    "sign": {
        "title": "Signature request",
        "message": "Requested to sign a message",
        "hint": "No funds would be transfered to the app and no access to your coins would be granted.",
        "action": "Sign"
    },
    "migrate": {
        "title": "Migrate old wallets",
        "subtitle": "If you have been using obsolete wallets, you can automatically move all funds from your old addresses.",
        "inProgress": "Migrating old wallets...",
        "transfer": "Transfering coins from {{address}}",
        "check": "Checking address {{address}}",
        "keyStoreTitle": "Transition to a new security method",
        "keyStoreSubtitle": "We want your keys to always be secure, so we have updated the way we protect them. We need your permission to transfer your keys to a new secure storage.",
        "failed": "Migration failed"
    },
    "qr": {
        "title": "Point camera at QR code",
        "requestingPermission": "Requesting camera permissions...",
        "noPermission": "Allow camera access to scan QR codes",
        "requestPermission": "Open settings",
        "failedToReadFromImage": "Failed to read QR code from image"
    },
    "products": {
        "addNew": "Add new product",
        "tonConnect": {
            "errors": {
                "connection": "Connection error",
                "invalidKey": "Invalid dApp key",
                "invalidSession": "Invalid session",
                "invalidTestnetFlag": "Invalid network",
                "alreadyCompleted": "Request already completed",
                "unknown": "Unknown error, please try again, or contact support"
            },
            "successAuth": "Connected"
        },
        "savings": "Savings",
        "accounts": "Tokens",
        "services": "Extensions",
        "oldWallets": {
            "title": "Old wallets",
            "subtitle": "Press to migrate old wallets"
        },
        "transactionRequest": {
            "title": "Transaction requested",
            "subtitle": "Press to view request",
            "groupTitle": "Transaction requests",
            "wrongNetwork": "Wrong network",
            "wrongFrom": "Wrong sender",
            "invalidFrom": "Invalid sender address",
            "noConnection": "App is not connected",
            "expired": "Request expired",
            "invalidRequest": "Invalid request",
            "failedToReport": "Transaction is sent but failed to report back to the app",
            "failedToReportCanceled": "Transaction is canceled but failed to report back to the app"
        },
        "signatureRequest": {
            "title": "Signature requested",
            "subtitle": "Press to view request"
        },
        "staking": {
            "earnings": "Earnings",
            "title": "TON Staking",
            "balance": "Staking balance",
            "subtitle": {
                "join": "Earn up to {{apy}}% on your TONs",
                "joined": "Earn up to {{apy}}%",
                "rewards": "Estimated Interest",
                "apy": "~13.3 APY of the contribution",
                "devPromo": "Multiply your test coins"
            },
            "pools": {
                "title": "Staking pools",
                "active": "Active",
                "best": "Best",
                "alternatives": "Alternative",
                "private": "Private pools",
                "restrictedTitle": "Pool is restricted",
                "restrictedMessage": "This staking pool is available only for the Whales Club members",
                "viewClub": "View Whales Club",
                "nominators": "Nominators",
                "nominatorsDescription": "For everyone",
                "club": "Club",
                "clubDescription": "For the Whales Club members",
                "team": "Team",
                "teamDescription": "For Ton Whales teammates and TOP 15 the Whales Club members",
                "joinClub": "Join",
                "joinTeam": "Join",
                "clubBanner": "Join our Club",
                "clubBannerLearnMore": "Learn about our club",
                "clubBannerDescription": "For our Whales Club members",
                "teamBanner": "Join our Team",
                "teamBannerLearnMore": "Learn about our team",
                "teamBannerDescription": "For our team and TOP 15 the Whales Club members",
                "epnPartners": "ePN Partners",
                "epnPartnersDescription": "Join over 200,000 webmasters",
                "moreAboutEPN": "Info",
                "lockups": "Lockups Pool",
                "lockupsDescription": "Allows holders of big lockups in TON to earn additional income",
                "tonkeeper": "Tonkeeper",
                "tonkeeperDescription": "Friendly mobile wallet on TON",
                "liquid": "Liquid Staking",
                "liquidDescription": "Send TON to staking and get wsTON tokens instead",
                "rateTitle": "Exchange rate"
            },
            "transfer": {
                "stakingWarning": "You can always deposit new stake or increase existing one with any amount. Please note that minimum amount is: {{minAmount}}",
                "depositStakeTitle": "Staking",
                "depositStakeConfirmTitle": "Confirm Staking",
                "withdrawStakeTitle": "Withdrawal Request",
                "withdrawStakeConfirmTitle": "Confirm Withdrawal",
                "topUpTitle": "Top Up",
                "topUpConfirmTitle": "Confirm Top Up",
                "notEnoughStaked": "unfortunately you don't have enougth coins staked",
                "confirmWithdraw": "Request Withdrawal",
                "confirmWithdrawReady": "Withdraw now",
                "restrictedTitle": "This Staking Pool is restricted",
                "restrictedMessage": "Your funds will not participate in staking if your wallet address is not on the permit list, but will be on the pool balance and awaiting a withdrawal",
                "notEnoughCoinsFee": "There are not enough TON on your wallet balance to pay the fee. Please note that the {{amount}} TON fee must be on the main balance, not on the staking balance",
                "notEnoughCoins": "There are not enough funds on your wallet balance to top up the staking balance",
                "ledgerSignText": "Staking: {{action}}"
            },
            "nextCycle": "Next cycle",
            "cycleNote": "All transactions take effect once the cycle ends",
            "cycleNoteWithdraw": "Your request will be executed after the cycle ends. The withdrawal will need to be confirmed again.",
            "buttonTitle": "stake",
            "balanceTitle": "Staking Balance",
            "actions": {
                "deposit": "Deposit",
                "top_up": "Top Up",
                "withdraw": "Withdraw",
                "calc": "Calculate",
                "swap": "Swap instantly"
            },
            "join": {
                "title": "Become a TON validator",
                "message": "Staking is a public good for the TON ecosystem. You can help secure the network and earn rewards in the process",
                "buttonTitle": "Start Earning",
                "moreAbout": "More about Ton Whales Staking Pool",
                "earn": "Earn up to",
                "onYourTons": "on your TONs",
                "apy": "13.3%",
                "yearly": "APY",
                "cycle": "Get rewards for staking every 36h",
                "ownership": "Staked TONs remain yours",
                "withdraw": "Withdraw and Top Up at any time",
                "successTitle": "{{amount}} TON staked",
                "successEtimation": "Your estimated yearly earnings are {{amount}}\u00A0TON\u00A0(${{price}}).",
                "successNote": "Your staked TON will be activated once the next cycle starts."
            },
            "pool": {
                "balance": "Total Stake",
                "members": "Nominators",
                "profitability": "Profitability"
            },
            "empty": {
                "message": "You have no transactions"
            },
            "pending": "pending",
            "withdrawStatus": {
                "pending": "Withdraw pending",
                "ready": "Withdraw ready",
                "withdrawNow": "Press to withdraw now"
            },
            "depositStatus": {
                "pending": "Deposit pending"
            },
            "withdraw": "Withdraw",
            "sync": "Downloading staking data",
            "unstake": {
                "title": "Are you sure want to request withdrawal?",
                "message": "Please, note that by requesting withdrawal all pending deposits will be returned too."
            },
            "unstakeLiquid": {
                "title": "Withdraw your wsTON",
                "message": "You can withdraw funds directly after the end of the cycle or swap instantly wsTON to TON on "
            },
            "learnMore": "Info",
            "moreInfo": "More info",
            "calc": {
                "yearly": "Yearly rewards",
                "monthly": "Monthly rewards",
                "daily": "Daily rewards",
                "note": "Calculated including all fees",
                "text": "Earnings calculator",
                "yearlyTopUp": "After Top Up",
                "yearlyTotal": "Total rewards in a year",
                "yearlyCurrent": "Current",
                "topUpTitle": "Your yearly rewards",
                "goToTopUp": "Go to Top Up"
            },
            "info": {
                "rate": "up to 13.3%",
                "rateTitle": "APY",
                "frequency": "Every 36 hours",
                "frequencyTitle": "Reward Frequency",
                "minDeposit": "Minimal deposit",
                "poolFee": "3.3%",
                "poolFeeTitle": "Pool Fee",
                "depositFee": "Deposit Fee",
                "withdrawFee": "Withdraw Fee",
                "withdrawRequestFee": "Withdraw request Fee",
                "withdrawCompleteFee": "Withdrawal completion request Fee",
                "depositFeeDescription": "TON amount that will be deducted from deposit amount to cover the deposit action fees, unused amount will be returned to your wallet balance",
                "withdrawFeeDescription": "TON transfer amount needed to cover the withdraw action fees, unused amount will be returned to your wallet balance",
                "withdrawCompleteDescription": "TON transfer amount needed to cover the withdraw completion action fees, unused amount will be returned to your wallet balance",
                "blockchainFee": "Blockhain fee",
                "cooldownTitle": "Simplified period",
                "cooldownActive": "Active",
                "cooldownInactive": "Inactive",
                "cooldownDescription": "All transactions take effect instantly during this period",
                "cooldownAlert": "At the beginning of each staking cycle, the Simplified Period is active. During this period you don't have to wait for the cycle to end in order to withdraw or top up - it happens instantly, and you don't have to send a second transaction to withdraw, which halves the withdrawal fee. You can transfer funds from one pool to another without losing cycle profits if the Simplified Period is active in both pools",
                "lockedAlert": "While the staking cycle is in progress withdrawals and deposits are pending. All transactions take effect once the cycle ends"
            },
            "minAmountWarning": "Minimum amount is {{minAmount}} TON",
            "tryAgainLater": "Please, try again later",
            "banner": {
                "estimatedEarnings": "Your estimated yearly earnings will decrease by {{amount}}\u00A0TON\u00A0({{price}})",
                "estimatedEarningsDev": "Your estimated yearly earnings will decrease",
                "message": "Are you sure about the unstaking?"
            },
            "activePools": "Active pools",
            "analytics": {
                "operations": "Operations",
                "operationsDescription": "Top Up and withdraw",
                "analyticsTitle": "Analytics",
                "analyticsSubtitle": "Total profit",
                "labels": {
                    "week": "1W",
                    "month": "1M",
                    "year": "1Y",
                    "allTime": "All"
                }
            }
        },
        "holders": {
            "title": "Bank account",
            "loadingLongerTitle": "Connection problems",
            "loadingLonger": "Check your internet connection and reload page. If the issue persists please contact support",
            "accounts": {
                "title": "Spendings",
                "prepaidTitle": "Prepaid cards",
                "account": "Account",
                "basicAccount": "Spending account",
                "proAccount": "Pro account",
                "noCards": "No cards",
                "prepaidCard": "Tonhub Prepaid *{{lastFourDigits}}",
                "prepaidCardDescription": "Reloadable card for everyday use",
                "hiddenCards": "Hidden cards",
                "hiddenAccounts": "Hidden accounts",
                "primaryName": "Main account",
                "paymentName": "Spending account {{accountIndex}}",
                "topUp": "Top up account",
                "addNew": "Add new account"
            },
            "pageTitles": {
                "general": "Tonhub Cards",
                "card": "Tonhub Card",
                "cardDetails": "Card Details",
                "cardCredentials": "Card Details",
                "cardLimits": "{{cardNumber}} Card Limits",
                "cardLimitsDefault": "Card Limits",
                "cardDeposit": "Top Up TON",
                "transfer": "Transfer",
                "cardSmartContract": "Card Smart Contract",
                "setUpCard": "Set up the card",
                "pin": "Change PIN"
            },
            "card": {
                "card": "Card",
                "cards": "Holders cards",
                "title": "Tonhub card {{cardNumber}}",
                "defaultSubtitle": "Pay with USDT or TON everywhere by card",
                "defaultTitle": "Tonhub card",
                "eurSubtitle": "Tonhub EUR",
                "type": {
                    "physical": "Physical Card",
                    "virtual": "Virtual"
                },
                "notifications": {
                    "type": {
                        "card_ready": "Card activated",
                        "deposit": "Card Top Up",
                        "charge": "Payment",
                        "charge_failed": "Payment",
                        "limits_change": {
                            "pending": "Limits changing",
                            "completed": "Limits changed"
                        },
                        "card_withdraw": "Transfer to wallet",
                        "contract_closed": "Contract closed",
                        "card_block": "Card blocked",
                        "card_freeze": "Card frozen",
                        "card_unfreeze": "Card unfrozen",
                        "card_paid": "Bank card issue"
                    },
                    "category": {
                        "deposit": "Top Up",
                        "card_withdraw": "Transfer",
                        "charge": "Purchases",
                        "charge_failed": "Purchases",
                        "other": "Other"
                    },
                    "status": {
                        "charge_failed": {
                            "limit": {
                                "onetime": "Failed (over onetime limit)",
                                "daily": "Failed (over daily limit)",
                                "monthly": "Failed (over monthly limit)"
                            },
                            "failed": "Failed"
                        },
                        "completed": "Completed"
                    }
                }
            },
            "confirm": {
                "title": "Are you sure you want to close this screen?",
                "message": "This action will discard all of your changes"
            },
            "enroll": {
                "poweredBy": "Based on TON, powered by ZenPay",
                "description_1": "Only you manage the smart-contract",
                "description_2": "No one except you has access to your funds",
                "description_3": "You truly own your money",
                "moreInfo": "More about ZenPay Card",
                "buttonSub": "KYC and card issue takes ~5 min",
                "failed": {
                    "title": "Failed to authorize",
                    "noAppData": "No app data",
                    "noDomainKey": "No domain key",
                    "createDomainKey": "During domain key creation",
                    "fetchToken": "During token fetching",
                    "createSignature": "During signature creation"
                },
                "ledger": {
                    "confirmTitle": "Continue with Ledger",
                    "confirmMessage": "Sign authorization & confirm wallet address",
                }
            },
            "otpBanner": {
                "title": "New payment request",
                "accept": "Accept",
                "decline": "Decline",
                "expired": "Expired"
            },
            "banner": {
                "fewMore": "Only a few more steps to complete",
                "ready": "Verification completed! Your card is ready!",
                "readyAction": "Get it now",
                "emailAction": "Verify your email",
                "kycAction": "Verify your identity",
                "failedAction": "Verification failed"
            },
            "transaction": {
                "type": {
                    "cardReady": "Card activated",
                    "accountReady": "Account activated",
                    "deposit": "Account Top Up",
                    "prepaidTopUp": "Prepaid Top Up",
                    "payment": "Payment",
                    "decline": "Decline",
                    "refund": "Refund",
                    "limitsChanging": "Limits changing",
                    "limitsChanged": "Limits changed",
                    "cardWithdraw": "Transfer to wallet",
                    "contractClosed": "Contract closed",
                    "cardBlock": "Card blocked",
                    "cardFreeze": "Card frozen",
                    "cardUnfreeze": "Card unfrozen",
                    "cardPaid": "Bank card issue",
                    "unknown": "Unknown"
                },
                "rejectReason": {
                    "approve": "n/a",
                    "generic": "There seems to be a problem. Please try again. If the error is still there, please contact customer support for help",
                    "fraud_or_ban": "There seems to be a problem. Please try again. If the error is still there, please contact customer support for help",
                    "not_able_to_trace_back_to_original_transaction": "There seems to be a problem. Please try again. If the error is still there, please contact customer support for help",
                    "do_not_honour": "We cannot perform the operation for this merchant",
                    "card_not_effective": "The transaction was declined because your card is currently blocked. To proceed, please unblock your card through the mobile app or contact customer support for help",
                    "expired_card": "Your card has reached its expiration date. Please order a new one through the mobile app",
                    "incorrect_pin": "Looks like there’s an issue with your PIN. Please check the details and try again. If the problem persists, please contact customer support for help",
                    "cvc2_or_cvv2_incorrect": "The CVV is not correct. Please check the three-digit code on the back of your card and try again",
                    "incorrect_expiry_date": "The expiry date you entered is not correct. Please check the expiry date on your card or in the mobile app and try again",
                    "invalid_card_number": "The card number you entered is not correct. Please check the number on your card or in the mobile app and try again",
                    "blocked_merchant_country_code": "Your card cannot be used for transactions in this country",
                    "insufficient_funds": "You don't have enough funds in your account to complete this transaction. Please top up your account and try again",
                    "exceeds_contactless_payments_daily_limit": "The transaction was declined because it exceeds your daily spending limit. Please contact customer support for assistance or try again tomorrow",
                    "exceeds_contactless_payments_monthly_limit": "The transaction was declined because it exceeds your monthly spending limit. Please contact customer support for assistance or try again later",
                    "exceeds_contactless_payments_transaction_limit": "The transaction was declined because it exceeds maximum transaction amount. Please contact customer support for help",
                    "exceeds_contactless_payments_weekly_limit": "The transaction was declined because it exceeds your weekly spending limit. Please contact customer support for assistance or try again later",
                    "exceeds_daily_overall_limit": "The transaction was declined because it exceeds your daily spending limit on the card. Please contact customer support for assistance or try again tomorrow",
                    "exceeds_internet_purchase_payments_daily_limit": "The transaction was declined because it exceeds your daily limit for internet transactions. Please contact customer support for assistance or try again tomorrow",
                    "exceeds_internet_purchase_payments_monthly_limit": "The transaction was declined because it exceeds your monthly limit for internet transactions. Please contact customer support for assistance or try again later",
                    "exceeds_internet_purchase_payments_transaction_limit": "The transaction was declined because it exceeds maximum transaction amount. Please contact customer support for help",
                    "exceeds_internet_purchase_payments_weekly_limit": "The transaction was declined because it exceeds your weekly limit for internet transactions. Please contact customer support for assistance or try again later",
                    "exceeds_monthly_overall_limit": "The transaction was declined because it exceeds your monthly spending limit on the card. Please contact customer support for assistance or try again later",
                    "exceeds_purchases_daily_limit": "The transaction was declined because it exceeds your daily spending limit on the card. Please contact customer support for assistance or try again tomorrow",
                    "exceeds_purchases_monthly_limit": "The transaction was declined because it exceeds your monthly spending limit on the card. Please contact customer support for assistance or try again later",
                    "exceeds_purchases_transaction_limit": "The transaction was declined because it exceeds maximum transaction amount. Please contact customer support for help",
                    "exceeds_purchases_weekly_limit": "The transaction was declined because it exceeds your weekly spending limit on the card. Please contact customer support for assistance or try again later",
                    "exceeds_settlement_risk_limit": "The transaction was declined because it exceeds maximum transaction amount. Please contact customer support for help",
                    "exceeds_weekly_overall_limit": "The transaction was declined because it exceeds your weekly spending limit on the card. Please contact customer support for assistance or try again later",
                    "exceeds_withdrawal_amount_limit": "The transaction was declined because it exceeds cash withdrawal limit on the card. Please contact customer support for help",
                    "exceeds_withdrawal_maximum_limit": "The transaction was declined because it exceeds cash withdrawal limit on the card. Please contact customer support for help",
                    "exceeds_withdrawal_minimum_limit": "The transaction amount is incorrect",
                    "exceeds_withdrawals_daily_limit": "The transaction was declined because it exceeds daily cash withdrawal limit on the card. Please contact customer support for assistance or try tomorrow",
                    "exceeds_withdrawals_monthly_limit": "The transaction was declined because it exceeds monthly cash withdrawal limit on the card. Please contact customer support for assistance or try later",
                    "exceeds_withdrawals_transaction_limit": "The transaction was declined because it exceeds cash withdrawal limit on the card. Please contact customer support for assistance or try tomorrow",
                    "exceeds_withdrawals_weekly_limit": "The transaction was declined because it exceeds weekly cash withdrawal limit on the card. Please contact customer support for assistance or try later",
                    "transaction_not_permitted_to_card_holder": "Transaction type isn't supported. Please contact the merchant",
                    "blocked_merchant_category_code": "We cannot perform the operation for this merchant",
                    "blocked_merchant_id": "We cannot perform the operation for this merchant",
                    "blocked_merchant_name": "We cannot perform the operation for this merchant",
                    "blocked_terminal_id": "There seems to be a problem. Please try again. If the error is still there, contact customer support for help",
                    "no_card_record": "There seems to be a problem. Please try again. If the error is still there, contact customer support for help",
                    "suspected_fraud": "There seems to be a problem. Please try again. If the error is still there, contact customer support for help",
                    "token_not_effective": "There seems to be a problem. Please try again. If the error is still there, contact customer support for help",
                    "client_system_malfunction": "There seems to be a problem. Please try again. If the error is still there, contact customer support for help",
                    "system_malfunction": "There seems to be a problem. Please try again. If the error is still there, contact customer support for help",
                    "contactless_payments_switched_off": "The transaction was declined because contactless payments are currently switched off on your card. Please contact customer support for help",
                    "internet_purchase_payments_switched_off": "The transaction was declined because internet purchases are currently switched off on your card. Please contact customer support for help",
                    "withdrawals_switched_off": "The transaction was declined because cash withdrawals are currently switched off on your card . Please contact customer support for help",
                    "purchases_switched_off": "The transaction was declined because purchases are currently switched off on your card. Please contact customer support for help",
                    "advice_acknowledged_no_financial_liability_accepted": "We cannot perform the operation for this merchant",
                    "merchant_without_3ds": "We cannot perform the operation for this merchant"
                },
                "to": {
                    "single": "To",
                    "prepaidCard": "To prepaid card",
                    "wallet": "To wallet",
                    "account": "To account"
                },
                "from": {
                    "single": "From",
                    "prepaidCard": "From prepaid card",
                    "wallet": "From wallet",
                    "account": "From account"
                },
                "category": {
                    "transfers": "Withdrawals",
                    "purchase": "Purchase",
                    "cash": "Cash withdrawals",
                    "other": "Other",
                    "deposit": "Top ups"
                },
                "status": {
                    "failed": "Failed",
                    "overOnetimeFailed": "Failed (over onetime limit)",
                    "overDailyFailed": "Failed (over daily limit)",
                    "overMonthlyFailed": "Failed (over monthly limit)",
                    "complete": "Complete"
                },
                "statsBlock": {
                    "title": "Transactions",
                    "description": "Spending in {{month}}",
                    "spent": "Spent",
                    "in": "in {{month}}"
                },
                "list": {
                    "emptyText": "No transactions yet"
                },
                "single": {
                    "report": "Report an issue"
                },
                "pendingPopover": {
                    "title": "Pending transaction",
                    "cancelButtonText": "Show transaction details",
                    "text": "Blockchain validation is currently underway. This may take a few minutes"
                }
            }
        }
    },
    "welcome": {
        "title": "Tonhub",
        "titleDev": "Ton Sandbox Wallet",
        "subtitle": "Simple and secure TON wallet",
        "subtitleDev": "Wallet for developers",
        "createWallet": "Get a new wallet",
        "importWallet": "I already have one",
        "slogan": "This is new Tonhub",
        "sloganDev": "This is Ton Sandbox",
        "slide_1": {
            "title": "Protected",
            "subtitle": "Reliable smart contract, Touch/Face ID with Passcode and all transactions on a decentralized blockchain"
        },
        "slide_2": {
            "title": "With a cool cryptocard",
            "subtitle": "Order a card now. Internal transfers and purchases in minutes.\nAll this is a unique Tonhub card"
        },
        "slide_3": {
            "title": "Fast",
            "subtitle": "Thanks to the unique TON architecture, transactions take place in seconds"
        }
    },
    "legal": {
        "title": "Legal",
        "subtitle": "I have read and accept ",
        "create": "Create a backup",
        "createSubtitle": "Keep your private key safe and don't share it with anyone. It's the only way to access your wallet if the device is lost.",
        "privacyPolicy": "Privacy Policy",
        "termsOfService": "Terms of Service"
    },
    "create": {
        "addNew": "Add new wallet",
        "inProgress": "Creating...",
        "backupTitle": "Your Backup Key",
        "backupSubtitle": "Write down these 24 words in exactly the same order and save them in a secret place",
        "okSaved": "OK, I saved it",
        "copy": "Copy to clipboard"
    },
    "import": {
        "title": "Enter backup key",
        "subtitle": "Please restore access to your wallet by entering the 24 secret words you wrote down when creating the wallet",
        "fullSeedPlaceholder": "Enter 24 secret words",
        "fullSeedPaste": "Or you can paste full seed phrase where each word is separated by a space"
    },
    "secure": {
        "title": "Protect your wallet",
        "titleUnprotected": "Your device is not protected",
        "subtitle": "We use biometrics to authenticate transactions to make sure no one except you can transfer your coins.",
        "subtitleUnprotected": "It is highly recommend to enable passcode on your device to protect your assets.",
        "subtitleNoBiometrics": "It is highly recommend to enable biometrics on your device to protect your assets. We use biometrics to authenticate transactions to make sure no one except you can transfer your coins.",
        "messageNoBiometrics": "It is highly recommend to enable biometrics on your device to protect your assets.",
        "protectFaceID": "Enable Face ID",
        "protectTouchID": "Enable Touch ID",
        "protectBiometrics": "Enable biometrics",
        "protectPasscode": "Enable device passcode",
        "upgradeTitle": "Upgrade needed",
        "upgradeMessage": "Please, allow the app access to wallet keys for an upgrade. No funds would be transferred during this upgrade. Please, make sure that you backed up your keys.",
        "allowUpgrade": "Allow upgrade",
        "backup": "Backup secret words",
        "onLaterTitle": "Setup later",
        "onLaterMessage": "You can setup protection later in settings",
        "onLaterButton": "Setup later",
        "onBiometricsError": "Error authenticating with biometrics",
        "lockAppWithAuth": "Authenticate when logging into the app",
        "methodPasscode": "passcode",
        "passcodeSetupDescription": "PIN code helps to protect your wallet from unauthorized access"
    },
    "backup": {
        "title": "Your recovery phrase",
        "subtitle": "Write down these 24 words in the order given below and store them in a secret, safe place."
    },
    "backupIntro": {
        "title": "Back up your wallet",
        "subtitle": "Are you sure that you have saved your 24 secret words?",
        "saved": "Yes, I saved them",
        "goToBackup": "No, Go to backup"
    },
    "errors": {
        "incorrectWords": {
            "title": "Incorrect words",
            "message": "You have entered incorrect secret words. Please, double check your input and try again."
        },
        "secureStorageError": {
            "title": "Secure storage error",
            "message": "Unfortunately we are unable to save data."
        },
        "title": "Ooops",
        "invalidNumber": "Nope, this is not a real number. Please, check your input and try again.",
        "codeTooManyAttempts": "You tried too much, please try again in 15 minutes.",
        "codeInvalid": "Nope, entered code is invalid. Check code and try again.",
        "unknown": "Woof, it is an unknown error. I literally have no idea what's going on. Can you try to turn it on and off?"
    },
    "confirm": {
        "logout": {
            "title": "Are you sure you want to disconnect your wallet from this app and delete all your data from the app?",
            "message": "This action will result in deleting all accounts from this device. Make sure you have backed up your 24 secret words before proceeding."
        },
        "changeCurrency": "Change primary currency to {{currency}}"
    },
    "neocrypto": {
        "buttonTitle": "buy",
        "alert": {
            "title": "How the checkout works",
            "message": "Fill in the required fields -> Select cryptocurrency and specify wallet address and the amount to buy -> Proceed to checkout -> Enter your billing details correctly. Your credit card payment is securely processed by our Partners -> Complete purchase. No account needed!"
        },
        "title": "Buy TON with credit card for USD, EUR and RUB",
        "description": "You will be taken to Neocrypto. Services relating to payments are provided by Neocrypto, which is a separate platform owned by a third party\n\nPlease read and agree to Neocrypto's Terms of Service before using their service",
        "doNotShow": "Do not show it again for Neocrypto",
        "termsAndPrivacy": "I have read and agree to the ",
        "confirm": {
            "title": "Are you sure you want to close this form?",
            "message": "This action will discard all of your changes"
        }
    },
    "known": {
        "deposit": "Deposit",
        "depositOk": "Deposit accepted",
        "withdraw": "Withdrawal request of {{coins}} TON",
        "withdrawAll": "Request withdraw of all coins",
        "withdrawLiquid": "Withdraw",
        "withdrawCompleted": "Withdraw completed",
        "withdrawRequested": "Withdraw requested",
        "upgrade": "Upgrade code to {{hash}}",
        "upgradeOk": "Upgrade completed",
        "cashback": "Cashback",
        "tokenSent": "Token sent",
        "tokenReceived": "Token received",
        "holders": {
            "topUpTitle": "Top up amount",
            "accountTopUp": "Top up of {{amount}} TON",
            "accountJettonTopUp": "Account top up",
            "limitsChange": "Limits change",
            "limitsTitle": "Limits",
            "limitsOneTime": "Per transaction",
            "limitsDaily": "Daily",
            "limitsMonthly": "Monthly",
            "accountLimitsChange": "Limits change"
        }
    },
    "jetton": {
        "token": "token",
        "productButtonTitle": "Tokens",
        "productButtonSubtitle": "{{jettonName}} and {{count}} others",
        "hidden": "Hidden tokens",
        "liquidPoolDescriptionDedust": "Liquidity for {{name0}}/{{name1}} on DeDust DEX",
        "liquidPoolDescriptionStonFi": "Liquidity for {{name0}}/{{name1}} on STON.fi DEX",
        "emptyBalance": "Empty balance",
        "jettonsNotFound": "No tokens found"
    },
    "connections": {
        "extensions": "Extensions",
        "connections": "Connections"
    },
    "accounts": {
        "active": "Active",
        "noActive": "No active accounts",
        "disabled": "Hidden",
        "alertActive": "Mark {{symbol}} active",
        "alertDisabled": "Mark {{symbol}} hidden",
        "description": "To change the status of an account, long press the account button on the home screen or press in this menu. The account will be added to the home screen or hidden.",
        "noAccounts": "You have no accounts yet"
    },
    "spamFilter": {
        "minAmount": "Min TON amount",
        "dontShowComments": "Don't show comments on SPAM transactions",
        "minAmountDescription": "Transactions with TON amount less than {{amount}} will be automatically marked as SPAM",
        "applyConfig": "Apply selected SPAM filter settings",
        "denyList": "Manual spam filter",
        "denyListEmpty": "No blocked addresses",
        "unblockConfirm": "Unblock address",
        "blockConfirm": "Mark address as spam",
        "description": "You can easily add the address to the list of manually blocked addresses  if you click on any transaction or address and select the option \"Mark address as spam\" in the pop-up menu"
    },
    "security": {
        "title": "Security",
        "passcodeSettings": {
            "setupTitle": "Setup PIN code",
            "confirmTitle": "Confirm PIN code",
            "changeTitle": "Change PIN code",
            "resetTitle": "Reset PIN code",
            "resetDescription": "If you forgot your PIN code, you can reset it by entering the 24 secret words you wrote down when creating the wallet.",
            "resetAction": "Reset",
            "error": "Incorrect PIN code",
            "tryAgain": "Try again",
            "success": "PIN code successfully set",
            "enterNew": "Create PIN code",
            "confirmNew": "Confirm new PIN code",
            "enterCurrent": "Enter your PIN code",
            "enterPrevious": "Enter current PIN code",
            "enterNewDescription": "Setting a password provides an additional layer of security when using the application",
            "changeLength": "Use {{length}}-digit PIN code",
            "forgotPasscode": "Forgot PIN code?",
            "logoutAndReset": "Log out and reset PIN code"
        },
        "auth": {
            "biometricsPermissionCheck": {
                "title": "Permission required",
                "message": "Please, allow the app access to biometrics for authentication",
                "openSettings": "Open settings",
                "authenticate": "Authenticate with Passcode"
            },
            "biometricsSetupAgain": {
                "title": "New biometrics detected",
                "message": "Please, setup biometrics again in security settings",
                "setup": "Setup",
                "authenticate": "Continue with Passcode"
            },
            "biometricsCooldown": {
                "title": "Biometrics cooldown",
                "message": "Please, try again in later, or lock your device and unlock it again with devices passcode to enable biometrics"
            },
            "biometricsCorrupted": {
                "title": "Biometrics corrupted and no PIN code set",
                "message": "Unfortunately, your wallet is no longer available, to restore your wallet, tap \"Restore\" (you will be logged out of you current wallet) and enter your 24 secret words",
                "messageLogout": "Unfortunately, your wallet is no longer available, to restore your wallet, tap \"Logout\" (you will be logged out of you current wallet) and add your wallet again",
                "logout": "Logout",
                "restore": "Restore"
            },
            "canceled": {
                "title": "Canceled",
                "message": "Authentication was canceled, please try again"
            }
        }
    },
    "report": {
        "title": "Report",
        "scam": "scam",
        "bug": "bug",
        "spam": "spam",
        "offense": "offensive content",
        "posted": "Your report is sent",
        "error": "Error sending report",
        "message": "Message (required)",
        "reason": "Report reason"
    },
    "review": {
        "title": "Review extension",
        "rating": "rating",
        "review": "Review (optional)",
        "heading": "Title",
        "error": "Error posing review",
        "posted": "Thanks for your feedback!",
        "postedDescription": "Your review will be published after moderation"
    },
    "deleteAccount": {
        "title": "Are you sure you want to Delete Account?",
        "action": "Delete account and all data",
        "logOutAndDelete": "Log Out and Delete all data",
        "description": "This action will delete all data and currenly selected wallet from this device and your blockchain account\nYou need to transfer all your TON coins to another wallet. Before proceeding, make sure that you have more than {{amount}} TON on your account to complete the transaction",
        "complete": "Account deletion completed",
        "error": {
            "hasNfts": "You have NFTs in your wallet, in order to delete the account, please send them to another wallet.",
            "fetchingNfts": "Could not find out if there are NFTs on the wallet. In order to delete the account, please make sure there are no NFTs on it.",
            "hasUSDTBalanceTitle": "You have USDT balance in your wallet",
            "hasUSDTBalanceMessage": "In order to delete the account, please send them to another wallet."
        },
        "confirm": {
            "title": "Are you sure you want to delete your account and all data from this application?",
            "message": "This action will delete your account and all data from this application and transfer all your TON coins to wallet address you specified.\nPlease, check the recipient address carefully before proceeding. Standard blockchain fee is charged for this transaction."
        },
        "checkRecipient": "Check recipient",
        "checkRecipientDescription": "To make you account inactive you have to transfer all funds to another wallet (recipient address). Please, check the address carefully before proceeding"
    },
    "logout": {
        "title": "Are you sure you want to Log Out of {{name}}?",
        "logoutDescription": "Access to the wallet will be disabled. Have you saved your private key?"
    },
    "contacts": {
        "title": "Contacts",
        "contact": "Contact",
        "unknown": "Unknown",
        "contacts": "My contacts",
        "name": "Name",
        "lastName": "Last name",
        "company": "Company",
        "add": "Add Contact",
        "edit": "Edit",
        "save": "Save",
        "notes": "Notes",
        "alert": {
            "name": "Incorrect name",
            "nameDescription": "Contact name can't be empty or longer than 126 characters",
            "notes": "Incorrect field",
            "notesDescription": "Contact fields can't be longer than 280 characters"
        },
        "delete": "Delete contact",
        "empty": "No contacts yet",
        "description": "You can add an address to your contacts long pressing on any transaction or address or using the \"Add\" button or from the list of recent contacts below",
        "contactAddress": "Contacts address",
        "search": "Name or wallet address",
        "new": "New contact"
    },
    "currency": {
        "USD": "United States dollar",
        "EUR": "Euro",
        "RUB": "Russian ruble",
        "GBP": "British Pounds",
        "CHF": "Swiss franc",
        "CNY": "Chinese yuan",
        "KRW": "South Korean won",
        "IDR": "Indonesian rupiah",
        "INR": "Indian rupee",
        "JPY": "Japanese yen"
    },
    "txActions": {
        "addressShare": "Share address",
        "addressContact": "Add address to contacts",
        "addressContactEdit": "Edit address contact",
        "addressMarkSpam": "Mark address as spam",
        "txShare": "Share transaction",
        "txRepeat": "Repeat transaction",
        "view": "View in explorer",
        "share": {
            "address": "TON address",
            "transaction": "TON transaction"
        }
    },
    "hardwareWallet": {
        "ledger": "Ledger",
        "title": "Connect Ledger",
        "description": "Your hardware Ledger wallet",
        "installationIOS": "Unlock Ledger, connect it to your smartphone via Bluetooth and allow Tonhub access.",
        "installationAndroid": "Unlock Ledger, connect it to your smartphone via Bluetooth or USB cable and allow Tonhub access.",
        "installationGuide": "TON ledger connection guide",
        "connectionDescriptionAndroid": "Connect your Ledger via USB or Bluetooth",
        "connectionDescriptionIOS": "Connect your Ledger via Bluetooth",
        "connectionHIDDescription_1": "1. Turn your ledger on and unlock it",
        "connectionHIDDescription_2": "2. Press \"Continue\"",
        "openTheAppDescription": "Open the TON app on your Ledger",
        "unlockLedgerDescription": "Unlock your Ledger",
        "chooseAccountDescription": "Select the account you want to use",
        "bluetoothScanDescription_1": "1. Turn your ledger on and unlock it",
        "bluetoothScanDescription_2": "2. Make sure that you have bluetooth enabled",
        "bluetoothScanDescription_3": "3. Press \"Scan\" to search for available devices and select suitable Ledger Nano X",
        "bluetoothScanDescription_3_and": "3. Press \"Scan\" to search for available devices (we will need access to device location data and permission to search for nearby devices)",
        "bluetoothScanDescription_4_and": "4. Then select suitable Ledger Nano X",
        "openAppVerifyAddress": "Check the account address that you have selected and then verify the address with the Ledger Ton App when prompted",
        "devices": "Your devices",
        "connection": "Connection",
        "actions": {
            "connect": "Connect Ledger",
            "selectAccount": "Select account",
            "account": "Account #{{account}}",
            "loadAddress": "Verify address",
            "connectHid": "Connect Ledger via USB",
            "connectBluetooth": "Connect Ledger via Bluetooth",
            "scanBluetooth": "Scan again",
            "confirmOnLedger": "Verify on Ledger",
            "sending": "Awaiting transaction",
            "sent": "Transaction sent",
            "mainAddress": "Main address",
            "givePermissions": "Give permissions"
        },
        "confirm": {
            "add": "Are you sure want to add this app?",
            "remove": "Are you sure want to remove this app?"
        },
        "errors": {
            "bleTitle": "Bluetooth error",
            "noDevice": "No device found",
            "appNotOpen": "Ton app is not open on Ledger",
            "openApp": "Please, open the TON app on your Ledger",
            "turnOnBluetooth": "Please, turn Bluetooth on and try again",
            "lostConnection": "Lost connection with Ledger",
            "transactionNotFound": "Transaction not found",
            "transactionRejected": "Transaction rejected",
            "transferFailed": "Transfer failed",
            "permissions": "Please, allow access to bluetooth and location",
            "unknown": "Unknown error",
            "reboot": "Please, reboot your device and try again",
            "turnOnLocation": "Please, turn on location services and try again, this is required to scan for nearby devices",
            "locationServicesUnauthorized": "Location services are unauthorized",
            "bluetoothScanFailed": "Bluetooth scan failed",
            "unsafeTransfer": "Please, allow blind sign in TON Ledger app",
            "userCanceled": "Rejected on Ledger"
        },
        "moreAbout": 'More about Ledger',
        "verifyAddress": {
            "title": 'Confirm address on Ledger',
            "message": 'Please, verify the address: {{address}} on your Ledger device',
            "action": 'Verify',
            "invalidAddressTitle": 'Invalid address',
            "invalidAddressMessage": 'This address is not valid. Please, check the address and try again',
            "failed": 'Failed to verify address',
            "failedMessage": "Please, reconnect Ledger and try again",
            "verifying": 'Confirm on Ledger'
        }
    },
    "devTools": {
        "switchNetwork": "Network",
        "switchNetworkAlertTitle": "Switching to {{network}} network",
        "switchNetworkAlertMessage": "Are you sure you want to switch networks?",
        "switchNetworkAlertAction": "Switch",
        "copySeed": "Copy 24 words seed phrase",
        "copySeedAlertTitle": "Coping 24 words seed phrase to clipboard",
        "copySeedAlertMessage": "WARNING! Coping 24 words seed phrase to clipboard is not secure. Proceed at your own risk.",
        "copySeedAlertAction": "Copy",
        "holdersOfflineApp": "Holders Offline App"
    },
    "wallets": {
        "choose_versions": "Choose wallets to add",
        "switchToAlertTitle": "Switching to {{wallet}}",
        "switchToAlertMessage": "Are you sure you want to switch wallets?",
        "switchToAlertAction": "Switch",
        "addNewTitle": "Add wallet",
        "addNewAlertTitle": "Adding new wallet",
        "addNewAlertMessage": "Are you sure you want to add new wallet?",
        "addNewAlertAction": "Add",
        "alreadyExistsAlertTitle": "Wallet already exists",
        "alreadyExistsAlertMessage": "Wallet with this address already exists",
        "settings": {
            "changeAvatar": "Change avatar",
            "selectAvatarTitle": "Picture",
            "selectColorTitle": "Background color"
        }
    },
    "webView": {
        "checkInternetAndReload": "Please, check internet connection and try to reload the page",
        "contactSupportOrTryToReload": "Contact support or try to reload the page",
        "contactSupport": "Contact support"
    },
    "appAuth": {
        "description": "To continue logging in to the app"
    },
    "screenCapture": {
        "title": "Wow, cool screenshot, but it's not safe",
        "description": "Unencrypted digital copies of your secret phrase are NOT recommended. Examples include saving copies on computer, on online accounts or by taking screenshots",
        "action": "OK, I'm taking the risk"
    },
    "onboarding": {
        "avatar": "This is where you can change your wallets avatar and name",
        "wallet": "This is where you can add new or switch between your wallets",
        "price": "This is where you can change your primary currency"
    },
    "newAddressFormat": {
        "title": "Address format",
        "fragmentTitle": "New addresses type",
        "learnMore": "More about new addresses",
        "shortDescription": "The address update will make the TON blockchain even more secure and stable. All assets sent to your old address will continue flowing to your wallet.",
        "description_0_0": "Recently, TON ",
        "description_0_link": "announced this update",
        "description_0_1": " to addresses and asked all wallets to support it.",
        "title_1": "Why?",
        "description_1": "The update allows developers to distinguish between wallet and contract addresses and avoid errors when sending transactions.",
        "title_2": "What do you need to do?",
        "description_2": "Click the button on the previous screen and authorize us to display all addresses in the app in the new format. You will be able to revert back to the old format in your settings.",
        "title_3": "What happens to the old address?",
        "description_3": "All TONs, tokens, NFTs and other assets sent to your old address will continue to flow to your wallet.",
        "description_4": "Technical details of the upgrade can be found at",
        "action": "Use {{format}}",
        "oldAddress": "Old address",
        "newAddress": "New address",
        "bannerTitle": "Update your address",
        "bannerDescription": "From EQ to UQ"
    },
    "changelly": {
        "bannerTitle": "USDT & USDC deposits",
        "bannerDescription": "Tron, Solana, Ethereum, Polygon available!"
    },
    "w5": {
        "banner": {
            "title": "Add wallet W5",
            "description": "Transfer USDT without gas"
        },
        "update": {
            "title": "Update wallet to W5",
            "subtitle_1": "Gasless USDT transfers",
            "description_1": "You no longer need TON to send USDT. Transaction fees can be covered with your token balance.",
            "subtitle_2": "Save on fees",
            "description_2": "W5 allows to increase the number of operations in a single transaction by 60 times and significantly save on fees.",
            "subtitle_3": "Your seed phrase is unchanged",
            "description_3": "V4 and W5 wallets have the same seed phrase. You can always switch versions by selecting the desired address at the top of the main screen.",
            "switch_button": "Switch to W5"
        },
        "gaslessInfo": "TON isn't required to pay gas fee when sending this token. The fee will be deducted directly from your token balance."
    },
    "browser": {
        "listings": {
            "categories": {
                "other": "Other",
                "exchange": "Exchanges",
                "defi": "DeFi",
                "nft": "NFT",
                "games": "Games",
                "social": "Social",
                "utils": "Utilities",
                "services": "Services"
            },
            "title": "For you"
        },
        "refresh": "Reload",
        "back": "Back",
        "forward": "Forward",
        "share": "Share",
        "search": {
            "placeholder": "Search",
            "invalidUrl": "Invalid URL",
            "urlNotReachable": "URL is not reachable",
            "suggestions": {
                "web": "Search in {{engine}}",
                "ddg": "DuckDuckGo",
                "google": "Google"
            }
        },
        "alertModal": {
            "message": "You are about to open a third-party web application. We are not responsible for the content or security of third-party apps.",
            "action": "Open"
        }
    },
    "swap": {
        "title": "DeDust.io — AMM DEX on The Open Network",
        "description": "You are about to use a Dedust.io service operated by an independent party not affiliated with Tonhub\nYou must agree to the Terms of Use and Privacy Policy to continue",
        "termsAndPrivacy": "I have read and agree to the ",
        "dontShowTitle": "Don't show it again for DeDust.io"
    },
    "mandatoryAuth": {
        "title": "Check your backup",
        "description": "Enable verification when opening a wallet. This will help keep your bank card details safe.",
        "alert": "Write down 24 secret words in the Security section of your wallet settings. This will help you regain access if you lose your phone or forget your pin code.",
        "confirmDescription": "I wrote down my wallet 24 secret words and saved them in a safe place",
        "action": "Enable",
        "settingsDescription": "Authentication request is required as the app displays banking products. Sensitive data will be hidden until you turn the authentication on"
    },
    "update": {
        "callToAction": "Update Tonhub"
    },
    "savings": {
        "ton": "TON saving account",
        "usdt": "USDT saving account"
    },
    "spending": {
        "ton": "TON spending account",
        "usdt": "USDT spending account"
    }
};

export default schema;
