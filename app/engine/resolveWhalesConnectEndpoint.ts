import { storage } from '../storage/storage';
import { resolveEndpoint, WHALES_CONNECT_DEFAULT_ENDPOINT, whalesConnectOverrideKey } from './endpoints';
import { IS_SANDBOX } from './state/network';

export function resolveWhalesConnectEndpoint(): string {
    return resolveEndpoint(
        WHALES_CONNECT_DEFAULT_ENDPOINT,
        storage.getString(whalesConnectOverrideKey),
        __DEV__ || IS_SANDBOX
    );
}
