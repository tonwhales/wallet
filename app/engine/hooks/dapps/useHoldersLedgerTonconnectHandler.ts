import { RpcMethod, SEND_TRANSACTION_ERROR_CODES, WalletResponse } from "@tonconnect/protocol";
import { useLedgerTransport } from "../../../fragments/ledger/components/TransportContext";
import { SignRawParams } from "../../tonconnect/types";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { Address, Cell } from "@ton/core";
import { parseAnyStringAddress } from "../../../utils/parseAnyStringAddress";
import { useBounceableWalletFormat, useNetwork } from "..";
import { createSimpleLedgerOrder, createUnsafeLedgerOrder } from "../../../fragments/secure/ops/Order";

export function useHoldersLedgerTonconnectHandler<T extends RpcMethod>(address: string): (id: string, params: SignRawParams, callback: (response: WalletResponse<T>) => void, domain: string) => void {
    const ledgerContext = useLedgerTransport();
    const navigation = useTypedNavigation();
    const { isTestnet } = useNetwork();
    const [bounceableFormat] = useBounceableWalletFormat();

    return async (id: string, params: SignRawParams, callback: (response: WalletResponse<T>) => void, domain: string) => {

        if (!ledgerContext?.tonTransport) {
            ledgerContext?.onShowLedgerConnectionError();
            callback({
                error: {
                    code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_APP_ERROR,
                    message: 'Ledger not connected',
                },
                id
            });
            return;
        }

        if (params.messages.length === 0 || params.messages.length > 1) {
            callback({
                error: {
                    code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_APP_ERROR,
                    message: 'Invalid messages count',
                },
                id
            });
            return;
        }

        const msg = params.messages[0];
        const payload = msg.payload ? Cell.fromBoc(Buffer.from(msg.payload, 'base64'))[0] : null
        const stateInit = msg.stateInit ? Cell.fromBoc(Buffer.from(msg.stateInit, 'base64'))[0] : null

        let target: {
            isBounceable: boolean;
            isTestOnly: boolean;
            address: Address;
        };

        try {
            target = parseAnyStringAddress(msg.address, isTestnet);
        } catch {
            callback({
                error: {
                    code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_APP_ERROR,
                    message: 'Invalid address',
                },
                id
            });
            return;
        }

        const order = createUnsafeLedgerOrder(msg);

        const resCallback: ((ok: boolean, result: Cell | null) => void) = (ok, result) => {
            if (ok) {
                callback({ result: { result: result?.toBoc()?.toString('base64') }, id });
            } else {
                callback({
                    error: {
                        code: SEND_TRANSACTION_ERROR_CODES.USER_REJECTS_ERROR,
                        message: 'User rejected',
                    },
                    id
                });
            }
        }

        navigation.navigateLedgerSignTransfer({ text: null, order, callback: resCallback });
    }
}