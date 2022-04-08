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
        comment: string
    }
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
            send: string
        },
        empty: {
            message: string,
            receive: string
        }
    },
    tx: {
        sending: string,
        sent: string,
        received: string
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
        purpose: string,
        comment: string,
        confirmAddAll: string
        addAllTitle: string
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
        }
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
        transactionRequest: string
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
    }
};

export type LocalizedResources = Paths<LocalizationSchema, string>;
export type LocalizedPluralsResources = Paths<LocalizationSchema, Plural>;

export type Pluralize<T, P extends string> = AddSuffixes<ReplaceTypeRecurcive<FilterTypeRecursive<T, Plural>, Plural, string>, P>;
export type PrepareSchema<T, P extends string> = FlattenForIntellisense<FilterNotTypeRecursive<T, Plural> & Pluralize<LocalizationSchema, P>>;