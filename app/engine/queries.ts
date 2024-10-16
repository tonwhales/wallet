export const Queries = {
    // Everything in account is invalidated futher in onAccountTouched.ts
    Account: (address: string) => ({
        All: () => ['account', address],
        Lite: () => ['account', address, 'lite'],
        WalletV4: () => ['account', address, 'wallet-v4'],
        JettonWallet: () => ['account', address, 'jettonWallet'],
        StakingPool: () => ({
            Status: () => ['account', address, 'staking', 'status'],
            Params: () => ['account', address, 'staking', 'params'],
        }),
    }),
    Job: (address: string) => (['job', address]),

    StakingChart: (pool: string, fixedPeriod: 'week' | 'month' | 'year' | 'allTime', member: string) => ['staking', 'chart', pool, fixedPeriod, member, 'askdjsd'],
    StakingMember: (pool: string, member: string) => ['staking', 'member', pool, member],
    StakingStatus: (network: 'mainnet' | 'testnet') => ['staking', 'status', network],
    StakingLiquid: (pool: string) => ['staking', 'liquid', pool],
    StakingLiquidMember: (pool: string, member: string) => ['staking', 'member', 'liquid', pool, member],

    Transactions: (address: string) => ['transactions', address],
    Holders: (address: string) => ({
        All: () => ['holders', address],
        Status: () => ['holders', address, 'status'],
        Cards: (mode: 'private' | 'public') => ['holders', address, 'cards', mode],
        Notifications: (id: string) => ['holders', address, 'events', id],
        Invite: () => ['holders', address, 'invite'],
    }),

    ContractMetadata: (address: string) => (['contractMetadata', address]),
    ContractInfo: (address: string) => (['contractInfo', address]),
    Config: (network: 'testnet' | 'mainnet') => ['config', network],
    ServerConfig: () => ['serverConfig'],
    AppVersionsConfig: (network: 'testnet' | 'mainnet') => ['appVersionsConfig', network],

    Hints: (address: string) => (['hints', address]),
    Mintless: (address: string) => (['mintless', address]),
    Cloud: (address: string) => ({
        Key: (key: string) => ['cloud', address, key]
    }),
    Jettons: () => ({
        MasterContent: (masterAddress: string) => ['jettons', 'master', masterAddress, 'content'],
        Address: (address: string) => ({
            AllWallets: () => ['jettons', 'address', address, 'master'],
            Wallet: (masterAddress: string) => ['jettons', 'address', address, 'master', masterAddress],
            WalletPayload: (walletAddress: string) => ['jettons', 'address', address, 'wallet', walletAddress, 'payload'],
            Transactions: (master: string) => ['jettons', 'address', address, 'master', master, 'transactions']
        }),
        Swap: (masterAddress: string) => ['jettons', 'swap', masterAddress],
        Known: () => ['jettons', 'known'],
        GaslessConfig: () => ['jettons', 'gaslessConfig'],
        Rates: (masterAddress: string) => ['jettons', 'rates', masterAddress],
    }),
    TonPrice: () => ['tonPrice'],
    Apps: (url: string) => ({
        Manifest: () => ['apps', url, 'manifest'],
        AppData: () => ['apps', url, 'appData'],
        Stats: () => ['apps', url, 'stats'],
    }),
    APY: (network: 'mainnet' | 'testnet') => (['staking', 'apy', network]),
    PoolApy: (pool: string) => (['staking', 'poolApy', pool]),

    Banners: (language: string, version: string, buildNumber: string) => (['banners', language, version, buildNumber]),
    BrowserListings: (network: 'mainnet' | 'testnet') => (['browserListings', network]),

    AppConfig: (network: 'mainnet' | 'testnet') => (['appConfig', network]),
}