import { AppConfig } from "../AppConfig";

export function pathFromAccountNumber(account: number) {
    let network = AppConfig.isTestnet ? 2 : 0;
    let chain = 0;
    return [44, 607, network, chain, account, 0];
}