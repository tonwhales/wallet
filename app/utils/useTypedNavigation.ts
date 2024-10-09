import { NavigationProp, ParamListBase, StackActions, useNavigation } from '@react-navigation/native';
import { Cell } from '@ton/core';
import { StakingTransferParams } from '../fragments/staking/StakingTransferFragment';
import { LedgerSignTransferParams } from '../fragments/ledger/LedgerSignTransferFragment';
import { TonConnectAuthProps } from '../fragments/secure/dapps/TonConnectAuthenticateFragment';
import { TransferFragmentProps } from '../fragments/secure/TransferFragment';
import { SimpleTransferParams } from '../fragments/secure/SimpleTransferFragment';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { HoldersAppParams } from '../fragments/holders/HoldersAppFragment';
import { useMemo } from 'react';
import { DAppWebViewFragmentParams } from '../fragments/utils/DAppWebViewFragment';
import { LiquidStakingTransferParams } from '../fragments/staking/LiquidStakingTransferFragment';
import { ProductsListFragmentParams } from '../fragments/wallet/ProductsListFragment';
import { StakingFragmentParams } from '../fragments/staking/StakingFragment';
import { PendingTxPreviewParams } from '../fragments/wallet/PendingTxPreviewFragment';
import { HomeFragmentProps } from '../fragments/HomeFragment';
import { MandatoryAuthSetupParams } from '../fragments/secure/MandatoryAuthSetupFragment';
import { getLockAppWithAuthState } from '../engine/state/lockAppWithAuthState';
import { getHasHoldersProducts } from '../engine/hooks/holders/useHasHoldersProducts';
import { getCurrentAddress } from '../storage/appState';
import { Platform } from 'react-native';
import { JettonWalletFragmentProps as JettonWalletFragmentParams } from '../fragments/wallet/JettonWalletFragment';
import { ReceiveFragmentParams } from '../fragments/wallet/ReceiveFragment';

type Base = NavigationProp<ParamListBase>;

export const nullTransfer = {
    amount: null,
    target: null,
    stateInit: null,
    job: null,
    comment: null,
    jetton: null,
    callback: null
}

export function typedNavigate(src: Base, name: string, params?: any) {
    src.navigate({ name, params: { ...params } });
}

export function typedReplace(src: Base, name: string, params?: any) {
    src.dispatch(StackActions.replace(name, params));
}

export function typedNavigateAndReplaceAll(src: Base, name: string, params?: any) {
    src.reset({ index: 0, routes: [{ name, params }] });
}

function shouldTurnAuthOn(isTestnet: boolean) {
    const isAppAuthOn = getLockAppWithAuthState();
    const currentAccount = getCurrentAddress();
    const hasAccounts = getHasHoldersProducts(currentAccount.address.toString({ testOnly: isTestnet }));

    return !isAppAuthOn && hasAccounts;
}

export class TypedNavigation {
    readonly base: any;
    constructor(navigation: any) {
        this.base = navigation;
    }

    baseNavigation = () => {
        return this.base;
    }

    navigate = (name: string, params?: any) => {
        typedNavigate(this.base, name, params);
    }

    navigateAndReplaceAll = (name: string, params?: any) => {
        typedNavigateAndReplaceAll(this.base, name, params)
    }

    replace = (name: string, params?: any) => {
        typedReplace(this.base, name, params);
    }

    goBack = () => {
        this.base.goBack();
    }

    setOptions = (options: Partial<{}>) => {
        this.base.setOptions(options);
    }

    dismiss = () => {
        this.base.getParent()?.goBack();
    }

    popToTop = () => {
        this.base.popToTop();
    }

    navigateTransfer(tx: TransferFragmentProps) {
        this.navigate('Transfer', tx);
    }

    navigateStakingPool(params: StakingFragmentParams, options?: { ledger?: boolean, replace?: boolean }) {
        const action = options?.replace ? this.replace : this.navigate;
        if (options?.ledger) {
            action('LedgerStaking', params);
            return;
        }
        action('Staking', params);
    }

    navigateStakingTransfer(params: StakingTransferParams, options?: { ledger?: boolean, replace?: boolean }) {
        const action = options?.replace ? this.replace : this.navigate;
        if (options?.ledger) {
            action('LedgerStakingTransfer', params);
            return;
        }
        action('StakingTransfer', params);
    }

    navigateLiquidStakingTransfer(params: LiquidStakingTransferParams, options?: { ledger?: boolean, replace?: boolean }) {
        const action = options?.replace ? this.replace : this.navigate;
        if (options?.ledger) {
            action('LedgerLiquidStakingTransfer', params);
            return;
        }
        action('LiquidStakingTransfer', params);
    }

    navigateLiquidWithdrawAction(isLedger?: boolean) {
        if (isLedger) {
            this.navigate('LedgerLiquidStakingTransfer', { action: 'withdraw' });
            return;
        }
        this.navigate('LiquidWithdrawAction');
    }

    navigateSimpleTransfer(tx: SimpleTransferParams) {
        this.navigate('SimpleTransfer', tx);
    }

    navigateSign(tx: {
        textCell: Cell,
        payloadCell: Cell,
        text: string,
        job: string | null,
        name: string,
        callback: ((ok: boolean, result: Cell | null) => void) | null,
    }) {
        this.navigate('Sign', tx);
    }

    navigateReview(params: {
        type: 'review' | 'report',
        url: string
    }) {
        this.navigate('Review', params);
    }

    navigateLedgerTransfer(tx: SimpleTransferParams) {
        this.navigate('LedgerSimpleTransfer', tx);
    }

    navigateLedgerSignTransfer(params: LedgerSignTransferParams) {
        this.navigate('LedgerSignTransfer', params);
    }

    navigateStakingCalculator(params: { target: string }) {
        this.navigate('StakingCalculator', params);
    }

    navigateLedgerApp() {
        this.navigateAndReplaceAll('LedgerApp');
    }

    navigateHoldersLanding({ endpoint, onEnrollType, inviteId }: { endpoint: string, onEnrollType: HoldersAppParams, inviteId?: string }, isTestnet: boolean) {
        if (shouldTurnAuthOn(isTestnet)) {
            const callback = (success: boolean) => {
                if (success) { // navigate only if auth is set up
                    this.navigate('HoldersLanding', { endpoint, onEnrollType, inviteId })
                }
            }
            this.navigateMandatoryAuthSetup({ callback });
        } else {
            this.navigate('HoldersLanding', { endpoint, onEnrollType, inviteId });
        }
    }

    navigateHolders(params: HoldersAppParams, isTestnet: boolean) {
        if (shouldTurnAuthOn(isTestnet)) {
            const callback = (success: boolean) => {
                if (success) { // navigate only if auth is set up
                    this.navigate('Holders', params);
                }
            }
            this.navigateMandatoryAuthSetup({ callback });
        } else {
            this.navigate('Holders', params);
        }
    }

    navigateConnectAuth(params: TonConnectAuthProps) {
        this.navigate('TonConnectAuthenticate', params);
    }

    navigateScanner(params: { callback: (src: string) => void }, modal?: boolean) {
        (async () => {
            await BarCodeScanner.requestPermissionsAsync();
            this.navigate('Scanner', params);
        })();
    }

    navigateScreenCapture(params?: { callback: (src: string) => void, modal?: boolean }) {
        this.navigate('ScreenCapture', params);
    }

    navigateAlert(params: { title: string, message?: string, callback?: () => void }, replace?: boolean) {
        if (replace) {
            this.replace('Alert', params);
            return;
        };
        this.navigate('Alert', params);
    }

    navigateDAppWebView(params: DAppWebViewFragmentParams) {
        if (params.fullScreen) {
            this.navigate('DAppWebViewFull', params);
            return;
        }
        if (params.lockNativeBack) {
            this.navigate('DAppWebViewLocked', params);
            return;
        }
        this.navigate('DAppWebView', params);
    }

    navigateAndReplaceHome(params?: HomeFragmentProps) {
        this.navigateAndReplaceAll('Home', params);
    }

    navigateProductsList(params: ProductsListFragmentParams) {
        this.navigate(params.isLedger ? 'LedgerProductsList' : 'ProductsList', params);
    }

    navigatePendingTx(params: PendingTxPreviewParams) {
        this.navigate('PendingTransaction', params);
    }

    navigateMandatoryAuthSetup(params?: MandatoryAuthSetupParams) {
        this.navigate('MandatoryAuthSetup', params);
    }

    navigateJettonWallet(param: JettonWalletFragmentParams) {
        this.navigate('JettonWalletFragment', param);
    }

    navigateReceive(params?: ReceiveFragmentParams) {
        this.navigate('Receive', params);
    }
}

export function useTypedNavigation() {
    const baseNavigation = useNavigation();
    const typedNavigation = useMemo(() => new TypedNavigation(baseNavigation), [baseNavigation]);
    return typedNavigation;
}