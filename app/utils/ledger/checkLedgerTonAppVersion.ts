import { TonTransport } from "@ton-community/ton-ledger";

const SUPPORTED_VERSION = '2.4.1';

export const checkLedgerTonAppVersion = async (tonTransport?: TonTransport | null): Promise<boolean> => {
    if (!tonTransport) {
        return false;
    }

    try {
        const version = await tonTransport.getVersion();
        return version >= SUPPORTED_VERSION;
    } catch {
        return false;
    }
};