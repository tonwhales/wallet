import { getTimeSec } from '../../utils/getTimeSec';
import { Address, Cell } from '@ton/core';
import { Toaster } from '../../components/toast/ToastProvider';
import { SignRawTxParams } from './types';
import { CHAIN, RpcMethod, SEND_TRANSACTION_ERROR_CODES, WalletResponse } from '@tonconnect/protocol';
import { t } from '../../i18n/t';

export function checkTonconnectTxRequest(id: string, params: SignRawTxParams, callback: (response: WalletResponse<RpcMethod>) => void, isTestnet: boolean, toaster: Toaster) {
    let errorMessage = 'Bad request';
    const validParams = !!params
        && Array.isArray(params.messages)
        && params.messages.every((msg) => {

            // check for valid amount
            if (!msg.amount || typeof msg.amount !== 'string') {
                errorMessage = 'Invalid amount';
                return false;
            }

            // check for valid address
            if (!!msg.address) {
                try {
                    Address.parseFriendly(msg.address);
                } catch {
                    errorMessage = 'Invalid address';
                    return false;
                }
            }

            // check for valid payload
            if (!!msg.payload) {
                try {
                    Cell.fromBoc(Buffer.from(msg.payload, 'base64'))[0];
                } catch {
                    errorMessage = 'Invalid payload';
                    return false;
                }
            }

            // check for valid state init
            if (!!msg.stateInit) {
                try {
                    Cell.fromBoc(Buffer.from(msg.stateInit, 'base64'))[0];
                } catch {
                    errorMessage = 'Invalid state init';
                    return false;
                }
            }

            // check for valid valid until
            if (!!params.valid_until && (typeof params.valid_until !== 'number' || isNaN(params.valid_until))) {
                errorMessage = 'Invalid valid until';
                return false;
            }

            // check for valid selected network
            let validNetwork = true;
            if (!!params.network) {
                if (isTestnet) {
                    validNetwork = params.network === CHAIN.TESTNET;
                } else {
                    validNetwork = params.network === CHAIN.MAINNET;
                }
            }

            if (!validNetwork) {
                errorMessage = 'Invalid selected network';
                return false;
            }

            return true;
        });

    if (!validParams) {
        toaster.show({
            message: t('common.errorOccurred', { error: errorMessage }),
            type: 'error',
        });
        callback({
            error: {
                code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
                message: errorMessage,
            },
            id,
        });

        return false;
    }

    const { valid_until, messages } = params;

    if (!!valid_until && valid_until < getTimeSec()) {
        callback({
            error: {
                code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
                message: `Request timed out`,
            },
            id,
        });
        return false;
    }

    if (messages.length === 0) {
        callback({
            error: {
                code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
                message: `No messages`,
            },
            id,
        });
        return false;
    }

    return true;
}