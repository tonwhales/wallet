import { Address } from "@ton/core";

export function shortAddress({ isTestnet, address, friendly, isBounceable }: { isTestnet?: boolean, address?: Address, friendly?: string, isBounceable?: boolean }) {
    if (address) {
        let t = address.toString({ testOnly: isTestnet, bounceable: isBounceable ?? true });
        return t.slice(0, 5) + '...' + t.slice(t.length - 5);
    }
    if (friendly) {
        return friendly.slice(0, 5) + '...' + friendly.slice(friendly.length - 5);
    }
    return '';
}