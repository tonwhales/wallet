import { TonTransport } from "@ton-community/ton-ledger";
import { pathFromAccountNumber } from "../pathFromAccountNumber";
import { wait } from "../wait";

// https://github.com/tonkeeper/tonkeeper-web/blob/301801a6665cf6c0f329e668b364a3bab684c913/packages/core/src/service/ledger/connector.ts#L56

export const isLedgerTonAppReady = async (tonTransport?: TonTransport | null) => {
    if (!tonTransport) {
        return false;
    }

    for (let i = 0; i < 10; i++) {
        try {
            const isTonOpen = await tonTransport.isAppOpen();

            if (isTonOpen) {
                // Workaround for Ledger S, this is a way to check if it is unlocked.
                // There will be an error with code 0x530c
                await tonTransport.getAddress(pathFromAccountNumber(0, false));

                return true;
            }
        } catch (err: unknown) {
            console.error(err);
        }

        await wait(100);
    }

    return false;
};