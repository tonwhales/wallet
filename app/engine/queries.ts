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
            Chart: (member: string) => ['account', address, 'staking', 'chart', member],
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
    }),
    TonPrice: () => ['tonPrice'],
    Apps: (url: string) => ({
        Manifest: () => ['apps', url, 'manifest'],
        AppData: () => ['apps', url, 'appData'],
    }),
    Job: () => (['job']),
    APY: () => (['staking', 'apy']),
}