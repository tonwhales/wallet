import { Address } from "@ton/core";
import { useCallback } from "react";
import { useRecoilState } from "recoil";
import { useNetwork } from "../network";
import { addressFormatsHistoryAtom } from "../../state/addressFormatsHistory";

export function useAddressFormatsHistory() {
    const { isTestnet } = useNetwork();
    const [formats, setFormats] = useRecoilState(addressFormatsHistoryAtom);

    const saveAddressFormat = useCallback((address: Address | string, bounceableFormat: boolean) => {
        const addressString = address.toString({ testOnly: isTestnet })

        setFormats((currentFormats) => {
            return {
                ...currentFormats,
                [addressString]: { lastUsedBounceableFormat: bounceableFormat }
            };
        });
    }, [isTestnet, setFormats]);

    const getAddressFormat = useCallback((address?: Address | null): boolean | undefined => {
        if (!address) {
            return undefined;
        }
        const addressString = address.toString({ testOnly: isTestnet })   
        const format = formats[addressString];
        return format?.lastUsedBounceableFormat;
    }, [formats, isTestnet]);

    return {
        saveAddressFormat,
        getAddressFormat
    };
} 