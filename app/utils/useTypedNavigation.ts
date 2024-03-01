import * as React from 'react';
import { NavigationProp, ParamListBase, StackActions, useNavigation } from '@react-navigation/native';
import { Address, Cell } from '@ton/core';
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

    navigateStakingTransfer(params: StakingTransferParams, ledger?: boolean) {
        if (ledger) {
            this.navigate('LedgerStakingTransfer', params);
            return;
        }
        this.navigate('StakingTransfer', params);
    }

    navigateLiquidStakingTransfer(params: LiquidStakingTransferParams, ledger?: boolean) {
        if (ledger) {
            this.navigate('LedgerLiquidStakingTransfer', params);
            return;
        }
        this.navigate('LiquidStakingTransfer', params);
    }

    navigateLiquidWithdrawAction(isLedger?: boolean) {
        if (isLedger) {
            this.navigate('LedgerLiquidWithdrawAction');
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

    navigateStakingCalculator(params: { target: Address }) {
        this.navigate('StakingCalculator', params);
    }

    navigateLedgerApp() {
        this.navigateAndReplaceAll('LedgerApp');
    }

    navigateHolders(params: HoldersAppParams) {
        this.navigate('Holders', params);
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
        this.navigate('DAppWebView', params);
    }
}

export function useTypedNavigation() {
    const baseNavigation = useNavigation();
    const typedNavigation = useMemo(() => new TypedNavigation(baseNavigation), [baseNavigation]);
    return typedNavigation;
}