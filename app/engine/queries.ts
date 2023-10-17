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
        Transactions: () => ['transactions', address],
        Holders: () => ({
            Status: () => ['account', address, 'holders', 'status'],
            Cards: () => ['account', address, 'holders', 'cards'],
            Notifications: (id: string) => ['account', address, 'holders', 'notifications', id],
        }),
    }),

    ContractMetadata: (address: string) => (['contractMetadata', address]),
    Config: () => ['config'],

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
}