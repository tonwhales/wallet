import { Address } from "@ton/ton";

export type ParsedAddress = {
    isBounceable: boolean;
    isTestOnly: boolean;
    address: Address;
}

export function parseAnyStringAddress(src: string, isTestnet: boolean): ParsedAddress {
    if (Address.isRaw(src)) {
        const address = Address.parseRaw(src);
        return { isBounceable: true, isTestOnly: isTestnet, address };
    }

    if (Address.isFriendly(src)) {
        return Address.parseFriendly(src);
    }

    const address = Address.parse(src);

    return { isBounceable: true, isTestOnly: isTestnet, address };
}