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
        copy: string,
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
        close: string
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
        developerTools: string
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
        }
    },
    tx: {
        sending: string,
        sent: string,
        received: string,
        bounced: string,
        tokenTransfer: string
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
            sendingToYourself: string,
            zeroCoins: string,
            notEnoughCoins: string,
            addressIsForTestnet: string,
            addressCantReceive: string,
            addressIsNotActive: string
        },
        sendAll: string,
        scanQR: string,
        sendTo: string,
        fee: string,
        feeTitle: string,
        purpose: string,
        comment: string,
        commentRequired: string,
        commentLabel: string,
        checkComment: string,
        confirmTitle: string
    },
    auth: {
        title: string,
        message: string,
        hint: string,
        action: string,
        expired: string,
        completed: string,
        noApps: string,
        name: string,
        revoke: {
            title: string,
            message: string,
            action: string
        },
        apps: {
            title: string
        }
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
        noPermission: string
    },
    products: {
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
                blockchainFee: string,
            },
            minAmountWarning: string,
            tryAgainLater: string,
            banner: {
                estimatedEarnings: string,
                estimatedEarningsDev: string,
                message: string
            }
        },
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
        protectPasscode: string
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
        }
    },
    confirm: {
        logout: {
            title: string,
            message: string
        }
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
    }
};

export type LocalizedResources = Paths<LocalizationSchema, string>;
export type LocalizedPluralsResources = Paths<LocalizationSchema, Plural>;

export type Pluralize<T, P extends string> = AddSuffixes<ReplaceTypeRecurcive<FilterTypeRecursive<T, Plural>, Plural, string>, P>;
export type PrepareSchema<T, P extends string> = FlattenForIntellisense<FilterNotTypeRecursive<T, Plural> & Pluralize<LocalizationSchema, P>>;