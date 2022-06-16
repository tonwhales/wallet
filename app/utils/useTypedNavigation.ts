import * as React from 'react';
import { NavigationProp, ParamListBase, StackActions, useNavigation } from '@react-navigation/native';
import { Address, Cell } from 'ton';
import BN from 'bn.js';
import { Order } from '../fragments/secure/ops/Order';

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
        this.base.dangerouslyGetParent()?.goBack();
    }

    popToTop = () => {
        this.base.popToTop();
    }

    navigateTransfer(tx: {
        order: Order,
        text: string | null,
        job: string | null,
        callback: ((ok: boolean, result: Cell | null) => void) | null
    }) {
        this.navigate('Transfer', tx);
    }

    navigateSimpleTransfer(tx: {
        target: string | null,
        comment: string | null,
        amount: BN | null,
        stateInit: Cell | null,
        job: string | null,
        jetton: Address | null,
        callback: ((ok: boolean, result: Cell | null) => void) | null
    }) {
        this.navigate('SimpleTransfer', tx);
    }
}

export function useTypedNavigation() {
    const baseNavigation = useNavigation();
    const typedNavigation = React.useMemo(() => new TypedNavigation(baseNavigation), [baseNavigation]);
    return typedNavigation;
}