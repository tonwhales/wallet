export const Queries = {
    Account: (address: string) => ({
        State: () => ['account', address],
        Transactions: () => ['account', address, 'transactions'],
        Hints: () => ['account', address, 'hints'],
        Cards: () => ['account', address, 'cards']
    }),
    TonPrice: () => ['tonPrice'],
}