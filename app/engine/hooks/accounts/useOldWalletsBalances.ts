import { useMemo } from "react";
import { WalletContractV1R1, WalletContractV1R2, WalletContractV1R3, WalletContractV2R1, WalletContractV2R2, WalletContractV3R1, WalletContractV3R2 } from "@ton/ton";
import { useSelectedAccount } from "../appstate/useSelectedAccount";
import { useAccountsLite } from "./useAccountsLite";

export function useOldWalletsBalances() {
    let account = useSelectedAccount();

    let wallets = useMemo(() => {
        if (!account) {
            return [];
        }
        return [
            WalletContractV1R1.create({ workchain: 0, publicKey: account.publicKey }).address,
            WalletContractV1R2.create({ workchain: 0, publicKey: account.publicKey }).address,
            WalletContractV1R3.create({ workchain: 0, publicKey: account.publicKey }).address,
            WalletContractV2R1.create({ workchain: 0, publicKey: account.publicKey }).address,
            WalletContractV2R2.create({ workchain: 0, publicKey: account.publicKey }).address,
            WalletContractV3R1.create({ workchain: 0, publicKey: account.publicKey }).address,
            WalletContractV3R2.create({ workchain: 0, publicKey: account.publicKey }).address,
        ];
    }, [account]);

    const accounts = useAccountsLite(wallets);

    const totalBalance = accounts.reduce((total, acc) => {
        if (!!acc?.data?.balance) {
            return total + BigInt(acc?.data?.balance.coins);
        }
        return total;
    }, BigInt(0));

    return { total: totalBalance, accounts };
}