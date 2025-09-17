import { RefObject } from "react";
import WebView, { WebViewMessageEvent } from "react-native-webview";
import { TypedNavigation } from "../../../utils/useTypedNavigation";
import { MainButtonAction, processMainButtonMessage } from "../../DappMainButton";
import { processToasterMessage, Toaster } from "../../toast/ToastProvider";
import { LocalStorageStatus } from "../../../engine/state/webViewLocalStorage";
import { dispatchAuthResponse, dispatchLastAuthTimeResponse, dispatchLockAppWithAuthResponse, dispatchMainButtonResponse, dispatchWalletResponse } from "../../../fragments/apps/components/inject/createInjectSource";
import { AuthWalletKeysType, getLastAuthTimestamp } from "../../secure/AuthWalletKeys";
import { warn } from "../../../utils/log";
import { addCardRequestSchema, WalletService } from "../../../modules/WalletService";
import { getHoldersToken } from "../../../storage/holders";
import { processStatusBarMessage } from "./processStatusBarMessage";
import { setStatusBarBackgroundColor, setStatusBarStyle } from "expo-status-bar";
import { processEmitterMessage } from "./processEmitterMessage";
import { NavigationOptionsAction, SetNavigationOptionsAction } from "./reduceNavigationOptions";
import { Address } from "@ton/core";
import { getCurrentAddress } from "../../../storage/appState";
import { Space } from "@intercom/intercom-react-native";
import { z } from "zod";
import { isAuthTimedOut } from "../../SessionWatcher";

export type DAppWebViewAPI = {
    useMainButton?: boolean;
    useStatusBar?: boolean;
    useToaster?: boolean;
    useAuthApi?: boolean;
    useEmitter?: boolean;
    useQueryAPI?: boolean;
    useWalletAPI?: boolean;
    useDappClient?: boolean;
    useSupportAPI?: boolean;
}

export enum DAppWebViewAPIMethod {
    getLocalStorageStatus = 'localStorageStatus',
    getLastAuthTime = 'auth.getLastAuthTime',
    authenticate = 'auth.authenticate',
    lockAppWithAuth = 'auth.lockAppWithAuth',
    walletIsEnabled = 'wallet.isEnabled',
    walletCheckIfCardIsAlreadyAdded = 'wallet.checkIfCardIsAlreadyAdded',
    walletCheckIfCardsAreAdded = 'wallet.checkIfCardsAreAdded',
    walletCanAddCard = 'wallet.canAddCard',
    walletAddCardToWallet = 'wallet.addCardToWallet',
    eventEmitter = 'dapp-emitter',
    openUrl = 'openUrl',
    closeApp = 'closeApp',
    openEnrollment = 'openEnrollment',
    mainButton = 'main-button.',
    statusBar = 'status-bar.',
    toaster = 'toaster.',
    lockScroll = 'lockScroll',
    subscribed = 'subscribed',
    showKeyboardAccessoryView = 'showKeyboardAccessoryView',
    backPolicy = 'backPolicy',
    showIntercom = 'showIntercom',
    showIntercomWithMessage = 'showIntercomWithMessage',
    navigate = 'navigate',
}

const userAttributesSchema = z.object({
    companies: z.array(z.object({
        id: z.string(),
        name: z.string(),
        plan: z.string(),
    })).optional(),
    customAttributes: z.record(z.any()).optional(),
    email: z.string().optional(),
    languageOverride: z.string().optional(),
    name: z.string().optional(),
    phone: z.string().optional(),
    signedUpAt: z.number().optional(),
    unsubscribedFromEmails: z.boolean().optional(),
    userId: z.string().optional(),
});

export type DAppWebViewAPIProps = {
    api: DAppWebViewAPI;
    ref: RefObject<WebView>;
    navigation: TypedNavigation;
    dispatchMainButton: (action: MainButtonAction) => void;
    setLoaded: (loaded: boolean) => void;
    toaster: Toaster;
    onEnroll?: (payload?: string) => void;
    dispatchNavigationOptions: (action: NavigationOptionsAction) => void;
    updateLocalStorageStatus: (status: Partial<Omit<LocalStorageStatus, "lastChecked">>) => void,
    authContext: AuthWalletKeysType
    isTestnet: boolean;
    address?: Address;
    safelyOpenUrl: (url: string) => void;
    onClose?: () => void;
    setSubscribed: () => void;
    onSupport: (options?: { space?: Space }) => void;
    onSupportWithMessage: (options?: { message?: string }) => void;
}

export function processWebViewMessage(
    event: WebViewMessageEvent,
    {
        api, ref, navigation, authContext, isTestnet, address, toaster,
        dispatchMainButton, setLoaded, onEnroll, dispatchNavigationOptions, updateLocalStorageStatus, 
        safelyOpenUrl, onClose, setSubscribed, onSupport, onSupportWithMessage
    }: DAppWebViewAPIProps
): boolean {
    const nativeEvent = event.nativeEvent;

    try {
        const parsed = JSON.parse(nativeEvent.data);
        const method = parsed.data.name;
        const args = parsed.data.args;

        switch (method) {
            case DAppWebViewAPIMethod.getLocalStorageStatus:
                try {
                    updateLocalStorageStatus({
                        isAvailable: parsed.data.isAvailable,
                        isObjectAvailable: parsed.data.isObjectAvailable,
                        keys: parsed.data.keys,
                        totalSizeBytes: parsed.data.totalSizeBytes,
                        error: parsed.data.error
                    });
                } catch {
                    warn('Failed to update local storage status');
                }
                return true;
            case DAppWebViewAPIMethod.getLastAuthTime:
                if (api.useAuthApi) {
                    dispatchLastAuthTimeResponse(ref, getLastAuthTimestamp() || 0);
                }
                return true;
            case DAppWebViewAPIMethod.authenticate:
                if (api.useAuthApi) {
                    (async () => {
                        let isAuthenticated = false;
                        let lastAuthTime: number | undefined;
                        // wait for auth to complete
                        try {
                            if (isAuthTimedOut()) {
                                await authContext.authenticate({ cancelable: true, paddingTop: 32 });
                                isAuthenticated = true;
                                lastAuthTime = getLastAuthTimestamp();
                            } else {
                                isAuthenticated = true;
                                lastAuthTime = getLastAuthTimestamp();
                            }
                        } catch {
                            warn('Failed to authenticate');
                        }
                        // Dispatch response
                        dispatchAuthResponse(ref, { isAuthenticated, lastAuthTime });
                    })();
                }
                return true;
            case DAppWebViewAPIMethod.lockAppWithAuth:
                if (api.useAuthApi) {
                    const callback = (isSecured: boolean) => {
                        const lastAuthTime = getLastAuthTimestamp();
                        dispatchLockAppWithAuthResponse(ref, { isSecured, lastAuthTime });
                    }
                    navigation.navigateMandatoryAuthSetup({ callback });
                }
                return true;
            case DAppWebViewAPIMethod.walletIsEnabled:
                if (api.useWalletAPI) {
                    (async () => {
                        try {
                            const result = await WalletService.isEnabled();
                            dispatchWalletResponse(ref, { result });
                        } catch {
                            warn('Failed to check if wallet is enabled');
                            dispatchWalletResponse(ref, { result: false });
                        }
                    })();
                }
                return true;
            case DAppWebViewAPIMethod.walletCheckIfCardIsAlreadyAdded:
                if (api.useWalletAPI) {
                    try {
                        const primaryAccountNumberSuffix = args?.primaryAccountNumberSuffix;
                        if (!primaryAccountNumberSuffix) {
                            warn('Invalid primaryAccountNumberSuffix');
                            dispatchWalletResponse(ref, { result: false });
                            return true;
                        }
                        (async () => {
                            try {
                                const result = await WalletService.checkIfCardIsAlreadyAdded(primaryAccountNumberSuffix);
                                dispatchWalletResponse(ref, { result });
                            } catch {
                                warn('Failed to check if card is already added');
                                dispatchWalletResponse(ref, { result: false });
                            }
                        })();
                    } catch {
                        warn('Failed to check if card is already added');
                        dispatchWalletResponse(ref, { result: false });
                    }
                }
                return true;
            case DAppWebViewAPIMethod.walletCheckIfCardsAreAdded:
                if (api.useWalletAPI) {
                    try {
                        const cardIds = args?.cardIds;
                        if (!cardIds) {
                            warn('Invalid cardIds');
                            dispatchWalletResponse(ref, { result: false });
                            return true;
                        }

                        (async () => {
                            try {
                                const result = await WalletService.checkIfCardsAreAdded(cardIds);
                                dispatchWalletResponse(ref, { result });
                            } catch {
                                warn('Failed to check if cards are added');
                                dispatchWalletResponse(ref, { result: false });
                            }
                        })();
                    } catch {
                        warn('Failed to check if cards are added');
                        dispatchWalletResponse(ref, { result: false });
                    }
                }
                return true;
            case DAppWebViewAPIMethod.walletCanAddCard:
                if (api.useWalletAPI) {
                    try {
                        const cardId = args?.cardId;
                        if (!cardId) {
                            warn('Invalid cardId');
                            dispatchWalletResponse(ref, { result: false });
                            return true;
                        }

                        (async () => {
                            try {
                                const result = await WalletService.canAddCard(cardId);
                                dispatchWalletResponse(ref, { result });
                            } catch (error) {
                                warn('Failed to check if card can be added');
                                // return true so that the user can try to add the card and get the error message on the native side
                                dispatchWalletResponse(ref, { result: true });
                            }
                        })();
                    } catch {
                        warn('Failed to check if card can be added');
                        dispatchWalletResponse(ref, { result: false });
                    }
                }
                return true;
            case DAppWebViewAPIMethod.walletAddCardToWallet:
                if (api.useWalletAPI) {
                    try {
                        const request = addCardRequestSchema.safeParse(args);

                        if (!request.success) {
                            warn('Invalid addCardToWallet request');
                            dispatchWalletResponse(ref, { result: false });
                            return true;
                        }

                        const _address = address
                            ? address.toString({ testOnly: isTestnet })
                            : getCurrentAddress().address.toString({ testOnly: isTestnet });
                        const token = getHoldersToken(_address);

                        if (!token) {
                            warn('User token not found');
                            dispatchWalletResponse(ref, { result: false });
                            return true;
                        }

                        (async () => {
                            try {
                                const result = await WalletService.addCardToWallet({ ...request.data, token, isTestnet });
                                dispatchWalletResponse(ref, { result });
                            } catch {
                                warn('Failed to add card to wallet');
                                dispatchWalletResponse(ref, { result: false });
                            }
                        })();
                    } catch {
                        warn('Failed to add card to wallet');
                        dispatchWalletResponse(ref, { result: false });
                    }
                }
                return true;
            case DAppWebViewAPIMethod.openUrl:
                try {
                    safelyOpenUrl(args.url);
                } catch {
                    warn('Failed to open url');
                }
                return true;
            case DAppWebViewAPIMethod.closeApp:
                onClose?.();
                navigation.goBack();
                return true;
            case DAppWebViewAPIMethod.openEnrollment:
                onEnroll?.(args.payload);
                return true;
            case DAppWebViewAPIMethod.showKeyboardAccessoryView:
                dispatchNavigationOptions({ type: SetNavigationOptionsAction.setShowKeyboardAccessoryView, showKAV: args.show });
                return true;
            case DAppWebViewAPIMethod.lockScroll:
                dispatchNavigationOptions({ type: SetNavigationOptionsAction.setLockScroll, lockScroll: args.lock });
                return true;
            case DAppWebViewAPIMethod.backPolicy:
                dispatchNavigationOptions({ type: SetNavigationOptionsAction.setBackPolicy, backPolicy: args.backPolicy });
                return true;
            case DAppWebViewAPIMethod.subscribed:
                setSubscribed();
                return true;
            case DAppWebViewAPIMethod.showIntercom:
                (async () => {
                    try {
                        if (api.useSupportAPI) {
                            onSupport({ space: Space.messages });
                        }
                    } catch {
                        warn('Failed to show intercom');
                    }
                })();
                return true;
            case DAppWebViewAPIMethod.showIntercomWithMessage:
                (async () => {
                    try {
                        if (api.useSupportAPI) {
                            if (!args.text) {
                                warn('Invalid text');
                                return true;
                            } else {
                                onSupportWithMessage({ message: args.text });
                            }
                        }
                    } catch {
                        warn('Failed to show intercom with message');
                    }
                })();
                return true;
            case DAppWebViewAPIMethod.navigate:
                navigation.navigate(args?.routeName, args?.params);
                return true;
            default:
                if (api.useMainButton && method.startsWith(DAppWebViewAPIMethod.mainButton)) {
                    return processMainButtonMessage(
                        parsed,
                        dispatchMainButton,
                        dispatchMainButtonResponse,
                        ref
                    );
                }

                if (api.useStatusBar && method.startsWith(DAppWebViewAPIMethod.statusBar)) {
                    return processStatusBarMessage(
                        parsed,
                        setStatusBarStyle,
                        setStatusBarBackgroundColor
                    );
                }

                if (api.useToaster && method.startsWith(DAppWebViewAPIMethod.toaster)) {
                    return processToasterMessage(parsed, toaster);
                }

                if (api.useEmitter && method.startsWith(DAppWebViewAPIMethod.eventEmitter)) {
                    return processEmitterMessage(parsed, setLoaded);
                }

                return false;
        }
    } catch {
        warn('Failed to process webview message');
        return false;
    }
}