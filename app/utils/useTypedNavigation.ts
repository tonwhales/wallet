import * as React from 'react';
import { NavigationProp, ParamListBase, StackActions, useNavigation } from '@react-navigation/native';
import { Address, Cell } from '@ton/core';
import { StakingTransferParams } from '../fragments/staking/StakingTransferFragment';
import { LedgerSignTransferParams } from '../fragments/ledger/LedgerSignTransferFragment';
import { TonConnectAuthProps } from '../fragments/secure/TonConnectAuthenticateFragment';
import { TransferFragmentProps } from '../fragments/secure/TransferFragment';
import { SimpleTransferParams } from '../fragments/secure/SimpleTransferFragment';

type Base = NavigationProp<ParamListBase>;

export function typedNavigate(src: Base, name: string, params?: any) {
    setTimeout(() => {
        src.navigate({ name, params: { ...params } });
    }, src.isFocused() ? 0 : 300);
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

    navigateStaking(params: StakingTransferParams) {
        this.navigate('StakingTransfer', params);
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
        this.navigate('LedgerTransfer', tx);
    }

    navigateLedgerSignTransfer(params: LedgerSignTransferParams) {
        this.navigate('LedgerSignTransfer', params);
    }

    navigateStakingCalculator(params: { target: Address }) {
        this.navigate('StakingCalculator', params);
    }

    navigateLedgerApp() {
        this.replace('LedgerApp');
    }
    
    navigateConnectAuth(params: TonConnectAuthProps) {
        this.navigate('TonConnectAuthenticate', params);
    }

    // TODO: implement ScreenCapture modal fragment
    navigateScreenCapture(params?: { callback: (src: string) => void, modal?: boolean }) {
        this.navigate('ScreenCapture', params);
    }
}

export function useTypedNavigation() {
    const baseNavigation = useNavigation();
    const typedNavigation = React.useMemo(() => new TypedNavigation(baseNavigation), [baseNavigation]);
    return typedNavigation;
}