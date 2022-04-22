import { LocalizationSchema, PrepareSchema } from "./schema";

const schema: PrepareSchema<LocalizationSchema, '' | '_plural'> = {
    lang: 'en',
    common: {
        and: 'and',
        accept: 'Accept',
        start: 'Start',
        continue: 'Continue',
        continueAnyway: 'Continue anyway',
        back: 'Back',
        logout: 'Logout',
        cancel: 'Cancel',
        balance: 'Balance',
        walletAddress: 'Wallet address',
        copy: 'Copy',
        copied: 'Copied to clipboard',
        share: 'Share',
        send: 'Send',
        yes: 'Yes',
        no: 'No',
        amount: 'Amount',
        today: 'Today',
        yesterday: 'Yesterday',
        comment: 'Comment',
        products: 'Products',
        confirm: 'Confirm',
        soon: 'soon',
        in: 'in',
        max: 'Max'
    },
    home: {
        wallet: 'Wallet',
        settings: 'Settings'
    },
    settings: {
        title: 'Settings',
        backupKeys: 'Backup keys',
        migrateOldWallets: 'Migrate old wallets',
        termsOfService: 'Terms of Service',
        privacyPolicy: 'Privacy policy',
        developerTools: 'Developer Tools'
    },
    wallet: {
        sync: 'Downloading wallet data',
        balanceTitle: 'Ton balance',
        actions: {
            receive: 'Receive',
            send: 'Send'
        },
        empty: {
            message: 'You have no transactions',
            receive: 'Receive TON'
        }
    },
    tx: {
        sending: 'Sending',
        sent: 'Sent',
        received: 'Received',
        bounced: 'Bounced'
    },
    txPreview: {
        sendAgain: 'send again',
        blockchainFee: 'Blockchain fee'
    },
    receive: {
        title: 'Receive Ton',
        subtitle: 'Share this link to receive Ton',
        share: {
            title: 'My Tonhub Address'
        }
    },
    transfer: {
        title: 'Send Ton',
        titleAction: 'Action',
        confirm: 'Are you sure want to proceed?',
        error: {
            invalidAddress: 'Invalid address',
            invalidAmount: 'Invalid amount',
            sendingToYourself: 'You can\'t send coins to yourself',
            zeroCoins: 'Unfortunatelly you can\'t send zero coins',
            notEnoughCoins: 'Unfortunatelly you don\'t have enougth coins for this transaction',
            addressIsForTestnet: 'This address is for testnet',
            addressCantReceive: 'This address can\'t receive coins',
            addressIsNotActive: 'This address does not active'
        },
        sendAll: 'send all',
        scanQR: 'scan qr code',
        sendTo: 'Send to',
        fee: 'Blockchain fee: {{fee}}',
        purpose: 'Purpose of transaction',
        comment: 'Optional message',
        commentReuiered: 'Сomment required',
        commentLabel: 'Message',
        checkComment: 'Check before sending'
    },
    auth: {
        title: 'Authentication',
        message: 'Allow <strong>{{name}}</strong> to know your wallet addres',
        hint: 'No funds would be transfered to the site and no access to your coins would be granted',
        action: 'Allow',
        expired: 'This authentication request already expired',
        completed: 'This authentication request already completed',
        noApps: 'No connected apps',
        name: 'Connected apps',
        revoke: {
            title: 'Are you sure want to revoke this app?',
            message: 'This will destroy link between your wallet and app, but you can always try to connect again.',
            action: 'Revoke'
        }
    },
    migrate: {
        title: 'Migrate old wallets',
        subtitle: 'If you have been using obsolete wallets, you can automatically move all funds from your old addresses.',
        inProgress: 'Migrating old wallets...',
        transfer: 'Transfering coins from {{address}}',
        check: 'Checking address {{address}}'
    },
    qr: {
        title: 'Scan QR code',
        requestingPermission: 'Requesting for camera permission...',
        noPermission: 'No access to camera'
    },
    products: {
        oldWallets: {
            title: 'Old wallets',
            subtitle: 'Press to migrate old wallets'
        },
        transactionRequest: {
            title: 'Transaction requested',
            subtitle: 'Press to view request'
        },
        staking: {
            title: 'Staking',
            balance: 'Staking balance',
            subtitle: {
                join: 'Earn up to 13.3% on your TONs',
                joined: 'Earn up to 13.3%',
                rewards: 'Estimated Interest',
                apy: '~13.3 APY of the contribution'
            },
            transfer: {
                stakingWarning: 'You can always deposit new stake or increase existing one with any amount. Please note that minimum amount is: {{minAmount}}',
                depositStakeTitle: 'Staking',
                depositStakeConfirmTitle: 'Confirm Staking',
                withdrawStakeTitle: 'Withdrawal Request',
                withdrawStakeConfirmTitle: 'Confirm Withdrawal',
                topUpTitle: 'Top Up',
                topUpConfirmTitle: 'Confirm Top Up',
                notEnoughStaked: 'Unfortunatelly you don\'t have enougth coins staked',
                confirmWithdraw: 'Request Withdrawal',
                confirmWithdrawReady: 'Withdraw now'
            },
            nextCycle: 'Next cycle',
            cycleNote: 'All transactions take effect once the cycle ends',
            cycleNoteWithdraw: 'Your request will be executed after the cycle ends. The withdrawal will need to be confirmed again.',
            buttonTitle: 'stake',
            balanceTitle: 'Staking Balance',
            actions: {
                deposit: 'Deposit',
                top_up: 'Top Up',
                withdraw: 'Unstake'
            },
            join: {
                title: 'Become a TON validator',
                message: 'Staking is a public good for the TON ecosystem. You can help secure the network and earn rewards in the process',
                buttonTitle: 'Start Earning',
                moreAbout: 'More about Tonwhales Staking Pool',
                earn: 'Earn up to',
                onYourTons: 'on your TONs',
                apy: '13.3%',
                yearly: 'APY',
                cycle: 'Get rewards for staking every 36h',
                ownership: 'Staked TONs remain yours',
                withdraw: 'Withdraw and Top Up at any time',
                successTitle: '{{amount}} TON staked',
                successEtimation: 'Your estimated yearly earnings are {{amount}}\u00A0TON\u00A0(${{price}}).',
                successNote: 'Your staked TON will be activated once the next cycle starts.'
            },
            pool: {
                balance: 'Total Stake',
                members: 'Nominators',
                profitability: 'Profitability'
            },
            empty: {
                message: 'You have no transactions'
            },
            pending: {
                deposit: 'Pending Deposit',
                withdraw: 'Pending Withdraw'
            },
            withdrawStatus: {
                pending: 'Withdraw pending',
                ready: 'Withdraw ready',
                withdrawNow: 'Withdraw now'
            },
            depositStatus: {
                pending: 'Deposit pending'
            },
            withdraw: 'Withdraw',
            sync: 'Downloading staking data',
            unstake: {
                title: 'Are you sure want to request withdrawal?',
                message: 'Please, note that by requesting withdrawal all pending deposits will be returned too.'
            },
            learnMore: 'Info',
            moreInfo: 'More info',
            calc: {
                yearly: 'Yearly rewards',
                monthly: 'Monthly rewards',
                daily: 'Daily rewards',
                note: 'Calculated including all fees',
                text: 'Earnings calculator',
                yearlyTopUp: 'After Top Up',
                yearlyTotal: 'Total rewards in a year',
                yearlyCurrent: 'Current',
                topUpTitle: 'Your yearly rewards'
            },
            info: {
                rate: 'up to 13.3%',
                rateTitle: 'Est. APY rate',
                frequency: 'Every 36 hours',
                frequencyTitle: 'Reward Frequency',
                minDeposit: 'Minimal deposit',
                poolFee: '3.3%',
                poolFeeTitle: 'Pool Fee',
                depositFee: 'Deposit Fee',
                withdrawFee: 'Withdraw Fee',
                blockchainFee: 'Blockhain fee',
            },
            minAmountWarning: 'Minimum amount is {{minAmount}} TON',
            tryAgainLater: 'Please, try again later',
            banner: {
                estimatedEarnings: 'Your estimated yearly earnings will decrease by {{amount}}\u00A0TON\u00A0(${{price}})',
                estimatedEarningsDev: 'Your estimated yearly earnings will decrease',
                message: 'Are you sure about the unstaking?'
            }
        },
    },
    welcome: {
        title: 'Tonhub',
        titleDev: 'Ton Development Wallet',
        subtitle: 'Simple and secure TON wallet',
        subtitleDev: 'Wallet for developers',
        createWallet: 'Create wallet',
        importWallet: 'Import existing wallet'
    },
    legal: {
        title: 'Legal',
        subtitle: 'Please review and accept our',
        privacyPolicy: 'Privacy Policy',
        termsOfService: 'Terms of Service'
    },
    create: {
        inProgress: 'Creating...'
    },
    import: {
        title: '24 Secret Words',
        subtitle: 'Please restore access to your wallet by entering the 24 secret words you wrote down when creating the wallet.'
    },
    secure: {
        title: 'Protect your wallet',
        titleUnprotected: 'Your device is not protected',
        subtitle: 'We use biometrics to authenticate transactions to make sure no one except you can transfer your coins.',
        subtitleUnprotected: 'It is highly recommend to enable passcode on your device to protect your assets.',
        subtitleNoBiometrics: 'It is highly recommend to enable biometrics on your device to protect your assets. We use biometrics to authenticate transactions to make sure no one except you can transfer your coins.',
        messageNoBiometrics: 'It is highly recommend to enable biometrics on your device to protect your assets.',
        protectFaceID: 'Protect with Face ID',
        protectTouchID: 'Protect with Touch ID',
        protectBiometrics: 'Protect with biometrics',
        protectPasscode: 'Protect with Passcode'
    },
    backup: {
        title: 'Your recovery phrase',
        subtitle: 'Write down these 24 words in the order given below and store them in a secret, safe place.'
    },
    backupIntro: {
        title: 'Back up your wallet',
        subtitle: 'In the next step you will see 24 secret words that allows you to recover a wallet',
        clause1: 'If I lose recovery phrase, my funds will be lost forever.',
        clause2: 'If I expose or share my recovery phrase to anybody, my funds can be stolen.',
        clause3: 'It is my full responsibility to keep my recovery phrase secure.'
    },
    errors: {
        incorrectWords: {
            title: 'Incorrect words',
            message: 'You have entered incorrect secret words. Please, double ckeck your input and try again.'
        },
        secureStorageError: {
            title: 'Secure storage error',
            message: 'Unfortunatelly we are unable to save data. Please, restart your phone.'
        }
    },
    confirm: {
        logout: {
            title: 'Are you sure want to log out?',
            message: 'This will disconnect the wallet from this app. You will be able to restore your wallet using 24 secret words - or import another wallet.'
        }
    },
    neocrypto: {
        buttonTitle: 'buy',
        alert: {
            title: 'How the checkout works',
            message: 'Fill in the required fields -> Select cryptocurrency and specify wallet address and the amount to buy -> Proceed to checkout -> Enter your billing details correctly. Your credit card payment is securely processed by our Partners -> Complete purchase. No account needed!'
        },
        title: 'Buy TON with credit card for USD, EUR and RUB',
        description: 'You will be taken to Neocrypto. Services relating to payments are provided by Neocrypto, which is a separate platform owned by a third party.\n\nPlease read and agree to Neocrypto\'s Terms of Service before using their service. ',
        doNotShow: 'Do not show it again for Neocrypto',
        termsAndPrivacy: 'I have read and agree to the ',
    },
    known: {
        deposit: 'Deposit',
        depositOk: 'Deposit accepted',
        withdraw: 'Request withdraw of {{coins}} 💎',
        withdrawAll: 'Request withdraw of all coins',
        withdrawCompleted: 'Withdraw completed',
        withdrawRequested: 'Withdraw requested',
        upgrade: 'Upgrade code to {{hash}}',
        upgradeOk: 'Upgrade completed'
    }
};

export default schema;