import { Address } from "@ton/core";
import { useCallback } from "react";
import { useRecoilState } from "recoil";
import { useNetwork } from "../network";
import { addressFormatsHistoryAtom } from "../../state/addressFormatsHistory";

const MAX_FORMATS = 50;

export function useAddressFormatsHistory() {
    const { isTestnet } = useNetwork();
    const [formats, setFormats] = useRecoilState(addressFormatsHistoryAtom);

    const saveAddressFormat = useCallback((address: Address | string, bounceableFormat: boolean) => {
        const addressString =  address.toString({ testOnly: isTestnet })

        setFormats((currentFormats) => {
            const newFormats = new Map(currentFormats);
            
            if (newFormats.has(addressString)) {
                newFormats.delete(addressString);
            }
            
            newFormats.set(addressString, { lastUsedBounceableFormat: bounceableFormat });
            
            if (newFormats.size > MAX_FORMATS) {
                const firstKey = Array.from(newFormats.keys())[0];
                if (firstKey) {
                    newFormats.delete(firstKey);
                }
            }
            
            return newFormats;
        });
    }, [isTestnet, setFormats]);

    const getAddressFormat = useCallback((address?: Address | null): boolean | undefined => {
        if (!address) {
            return undefined;
        }
        const addressString = address.toString({ testOnly: isTestnet })   
        const format = formats.get(addressString);
        return format?.lastUsedBounceableFormat;
    }, [formats, isTestnet]);

    return {
        saveAddressFormat,
        getAddressFormat
    };
} 