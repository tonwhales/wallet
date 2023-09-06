export const Queries = {
    Account: (address: string) => ({
        ...['account', address],
        State: () => ['account', address, 'state'],
        Transactions: () => ['account', address, 'transactions'],
        Hints: () => ['account', address, 'hints'],
    }),
    Cloud: (address: string) => ({
        Key: (key: string) => ['cloud', address, key]
    }),
    TonPrice: () => ['tonPrice'],
    Apps: (url: string) => ({
        Manifest: () => ['apps', url, 'manifest'],
        AppData: () => ['apps', url, 'appData'],
    })
}