import { Address } from "ton";
import { AppConfig } from "../AppConfig";

export function shortAddress({ address, friendly }: { address?: Address, friendly?: string }) {
    if (address) {
        let t = address.toFriendly({ testOnly: AppConfig.isTestnet });
        return t.slice(0, 2) + '...' + t.slice(t.length - 6);
    }
    if (friendly) {
        return friendly.slice(0, 2) + '...' + friendly.slice(friendly.length - 6);
    }
    return '';
}