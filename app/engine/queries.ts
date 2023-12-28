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
            Member: (member: string) => ['account', address, 'staking', 'member', member],
        }),
    }),
    Job: (address: string) => (['job', address]),

    StakingChart: (pool: string, fixedPeriod: 'week' | 'month' | 'year' | 'allTime', member: string) => ['staking', 'chart', pool, fixedPeriod, member, 'askdjsd'],

    Transactions: (address: string) => ['transactions', address],
    Holders: (address: string) => ({
        All: () => ['holders', address],
        Status: () => ['holders', address, 'status'],
        Cards: (mode: 'private' | 'public') => ['holders', address, 'cards', mode],
        Notifications: (id: string) => ['holders', address, 'events', id],
    }),

    ContractMetadata: (address: string) => (['contractMetadata', address]),
    Config: (network: 'testnet' | 'mainnet') => ['config', network],
    ServerConfig: () => ['serverConfig'],

    Hints: (address: string) => (['hints', address]),
    Cloud: (address: string) => ({
        Key: (key: string) => ['cloud', address, key]
    }),
    Jettons: () => ({
        MasterContent: (masterAddress: string) => ['jettons', 'master', masterAddress, 'content'],
        Address: (address: string) => ({
            AllWallets: () => ['jettons', 'address', address, 'master'],
            Wallet: (masterAddress: string) => ['jettons', 'address', address, 'master', masterAddress],
        }),
        Swap: (masterAddress: string) => ['jettons', 'swap', masterAddress],
    }),
    TonPrice: () => ['tonPrice'],
    Apps: (url: string) => ({
        Manifest: () => ['apps', url, 'manifest'],
        AppData: () => ['apps', url, 'appData'],
        Stats: () => ['apps', url, 'stats'],
    }),
    APY: (network: 'mainnet' | 'testnet') => (['staking', 'apy', network]),
}