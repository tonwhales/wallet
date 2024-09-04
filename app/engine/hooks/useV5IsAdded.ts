import { useAppState } from ".";
import { useEffect, useState } from "react";
import { contractFromPublicKey } from "../contractFromPublicKey";
import { WalletVersions } from "../types";

export function useV5IsAdded(): boolean {
    const [isAdded, setIsAdded] = useState(true);
    const appState = useAppState();

    useEffect(() => {
        (async () => {
            const selected = appState.addresses[appState.selected];
    
            if (!selected) {
                setIsAdded(false);
                return;
            }
    
            const contract = await contractFromPublicKey(selected.publicKey, WalletVersions.v5R1);
            const added = appState.addresses.some((a) => a.address.equals(contract.address));

            setIsAdded(added);
        })();
    }, [appState]);

    return isAdded;
}