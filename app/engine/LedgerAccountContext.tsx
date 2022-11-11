import React, { useEffect } from "react";
import { Address } from "ton";
import { useEngine } from "./Engine";
import { LedgerWalletProduct } from "./products/LedgerWalletProduct";
import { startAccountLiteSync } from "./sync/startAccountLiteSync";

export const LedgerAccountContext = React.createContext<LedgerWalletProduct | null>(null);

export const LedgerAccountLoader = React.memo((props: { address: string, children?: any }) => {
    const engine = useEngine();
    const address = React.useMemo(() => Address.parse(props.address), [props.address]);


    const product = new LedgerWalletProduct(engine, address);

    useEffect(() => {
        startAccountLiteSync(address, engine);
    }, []);

    return (
        <LedgerAccountContext.Provider value={product}>
            {props.children}
        </LedgerAccountContext.Provider>
    );
})

export function useLedgerWallet(): LedgerWalletProduct {
    return React.useContext(LedgerAccountContext)!;
}