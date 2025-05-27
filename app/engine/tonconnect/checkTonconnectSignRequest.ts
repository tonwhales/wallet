import { Cell } from '@ton/core';
import { Toaster } from '../../components/toast/ToastProvider';
import { RpcMethod, SEND_TRANSACTION_ERROR_CODES, WalletResponse } from '@tonconnect/protocol';
import { t } from '../../i18n/t';
import { SignDataPayload } from './types';

export function checkTonconnectSignRequest(id: string, params: SignDataPayload, callback: (response: WalletResponse<RpcMethod>) => void, toaster: Toaster) {
    let errorMessage = 'Bad request';

    function handleError(message: string) {
        toaster.show({
            message: t('common.errorOccurred', { error: message }),
            type: 'error',
        });
        callback({
            error: {
                code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
                message,
            },
            id,
        });
        return false;
    }

    // Basic params validation
    if (!params || typeof params !== 'object') {
        errorMessage = 'Invalid params';
        return handleError(errorMessage);
    }

    // Type validation
    if (!params.type || !['text', 'binary', 'cell'].includes(params.type)) {
        errorMessage = 'Invalid sign data type';
        return handleError(errorMessage);
    }

    // Content validation based on type
    switch (params.type) {
        case 'text':
            if (!params.text || typeof params.text !== 'string') {
                errorMessage = 'Invalid text content';
                return handleError(errorMessage);
            }
            break;

        case 'binary':
            if (!params.bytes || typeof params.bytes !== 'string') {
                errorMessage = 'Invalid binary content';
                return handleError(errorMessage);
            }
            try {
                // Validate base64
                Buffer.from(params.bytes, 'base64');
            } catch {
                errorMessage = 'Invalid base64 binary content';
                return handleError(errorMessage);
            }
            break;

        case 'cell':
            if (!params.schema || typeof params.schema !== 'string') {
                errorMessage = 'Invalid cell schema';
                return handleError(errorMessage);
            }
            if (!params.cell || typeof params.cell !== 'string') {
                errorMessage = 'Invalid cell data';
                return handleError(errorMessage);
            }
            try {
                // Validate cell data
                Cell.fromBoc(Buffer.from(params.cell, 'base64'))[0];
            } catch {
                errorMessage = 'Invalid cell format';
                return handleError(errorMessage);
            }
            break;
    }

    return true;
}