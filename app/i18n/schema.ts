import { AddSuffixes, ReplaceTypeRecurcive, FilterTypeRecursive, FilterNotTypeRecursive, FlattenForIntellisense } from './../utils/types';
import { Paths } from '../utils/types';
export type Plural = number;

export type LocalizationSchema = {
    lang: string,
    common: {
        and: string,
        accept: string,
        start: string,
        continue: string,
        continueAnyway: string,
        back: string,
        logout: string,
        cancel: string,
        balance: string,
        walletAddress: string,
        recepientAddress: string,
        copy: string,
        copiedAlert: string,
        copied: string,
        share: string,
        send: string,
        yes: string,
        no: string,
        amount: string,
        today: string,
        yesterday: string,
        comment: string,
        products: string,
        confirm: string,
        soon: string,
        in: string,
        max: string,
        close: string,
        delete: string,
        apply: string,
        domainOrAddress: string,
        domain: string,
        search: string,
        termsOfService: string,
        privacyPolicy: string,
        apy: string,
        tx: string,
        add: string,
        gotIt: string,
        error: string,
        wallet: string
    },
    syncStatus: {
        connecting: string,
        updating: string,
        online: string
    },
    home: {
        wallet: string,
        settings: string
    }
    settings: {
        title: string,
        backupKeys: string,
        migrateOldWallets: string,
        termsOfService: string,
        privacyPolicy: string,
        developerTools: string,
        spamFilter: string,
        logoutDescription: string,
        primaryCurrency: string
    },
    wallet: {
        sync: string,
        balanceTitle: string,
        actions: {
            receive: string,
            send: string,
            buy: string
        },
        empty: {
            message: string,
            receive: string
        },
        pendingTransactions: string
    },
    transactions: {
        title: string,
        history: string,
    },
    tx: {
        sending: string,
        sent: string,
        received: string,
        bounced: string,
        tokenTransfer: string,
        airdrop: string,
        failed: string
    },
    txPreview: {
        sendAgain: string,
        blockchainFee: string
    },
    receive: {
        title: string,
        subtitle: string,
        share: {
            title: string
        }
    },
    transfer: {
        title: string,
        titleAction: string,
        confirm: string,
        error: {
            invalidAddress: string,
            invalidAmount: string,
            invalidDomain: string,
            invalidDomainString: string,
            sendingToYourself: string,
            zeroCoins: string,
            notEnoughCoins: string,
            addressIsForTestnet: string,
            addressCantReceive: string,
            addressIsNotActive: string
            addressIsNotActiveDescription: string,
            invalidTransaction: string,
        },
        sendAll: string,
        scanQR: string,
        sendTo: string,
        fee: string,
        feeTitle: string,
        feeTotalTitle: string,
        purpose: string,
        comment: string,
        commentRequired: string,
        commentLabel: string,
        checkComment: string,
        confirmTitle: string,
        confirmManyTitle: string,
        unknown: string,
        moreDetails: string,
        gasFee: string,
        contact: string,
        firstTime: string,
        requestsToSign: string,
        smartContract: string,
        txsSummary: string,
        txsTotal: string,
        gasDetails: string,
        jettonGas: string,
        unusualJettonsGas: string,
        unusualJettonsGasTitle: string,
        unusualJettonsGasMessage: string,
        addressNotActive: string,
        wrongJettonTitle: string,
        wrongJettonMessage: string,
        notEnoughJettonsTitle: string,
        notEnoughJettonsMessage: string,
    },
    auth: {
        phoneVerify: string,
        phoneNumber: string,
        phoneTitle: string
        phoneSubtitle: string,
        codeTitle: string,
        codeSubtitle: string,
        codeHint: string,
        title: string,
        message: string,
        hint: string,
        action: string,
        expired: string,
        failed: string,
        completed: string,
        authorized: string,
        authorizedDescription: string,
        noApps: string,
        name: string,
        yourWallet: string,
        revoke: {
            title: string,
            message: string,
            action: string
        },
        apps: {
            title: string,
            delete: {
                title: string,
                message: string
            },
            description: string,
            installExtension: string
        },
        consent: string,
    },
    install: {
        title: string,
        message: string,
        action: string
    },
    sign: {
        title: string,
        message: string,
        hint: string,
        action: string
    },
    migrate: {
        title: string,
        subtitle: string,
        inProgress: string,
        transfer: string,
        check: string
    },
    qr: {
        title: string,
        requestingPermission: string,
        noPermission: string,
        requestPermission: string
    },
    products: {
        tonConnect: {
            errors: {
                connection: string
            }
        },
        accounts: string,
        services: string,
        oldWallets: {
            title: string,
            subtitle: string
        },
        transactionRequest: {
            title: string,
            subtitle: string
        },
        signatureRequest: {
            title: string,
            subtitle: string
        },
        staking: {
            title: string,
            balance: string,
            subtitle: {
                join: string,
                rewards: string,
                apy: string,
                joined: string,
                devPromo: string
            },
            nextCycle: string,
            cycleNote: string,
            cycleNoteWithdraw: string,
            buttonTitle: string,
            balanceTitle: string,
            actions: {
                top_up: string,
                deposit: string,
                withdraw: string,
            },
            pools: {
                active: string,
                best: string,
                alternatives: string,
                private: string,
                restrictedTitle: string,
                restrictedMessage: string,
                viewClub: string,
                nominators: string,
                nominatorsDescription: string,
                club: string,
                clubDescription: string,
                team: string,
                teamDescription: string,
                joinClub: string,
                joinTeam: string,
                clubBanner: string,
                clubBannerLearnMore: string,
                clubBannerDescription: string,
                teamBanner: string,
                teamBannerLearnMore: string,
                teamBannerDescription: string,
                epnPartners: string,
                epnPartnersDescription: string,
                moreAboutEPN: string,
                lockups: string,
                lockupsDescription: string,
            },
            transfer: {
                stakingWarning: string,
                depositStakeTitle: string,
                depositStakeConfirmTitle: string,
                withdrawStakeTitle: string,
                withdrawStakeConfirmTitle: string,
                topUpTitle: string,
                topUpConfirmTitle: string,
                notEnoughStaked: string,
                confirmWithdraw: string,
                confirmWithdrawReady: string,
                restrictedTitle: string,
                restrictedMessage: string,
                notEnoughCoinsFee: string,
                notEnoughCoins: string,
            },
            join: {
                title: string,
                message: string,
                buttonTitle: string,
                moreAbout: string,
                earn: string,
                onYourTons: string,
                yearly: string,
                apy: string,
                cycle: string,
                ownership: string,
                withdraw: string,
                successTitle: string,
                successEtimation: string,
                successNote: string
            },
            pool: {
                balance: string,
                members: string,
                profitability: string
            },
            empty: {
                message: string
            },
            pending: {
                deposit: string,
                withdraw: string
            },
            withdrawStatus: {
                pending: string,
                ready: string,
                withdrawNow: string
            },
            depositStatus: {
                pending: string
            },
            withdraw: string,
            sync: string,
            unstake: {
                title: string,
                message: string
            },
            learnMore: string,
            moreInfo: string,
            calc: {
                yearly: string,
                monthly: string,
                daily: string,
                note: string,
                text: string,
                yearlyTopUp: string,
                yearlyTotal: string,
                yearlyCurrent: string,
                topUpTitle: string
            },
            info: {
                rate: string,
                rateTitle: string,
                frequency: string,
                frequencyTitle: string,
                minDeposit: string,
                poolFee: string,
                poolFeeTitle: string,
                depositFee: string,
                withdrawFee: string,
                withdrawRequestFee: string,
                withdrawCompleteFee: string,
                blockchainFee: string,
                cooldownTitle: string,
                cooldownActive: string,
                cooldownInactive: string,
                cooldownDescription: string,
            },
            minAmountWarning: string,
            tryAgainLater: string,
            banner: {
                estimatedEarnings: string,
                estimatedEarningsDev: string,
                message: string
            }
        },
        zenPay: {
            title: string,
            pageTitles: {
                general: string,
                card: string,
                cardDetails: string,
                cardCredentials: string,
                cardLimits: string,
                cardLimitsDefault: string,
                cardDeposit: string,
                transfer: string,
                cardSmartContract: string,
                setUpCard: string,
                pin: string
            },
            card: {
                title: string,
                defaultSubtitle: string,
                defaultTitle: string,
                type: {
                    physical: string,
                    virtual: string,
                }
            },
            confirm: {
                title: string,
                message: string,
            },
            enroll: {
                poweredBy: string,
                description_1: string,
                description_2: string,
                description_3: string,
                moreInfo: string,
                buttonSub: string
            }
        }
    }
    welcome: {
        title: string,
        titleDev: string,
        subtitle: string,
        subtitleDev: string,
        createWallet: string,
        importWallet: string
    },
    legal: {
        title: string,
        subtitle: string,
        privacyPolicy: string,
        termsOfService: string
    },
    create: {
        inProgress: string
    },
    import: {
        title: string,
        subtitle: string
    },
    secure: {
        title: string,
        titleUnprotected: string,
        subtitle: string,
        subtitleUnprotected: string,
        subtitleNoBiometrics: string,
        messageNoBiometrics: string,
        protectFaceID: string,
        protectTouchID: string,
        protectBiometrics: string,
        protectPasscode: string,
        upgradeTitle: string,
        upgradeMessage: string,
        allowUpgrade: string,
        backup: string
    },
    backup: {
        title: string,
        subtitle: string
    },
    backupIntro: {
        title: string,
        subtitle: string,
        clause1: string,
        clause2: string,
        clause3: string
    }
    errors: {
        incorrectWords: {
            title: string,
            message: string
        },
        secureStorageError: {
            title: string,
            message: string
        },
        title: string,
        invalidNumber: string,
        codeTooManyAttempts: string,
        codeInvalid: string,
        unknown: string,
    },
    confirm: {
        logout: {
            title: string,
            message: string
        },
        changeCurrency: string
    },
    neocrypto: {
        buttonTitle: string,
        alert: {
            title: string,
            message: string
        },
        title: string,
        description: string,
        doNotShow: string,
        termsAndPrivacy: string,
        confirm: {
            title: string,
            message: string
        },
    },
    known: {
        deposit: string,
        depositOk: string,
        withdraw: string,
        withdrawAll: string,
        withdrawCompleted: string,
        withdrawRequested: string,
        upgrade: string,
        upgradeOk: string,
        cashback: string,
        tokenSent: string,
        tokenReceived: string
    },
    jetton: {
        token: string
    },
    connections: {
        extensions: string,
        connections: string
    },
    accounts: {
        active: string,
        noActive: string,
        disabled: string,
        alertActive: string,
        alertDisabled: string,
        description: string,
        noAccounts: string,
    },
    spamFilter: {
        minAmount: string,
        dontShowComments: string,
        minAmountDescription: string,
        applyConfig: string,
        denyList: string,
        denyListEmpty: string,
        unblockConfirm: string,
        blockConfirm: string,
        description: string
    },
    report: {
        title: string,
        scam: string,
        bug: string,
        spam: string,
        offense: string,
        posted: string,
        error: string,
        message: string,
        reason: string
    },
    review: {
        title: string,
        rating: string,
        review: string,
        heading: string,
        posted: string,
        error: string
    },
    deleteAccount: {
        title: string,
        action: string,
        logOutAndDelete: string,
        description: string,
        complete: string,
        error: {
            hasNfts: string,
            fetchingNfts: string
        },
        confirm: {
            title: string,
            message: string
        }
    },
    contacts: {
        title: string,
        contact: string,
        name: string,
        lastName: string,
        company: string,
        add: string,
        edit: string,
        save: string,
        notes: string,
        alert: {
            name: string,
            nameDescription: string,
            notes: string,
            notesDescription: string
        },
        delete: string,
        empty: string,
        description: string,
        contactAddress: string,
    },
    currency: {
        USD: string,
        EUR: string,
        RUB: string,
        GBP: string,
        CHF: string,
        CNY: string,
        KRW: string,
        IDR: string,
        INR: string,
        JPY: string,
    },
    txActions: {
        addressShare: string,
        addressContact: string,
        addressContactEdit: string,
        addressMarkSpam: string
        txShare: string,
        txRepeat: string,
        share: {
            address: string,
            transaction: string
        }
    }
};

export type LocalizedResources = Paths<LocalizationSchema, string>;
export type LocalizedPluralsResources = Paths<LocalizationSchema, Plural>;

export type Pluralize<T, P extends string> = AddSuffixes<ReplaceTypeRecurcive<FilterTypeRecursive<T, Plural>, Plural, string>, P>;
export type PrepareSchema<T, P extends string> = FlattenForIntellisense<FilterNotTypeRecursive<T, Plural> & Pluralize<LocalizationSchema, P>>;