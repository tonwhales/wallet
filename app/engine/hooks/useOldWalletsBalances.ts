import { useMemo } from "react";
import { useNetwork } from "./useNetwork";
import { WalletContractV1R1, WalletContractV1R2, WalletContractV1R3, WalletContractV2R1, WalletContractV2R2, WalletContractV3R1, WalletContractV3R2 } from "@ton/ton";
import { useSelectedAccount } from "./useSelectedAccount";
import { useQueries } from "@tanstack/react-query";
import { useClient4 } from "./useClient4";
import { Queries } from "../queries";
import { getLastBlock } from "../accountWatcher";

export function useOldWalletsBalances() {
    let { isTestnet } = useNetwork();
    let client = useClient4(isTestnet);
    let account = useSelectedAccount();

    let wallets = useMemo(() => {
        if (!account) {
            return [];
        }
        return [
            WalletContractV1R1.create({ workchain: 0, publicKey: account?.publicKey }).address,
            WalletContractV1R2.create({ workchain: 0, publicKey: account?.publicKey }).address,
            WalletContractV1R3.create({ workchain: 0, publicKey: account?.publicKey }).address,
            WalletContractV2R1.create({ workchain: 0, publicKey: account?.publicKey }).address,
            WalletContractV2R2.create({ workchain: 0, publicKey: account?.publicKey }).address,
            WalletContractV3R1.create({ workchain: 0, publicKey: account?.publicKey }).address,
            WalletContractV3R2.create({ workchain: 0, publicKey: account?.publicKey }).address,
        ];
    }, [account]);

    const queries = useQueries({
        queries: wallets.map(w => ({
            queryKey: Queries.Account(w.toString({ testOnly: isTestnet })).Lite(),
            queryFn: async () => {
                let last = await getLastBlock();
                const res = await client.getAccountLite(last, w);
                return { address: w, balace: res.account.balance.coins };
            },
        })),
    });

    const totalBalance = queries.reduce((acc, q) => {
        if (q.data) {
            return acc + BigInt(q.data.balace);
        }
        return acc;
    }, BigInt(0));

    return { total: totalBalance, wallets: queries.map(q => q.data) };
}