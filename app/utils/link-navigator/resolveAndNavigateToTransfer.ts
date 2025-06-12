import { ResolvedTonTxUrl } from "../url/types";
import { TypedNavigation } from "../useTypedNavigation";

export function resolveAndNavigateToTransfer(params: {
    resolved: ResolvedTonTxUrl,
    isTestnet: boolean,
    isLedger?: boolean,
    navigation: TypedNavigation,
    domain?: string
}) {
    const { resolved, isTestnet, isLedger, navigation, domain } = params;

    const bounceable = resolved.isBounceable ?? true;

    if (resolved.payload) {
        if (!isLedger) {
            navigation.navigateTransfer({
                order: {
                    type: 'order',
                    messages: [{
                        target: resolved.address.toString({ testOnly: isTestnet, bounceable }),
                        amount: resolved.amount || BigInt(0),
                        amountAll: false,
                        stateInit: resolved.stateInit,
                        payload: resolved.payload,
                    }],
                    validUntil: resolved.expiresAt,
                    domain
                },
                text: resolved.comment,
                callback: null
            });
        }
    } else {
        navigation.navigateSimpleTransfer({
            target: resolved.address.toString({ testOnly: isTestnet, bounceable }),
            comment: resolved.comment,
            amount: resolved.amount,
            stateInit: resolved.stateInit,
            asset: null,
            callback: null,
            validUntil: resolved.expiresAt,
            domain
        }, { ledger: isLedger });
    }
}