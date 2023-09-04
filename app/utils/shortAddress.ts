import { Address } from "ton";

export function shortAddress({ isTestnet, address, friendly }: { isTestnet: boolean, address?: Address, friendly?: string }) {
    if (address) {
        let t = address.toFriendly({ testOnly: isTestnet });
        return t.slice(0, 4) + '...' + t.slice(t.length - 4);
    }
    if (friendly) {
        return friendly.slice(0, 4) + '...' + friendly.slice(friendly.length - 6);
    }
    return '';
}