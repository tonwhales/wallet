export function pathFromAccountNumber(account: number, isTestnet: boolean) {
    let network = isTestnet ? 2 : 0;
    let chain = 0;
    return [44, 607, network, chain, account, 0];
}