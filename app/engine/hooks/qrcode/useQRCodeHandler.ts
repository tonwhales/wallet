import { useNetwork } from "../network";
import { useIsLedgerRoute } from "..";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { useLinkNavigator } from "../../../utils/link-navigator/useLinkNavigator";
import { useCallback } from "react";
import { Cell, toNano } from "@ton/ton";
import { resolveUrl } from "../../../utils/url/resolveUrl";
import { ToastDuration } from "../../../components/toast/ToastProvider";
import { TonConnectAuthType } from "../../../fragments/secure/dapps/TonConnectAuthenticateFragment";

/**
 * Hook for creating a QR code handler with support for various scenarios
 * @returns QR code handler function that accepts the code and processing parameters
 */
export function useQRCodeHandler(options?: { toastProps?: { duration?: ToastDuration, marginBottom?: number } }) {
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const isLedger = useIsLedgerRoute();

    const linkNavigator = useLinkNavigator(
        isTestnet,
        options?.toastProps,
        TonConnectAuthType.Qr,
        isLedger
    );

    return useCallback((
        src: string,
        mode: 'default' | 'simple-transfer' = 'default',
        params?: {
            // For simple-transfer mode
            simpleTransferData?: {
                commentString: string,
                amount: string,
                stateInit: Cell | null,
            },
        }
    ) => {
        try {
            const resolved = resolveUrl(src, isTestnet);
            if (!resolved) return;

            // Standard mode - simply pass the result to linkNavigator
            if (mode === 'default') {
                linkNavigator(resolved);
                return;
            }

            // SimpleTransfer mode - fill the form with data from the QR code
            if (mode === 'simple-transfer' && params?.simpleTransferData) {
                const data = params.simpleTransferData;

                if (resolved.type === 'transaction' || resolved.type === 'jetton-transaction') {
                    if (resolved.payload) {
                        navigation.goBack();
                        linkNavigator(resolved);
                    } else {
                        let mComment = data.commentString;
                        let mTarget = null;
                        let mAmount = null;
                        let mStateInit = data.stateInit;
                        let mJetton = null;
                        let mUnknownDecimals = false;

                        try {
                            mAmount = toNano(data.amount);
                        } catch {
                            mAmount = null;
                        }

                        if (resolved.address) {
                            const bounceable = resolved.isBounceable ?? true;
                            mTarget = resolved.address.toString({ testOnly: isTestnet, bounceable });
                        }

                        if (resolved.amount) {
                            mAmount = resolved.amount;
                        }

                        if (resolved.comment) {
                            mComment = resolved.comment;
                        }

                        if (resolved.type === 'transaction' && resolved.stateInit) {
                            mStateInit = resolved.stateInit;
                        } else {
                            mStateInit = null;
                        }

                        if (resolved.type === 'jetton-transaction' && resolved.jettonMaster) {
                            mJetton = resolved.jettonMaster;
                            mUnknownDecimals = true;
                        }

                        navigation.navigateSimpleTransfer({
                            target: mTarget,
                            comment: mComment,
                            amount: mAmount,
                            stateInit: mStateInit,
                            asset: mJetton ? { type: 'jetton', master: mJetton } : null,
                            unknownDecimals: mUnknownDecimals,
                        }, { ledger: isLedger, replace: true });
                    }
                }
            }
        } catch (error) {
            // Ignore errors
        }
    }, [isTestnet, linkNavigator, navigation, isLedger]);
}