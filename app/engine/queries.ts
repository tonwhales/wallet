export const Queries = {
    // Everything in account is invalidated futher in onAccountTouched.ts
    Account: (address: string) => ({
        All: () => ['account', address],
        Lite: () => ['account', address, 'lite'],
        JettonWallet: () => ['account', address, 'jettonWallet'],
        StakingPool: () => ({
            Status: () => ['account', address, 'staking', 'status'],
            Params: () => ['account', address, 'staking', 'params'],
            Member: (member: string) => ['account', address, 'staking', 'member', member],
            Chart: (pool: string, fixedPeriod: 'week' | 'month' | 'year' | 'allTime') => ['account', address, 'staking', 'chart', pool, fixedPeriod],
        }),
    }),
    
    Transactions: (address: string) => ['transactions', address],
    Holders: (address: string) => ({
        Status: () => ['holders', address, 'status'],
        Cards: () => ['holders', address, 'cards'],
        Notifications: (id: string) => ['holders', address, 'notifications', id],
    }),

    ContractMetadata: (address: string) => (['contractMetadata', address]),
    Config: () => ['config'],
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
    }),
    TonPrice: () => ['tonPrice'],
    Apps: (url: string) => ({
        Manifest: () => ['apps', url, 'manifest'],
        AppData: () => ['apps', url, 'appData'],
        Stats: () => ['apps', url, 'stats'],
    }),
    Job: () => (['job']),
    APY: () => (['staking', 'apy']),
}