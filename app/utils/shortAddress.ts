import { Address } from "@ton/core";

export function shortAddress({ isTestnet, address, friendly }: { isTestnet: boolean, address?: Address, friendly?: string }) {
    if (address) {
        let t = address.toString({ testOnly: isTestnet });
        return t.slice(0, 2) + '...' + t.slice(t.length - 6);
    }
    if (friendly) {
        return friendly.slice(0, 2) + '...' + friendly.slice(friendly.length - 6);
    }
    return '';
}