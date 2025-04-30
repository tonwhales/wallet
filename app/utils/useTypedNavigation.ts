import { NavigationProp, ParamListBase, StackActions, useNavigation } from '@react-navigation/native';
import { Cell } from '@ton/core';
import { StakingTransferParams } from '../fragments/staking/StakingTransferFragment';
import { LedgerSignTransferParams } from '../fragments/ledger/LedgerSignTransferFragment';
import { TonConnectAuthProps } from '../fragments/secure/dapps/TonConnectAuthenticateFragment';
import { TransferFragmentParams } from '../fragments/secure/transfer/TransferFragment';
import { SimpleTransferParams } from '../fragments/secure/simpleTransfer';
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
import { JettonWalletFragmentProps as JettonWalletFragmentParams } from '../fragments/wallet/JettonWalletFragment';
import { ReceiveSolanaParams, ReceiveTonParams } from '../fragments/wallet/ReceiveFragment';
import { JettonTransactionPreviewParams } from '../fragments/wallet/JettonTransactionPreviewFragment';
import { AssetsFragmentParams } from '../fragments/wallet/AssetsFragment';
import { AddressBookParams } from '../fragments/contacts/AddressBookFragment';
import { ExchangesFragmentParams } from '../fragments/wallet/ExchangesFragment';
import { ReceiveAssetsFragment } from '../fragments/wallet/ReceiveAssetsFragment';
import { TonWalletFragmentParams } from '../fragments/wallet/TonWalletFragment';
import { LedgerDeviceSelectionParams } from '../fragments/ledger/LedgerDeviceSelectionFragment';
import { LedgerSelectAccountParams } from '../fragments/ledger/LedgerSelectAccountFragment';
import { TonTransaction } from '../engine/types';
import { TransactionsFilterFragmentParams } from '../fragments/wallet/TransactionsFilterFragment';
import { SolanaWalletFragmentProps } from '../fragments/wallet/SolanaWalletFragment';
import { SolanaSimpleTransferParams } from '../fragments/solana/simpleTransfer/SolanaSimpleTransferFragment';
import { SolanaTransferParams } from '../fragments/secure/transfer/SolanaTransferFragment';
import { SolanaTokenWalletFragmentProps } from '../fragments/wallet/SolanaTokenWalletFragment';
import { SolanaTransactionPreviewParams } from '../fragments/solana/transaction/SolanaTransactionPreviewFragment';
import { PendingSolanaTransaction } from '../engine/state/pending';
import { PendingSolanaTransactionPreviewParams } from '../fragments/solana/transaction/PendingSolanaTransactionPreviewFragment';

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

    navigateTransfer(tx: TransferFragmentParams) {
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

    navigateSimpleTransfer(tx: SimpleTransferParams, options?: { ledger?: boolean, replace?: boolean }) {
        const action = options?.replace ? this.replace : this.navigate;

        if (options?.ledger) {
            action('LedgerSimpleTransfer', tx);
            return;
        }

        action('SimpleTransfer', tx);
    }

    navigateSign(tx: {
        textCell: Cell,
        payloadCell: Cell,
        text: string,
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

    navigateLedgerSignTransfer(params: LedgerSignTransferParams) {
        this.navigate('LedgerSignTransfer', params);
    }

    navigateStakingCalculator(params: { target: string }, isLedger?: boolean) {
        this.navigate(isLedger ? 'LedgerStakingCalculator' : 'StakingCalculator', params);
    }

    navigateLiquidUSDeStakingCalculator(params: { target: string }, isLedger?: boolean) {
        this.navigate(isLedger ? 'LedgerLiquidUSDeStakingCalculator' : 'LiquidUSDeStakingCalculator', params);
    }

    navigateLedgerApp() {
        this.navigateAndReplaceAll('LedgerApp');
    }

    navigateHoldersLanding({ endpoint, onEnrollType, inviteId, isLedger }: { endpoint: string, onEnrollType: HoldersAppParams, inviteId?: string, isLedger?: boolean }, isTestnet: boolean) {
        const navigate = () => this.navigate(isLedger ? 'LedgerHoldersLanding' : 'HoldersLanding', { endpoint, onEnrollType, inviteId });
        if (shouldTurnAuthOn(isTestnet)) {
            const callback = (success: boolean) => {
                if (success) { // navigate only if auth is set up
                    navigate();
                }
            }
            this.navigateMandatoryAuthSetup({ callback });
        } else {
            navigate();
        }
    }

    navigateHolders(params: HoldersAppParams, isTestnet: boolean, isLedger?: boolean, replace?: boolean) {
        const action = replace ? this.replace : this.navigate;
        const navigate = () => action(isLedger ? 'LedgerHolders' : 'Holders', params);
        if (shouldTurnAuthOn(isTestnet)) {
            const callback = (success: boolean) => {
                if (success) { // navigate only if auth is set up
                    navigate();
                }
            }
            this.navigateMandatoryAuthSetup({ callback });
        } else {
            navigate();
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

    navigateDAppWebViewModal(params: DAppWebViewFragmentParams) {
        this.navigate('DAppWebViewModal', params);
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
        if (param.isLedger) {
            this.navigate('LedgerJettonWallet', param);
            return;
        }
        this.navigate('JettonWallet', param);
    }

    navigateTonWallet(params: TonWalletFragmentParams, isLedger?: boolean) {
        if (isLedger) {
            this.navigate('LedgerTonWallet', params);
            return;
        }
        this.navigate('TonWallet', params);
    }

    navigateTonTransaction(transaction: TonTransaction, isLedger?: boolean) {
        this.navigate(isLedger ? 'LedgerTransaction' : 'Transaction', { transaction });
    }

    navigateJettonTransaction(param: JettonTransactionPreviewParams) {
        this.navigate('JettonTransaction', param);
    }

    navigateReceive(params?: Omit<ReceiveTonParams, 'type'>, isLedger?: boolean) {
        if (isLedger) {
            this.navigate('LedgerReceive', { ...params, type: 'ton' });
            return;
        }
        this.navigate('Receive', { ...params, type: 'ton' });
    }

    navigateReceiveAssets(params: ReceiveAssetsFragment, isLedger?: boolean) {
        if (isLedger) {
            this.navigate('LedgerReceiveAssets', params);
            return;
        }
        this.navigate('ReceiveAssets', params);
    }

    navigateAssets(params: AssetsFragmentParams) {
        this.navigate('Assets', params);
    }

    navigateContactAssets(params: AssetsFragmentParams) {
        this.navigate('ContactAssets', params);
    }

    navigateReceiveAssetsJettons(params: AssetsFragmentParams) {
        this.navigate('ReceiveAssetsJettons', params);
    }

    navigateAddressBook(params: AddressBookParams) {
        this.navigate('AddressBook', params);
    }

    navigateExchanges(params: ExchangesFragmentParams) {
        this.navigate('Exchanges', params);
    }

    navigateLedgerDeviceSelection(params: LedgerDeviceSelectionParams, options: { replace?: boolean } = {}) {
        const action = options.replace ? this.replace : this.navigate;
        action('LedgerDeviceSelection', params);
    }

    navigateLedgerSelectAccount(params: LedgerSelectAccountParams) {
        this.navigate('LedgerSelectAccount', params);
    }

    navigateTransactionsFilter(params: TransactionsFilterFragmentParams) {
        this.navigate('TransactionsFilter', params);
    }

    //
    // Solana
    //

    navigateSolanaWallet(params: SolanaWalletFragmentProps) {
        this.navigate('SolanaWallet', params);
    }

    navigateSolanaSimpleTransfer(params: SolanaSimpleTransferParams) {
        this.navigate('SolanaSimpleTransfer', params);
    }

    navigateSolanaTransfer(params: SolanaTransferParams) {
        this.navigate('SolanaTransfer', params);
    }

    navigateSolanaTokenWallet(params: SolanaTokenWalletFragmentProps) {
        this.navigate('SolanaTokenWallet', params);
    }

    navigateSolanaReceive(params: Omit<ReceiveSolanaParams, 'type'>) {
        this.navigate('SolanaReceive', params);
    }

    navigateSolanaTransaction(params: SolanaTransactionPreviewParams) {
        this.navigate('SolanaTransaction', params);
    }

    navigatePendingSolanaTransaction(params: PendingSolanaTransactionPreviewParams) {
        this.navigate('PendingSolanaTransaction', params);
    }
}

export function useTypedNavigation() {
    const baseNavigation = useNavigation();
    const typedNavigation = useMemo(() => new TypedNavigation(baseNavigation), [baseNavigation]);
    return typedNavigation;
}