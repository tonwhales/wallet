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
        logout: 'Log Out',
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
        max: 'Max',
        close: 'Close',
        delete: 'Delete',
        apply: 'Apply',
        domainOrAddress: 'Wallet address or domain',
        domain: 'Domain',
        search: 'Search',
        termsOfService: 'Terms\u00A0Of\u00A0Service',
        privacyPolicy: 'Privacy\u00A0Policy',
        apy: 'APY',
        tx: 'Transaction',
        gotIt: 'Got it',
        wallet: 'Wallet',
    },
    syncStatus: {
        connecting: 'Connecting',
        updating: 'Updating',
        online: 'Connected'
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
        developerTools: 'Developer Tools',
        spamFilter: 'SPAM filter',
        logoutDescription: 'This action will disconnect the wallet from this app and delete all of your data from this app. You will be able to restore your wallet using 24 secret words - or import another wallet.\n\nTON Wallets are located in the decentralized TON Blockchain. If you want a wallet to be deleted, simply transfer all the TON from it and leave it empty.',
        primaryCurrency: 'Primary currency'
    },
    wallet: {
        sync: 'Downloading wallet data',
        balanceTitle: 'Ton balance',
        actions: {
            receive: 'Receive',
            send: 'Send',
            buy: 'Buy'
        },
        empty: {
            message: 'You have no transactions',
            receive: 'Receive TON'
        },
        pendingTransactions: 'Pending transactions',
    },
    transactions: {
        title: 'Transactions',
        history: 'History',
    },
    tx: {
        sending: 'Sending',
        sent: 'Sent',
        received: 'Received',
        bounced: 'Bounced',
        tokenTransfer: 'Token transfer',
        airdrop: 'Airdrop',
        failed: 'Failed',
    },
    txPreview: {
        sendAgain: 'Send again',
        blockchainFee: 'Blockchain fee'
    },
    receive: {
        title: 'Receive',
        subtitle: 'Share this link to receive Ton',
        share: {
            title: 'My Tonhub Address'
        }
    },
    transfer: {
        title: 'Send {{symbol}}',
        titleAction: 'Action',
        confirm: 'Are you sure want to proceed?',
        error: {
            invalidAddress: 'Invalid address',
            invalidAmount: 'Invalid amount',
            invalidDomain: 'Invalid domain',
            invalidDomainString: 'Minimum 4 characters, maximum 126 characters. Latin letters (a-z), numbers (0-9) and a hyphen (-) are allowed. A hyphen cannot be at the beginning or end.',
            sendingToYourself: 'You can\'t send coins to yourself',
            zeroCoins: 'unfortunately you can\'t send zero coins',
            notEnoughCoins: 'unfortunately you don\'t have enougth coins for this transaction',
            addressIsForTestnet: 'This address is for testnet',
            addressCantReceive: 'This address can\'t receive coins',
            addressIsNotActive: 'This wallet has no history',
            addressIsNotActiveDescription: 'This means that no transactions have been made from this wallet address',
        },
        sendAll: 'send all',
        scanQR: 'scan qr code',
        sendTo: 'Send to',
        fee: 'Blockchain fee: {{fee}}',
        feeTitle: 'Blockchain fees',
        purpose: 'Purpose of transaction',
        comment: 'Optional message',
        commentRequired: 'Сomment required',
        commentLabel: 'Message',
        checkComment: 'Check before sending',
        confirmTitle: 'Confirm transaction',
        unknown: 'Unknown operation',
        moreDetails: 'More details',
        gasFee: 'Gas fee',
        contact: 'Your contact',
        firstTime: 'Sending first time',
        requestsToSign: '{{app}} requests to sign',
        smartContract: 'Smart contract transaction',
    },
    auth: {
        phoneVerify: 'Verify phone',
        phoneNumber: 'Phone number',
        phoneTitle: 'Your number',
        phoneSubtitle: 'We will send verification code to verify\nyour number.',
        codeTitle: 'Enter code',
        codeSubtitle: 'We sent verification code to ',
        codeHint: 'Code',
        title: 'Connection Request',
        message: '<strong>{{name}}</strong> wants to connect to your account',
        hint: 'No funds would be transfered to the app and no access to your coins would be granted.',
        action: 'Allow',
        expired: 'This authentication request already expired',
        failed: 'Invalid URL',
        completed: 'This authentication request already completed',
        authorized: 'Authorization request approved',
        authorizedDescription: 'Now you can get back the the app.',
        noApps: 'No connected apps',
        name: 'Connected apps',
        yourWallet: 'Your wallet',
        revoke: {
            title: 'Are you sure want to revoke this app?',
            message: 'This will destroy link between your wallet and app, but you can always try to connect again.',
            action: 'Revoke'
        },
        apps: {
            title: 'Trusted Apps',
            delete: {
                title: 'Delete this extension?',
                message: 'This will destroy link between your wallet and the extension, but you can always try to connect again.',
            },
            description: 'Applications or extensions you have authorized will be displayed here. You can revoke access from any app or extension at any time.',
            installExtension: 'Install and open extension for this application'
        },
        consent: 'By clicking continue you accepting our',
    },
    install: {
        title: 'Install Extension',
        message: '<strong>{{name}}</strong> wants to connect to your account',
        action: 'Install'
    },
    sign: {
        title: 'Signature request',
        message: 'Requested to sign a message',
        hint: 'No funds would be transfered to the app and no access to your coins would be granted.',
        action: 'Sign',
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
        noPermission: 'No access to camera',
        requestPermission: 'Open settings',
    },
    products: {
        accounts: 'Accounts',
        services: 'Extensions',
        oldWallets: {
            title: 'Old wallets',
            subtitle: 'Press to migrate old wallets'
        },
        transactionRequest: {
            title: 'Transaction requested',
            subtitle: 'Press to view request'
        },
        signatureRequest: {
            title: 'Signature requested',
            subtitle: 'Press to view request'
        },
        staking: {
            title: 'Staking',
            balance: 'Staking balance',
            subtitle: {
                join: 'Earn up to {{apy}}% on your TONs',
                joined: 'Earn up to {{apy}}%',
                rewards: 'Estimated Interest',
                apy: '~13.3 APY of the contribution',
                devPromo: 'Multiply your test coins'
            },
            pools: {
                active: 'Active',
                best: 'Best pool',
                alternatives: 'Alternative',
                private: 'Private pools',
                restrictedTitle: 'Pool is restricted',
                restrictedMessage: 'This staking pool is available only for the Whales Club members',
                viewClub: 'View Whales Club',
                nominators: 'Nominators',
                nominatorsDescription: 'Open for everyone',
                club: 'Club',
                clubDescription: 'Only for the Whales Club members',
                team: 'Team',
                teamDescription: 'Only for Ton Whales teammates and TOP 15 the Whales Club members',
                joinClub: 'Join the Club',
                joinTeam: 'Join our team',
                clubBanner: 'Become our Club Member',
                clubBannerLearnMore: 'Learn about our club',
                clubBannerDescription: 'If you are not participating in our Club membership your deposited funds will be held on the Staking Balance but will not be staked on this pool.',
                teamBanner: 'Become our Team Member',
                teamBannerLearnMore: 'Learn about our team',
                teamBannerDescription: 'If you are not a part of our team or one of top 15 Club members your deposited funds will be held on the Staking Balance but will not be staked on this pool.',
                epnPartners: 'ePN Partners',
            },
            transfer: {
                stakingWarning: 'You can always deposit new stake or increase existing one with any amount. Please note that minimum amount is: {{minAmount}}',
                depositStakeTitle: 'Staking',
                depositStakeConfirmTitle: 'Confirm Staking',
                withdrawStakeTitle: 'Withdrawal Request',
                withdrawStakeConfirmTitle: 'Confirm Withdrawal',
                topUpTitle: 'Top Up',
                topUpConfirmTitle: 'Confirm Top Up',
                notEnoughStaked: 'unfortunately you don\'t have enougth coins staked',
                confirmWithdraw: 'Request Withdrawal',
                confirmWithdrawReady: 'Withdraw now',
                restrictedTitle: 'This Staking Pool is restricted',
                restrictedMessage: 'Your funds will not participate in staking if your wallet address is not on the permit list, but will be on the pool balance and awaiting a withdrawal',
                notEnoughCoinsFee: 'There are not enough TON on your wallet balance to pay the fee. Please note that the {{amount}} TON fee must be on the main balance, not on the staking balance',
                notEnoughCoins: 'There are not enough funds on your wallet balance to top up the staking balance',
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
                moreAbout: 'More about Ton Whales Staking Pool',
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
                withdrawRequestFee: 'Withdraw request Fee',
                withdrawCompleteFee: 'Withdrawal completion request Fee',
                blockchainFee: 'Blockhain fee',
                cooldownTitle: 'Cooldown period',
                cooldownActive: 'Active',
                cooldownInactive: 'Inactive',
                cooldownDescription: 'Two-hour period applied at the start of each staking cycle to improve the process of withdrawals and deposits between cycles',
            },
            minAmountWarning: 'Minimum amount is {{minAmount}} TON',
            tryAgainLater: 'Please, try again later',
            banner: {
                estimatedEarnings: 'Your estimated yearly earnings will decrease by {{amount}}\u00A0TON\u00A0({{price}})',
                estimatedEarningsDev: 'Your estimated yearly earnings will decrease',
                message: 'Are you sure about the unstaking?'
            }
        },
    },
    welcome: {
        title: 'Tonhub',
        titleDev: 'Ton Sandbox Wallet',
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
        protectPasscode: 'Protect with Passcode',
        upgradeTitle: 'Upgrade needed',
        upgradeMessage: 'Please, allow the app access to wallet keys for an upgrade. No funds would be transferred during this upgrade. Please, make sure that you backed up your keys.',
        allowUpgrade: 'Allow upgrade',
        backup: 'Backup secret words'
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
            message: 'unfortunately we are unable to save data. Please, restart your phone.'
        },
        title: 'Ooops',
        invalidNumber: 'Nope, this is not a real number. Please, check your input and try again.',
        codeTooManyAttempts: 'You tried too much, please try again in 15 minutes.',
        codeInvalid: 'Nope, entered code is invalid. Check code and try again.',
        unknown: 'Woof, it is an unknown error. I literally have no idea what\'s going on. Can you try to turn it on and off?',
    },
    confirm: {
        logout: {
            title: 'Are you sure you want to disconnect your wallet from this app and delete all your data from the app?',
            message: 'This action will result in deleting all accounts from this device. Make sure you have backed up your 24 secret words before proceeding.'
        },
        changeCurrency: 'Change primary currency to {{currency}}'
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
        confirm: {
            title: 'Are you sure want to close this form?',
            message: 'This will discard all of you changes'
        },
    },
    known: {
        deposit: 'Deposit',
        depositOk: 'Deposit accepted',
        withdraw: 'Request withdraw of {{coins}} 💎',
        withdrawAll: 'Request withdraw of all coins',
        withdrawCompleted: 'Withdraw completed',
        withdrawRequested: 'Withdraw requested',
        upgrade: 'Upgrade code to {{hash}}',
        upgradeOk: 'Upgrade completed',
        cashback: 'Cashback',
        tokenSent: 'Token sent',
        tokenReceived: 'Token received'
    },
    jetton: {
        token: 'token'
    },
    connections: {
        extensions: 'Extensions',
        connections: 'External apps'
    },
    accounts: {
        active: 'Active',
        noActive: 'No active accounts',
        disabled: 'Hidden',
        alertActive: 'Mark {{symbol}} active',
        alertDisabled: 'Mark {{symbol}} hidden',
        description: 'To change the status of an account, long press the account button on the home screen or press in this menu. The account will be added to the home screen or hidden.',
        noAccounts: 'You have no accounts yet',
    },
    spamFilter: {
        minAmount: 'Min TON amount',
        dontShowComments: 'Don\'t show comments on SPAM transactions',
        minAmountDescription: 'Transactions with TON amount less than {{amount}} will be automatically marked as SPAM',
        applyConfig: 'Apply selected SPAM filter settings',
        denyList: 'Manual spam filter',
        denyListEmpty: 'No blocked addresses yet',
        unblockConfirm: 'Unblock address',
        blockConfirm: 'Mark address as spam',
        description: 'You can easily add the address to the list of manually blocked addresses  if you click on any transaction or address and select the option \"Mark address as spam\" in the pop-up menu.'
    },
    report: {
        title: 'Report',
        scam: 'scam',
        bug: 'bug',
        spam: 'spam',
        offense: 'offensive content',
        posted: 'Your report is sent',
        error: 'Error sending report',
        message: 'Message (required)',
        reason: 'Report reason'
    },
    review: {
        title: 'Review extension',
        rating: 'rating',
        review: 'Review (optional)',
        heading: 'Title',
        error: 'Error posing review',
        posted: 'Your review is sent'
    },
    deleteAccount: {
        title: 'Delete account',
        action: 'Delete account and all data',
        logOutAndDelete: 'Log Out and Delete all data',
        description: 'To remove your account from the TON blockchain, you need to transfer all your TON coins to another wallet by sending a special transaction. This action will remove all accounts from that device and your blockchain account.\n\nTo complete this transaction, make sure you have more than {{amount}} of TON coins in your account before proceeding.',
        complete: 'Account deletion completed',
        error: {
            hasNfts: 'You have NFTs in your wallet, in order to delete the account, please send them to another wallet.',
            fetchingNfts: 'Could not find out if there are NFTs on the wallet. In order to delete the account, please make sure there are no NFTs on it.'
        },
        confirm: {
            title: 'Are you sure you want to delete your account and all data from this application?',
            message: 'This action will delete your account and all data from this application.'
        }
    },
    contacts: {
        title: 'Contacts',
        contact: 'Contact',
        name: 'First name',
        lastName: 'Last name',
        company: 'Company',
        add: 'Add Contact',
        edit: 'Edit Contact',
        save: 'Save',
        notes: 'Notes',
        alert: {
            name: 'Incorrect name',
            nameDescription: 'Contact name can\'t be empty or longer than 126 characters',
            notes: 'Incorrect field',
            notesDescription: 'Contact fields can\'t be longer than 280 characters',
        },
        delete: 'Delete contact',
        empty: 'No contacts yet',
        description: 'You can add an address to your contacts easily if you long press on any transaction or address and select \"Add address to contacts\" in the pop-up menu.',
        contactAddress: 'Contacts address',
    },
    currency: {
        USD: "United States dollar",
        EUR: "Euro",
        RUB: "Russian ruble",
        GBP: "British Pounds",
        CHF: "Swiss franc",
        CNY: "Chinese yuan",
        KRW: "South Korean won",
        IDR: "Indonesian rupiah",
        INR: "Indian rupee",
        JPY: "Japanese yen",
    },
    txActions: {
        addressShare: 'Share address',
        addressContact: 'Add address to contacts',
        addressContactEdit: 'Edit address contact',
        addressMarkSpam: 'Mark address as spam',
        txShare: 'Share transaction',
        txRepeat: 'Repeat transaction',
        share: {
            address: 'TON address',
            transaction: 'TON transaction',
        }
    }
};

export default schema;