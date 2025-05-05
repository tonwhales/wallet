import { Address } from "@ton/core";

export const isTonAddress = (value: string) => {
    try {
        Address.parse(value);
        return true;
    } catch {
        return false;
    }
};