export const Queries = {
    Account: (address: string) => ({
        ...['account', address],
        State: () => ['account', address, 'state'],
        Transactions: () => ['account', address, 'transactions'],
        Hints: () => ['account', address, 'hints'],
        Cards: () => ['account', address, 'cards']
    }),
    TonPrice: () => ['tonPrice'],
    Apps: (url: string) => ({
        Manifest: () => ['apps', url, 'manifest'],
        AppData: () => ['apps', url, 'appData'],
    })
}