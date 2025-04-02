import { TonTransport } from "@ton-community/ton-ledger";

export const checkLedgerTonAppVersion = async (tonTransport?: TonTransport | null): Promise<boolean> => {
    if (!tonTransport) {
        return false;
    }

    try {
        await tonTransport.getVersion();
        return true;
    } catch {
        return false;
    }
};