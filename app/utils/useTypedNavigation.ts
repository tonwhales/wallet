import * as React from 'react';
import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { randomKey } from './randomKey';

type Base = NavigationProp<ParamListBase>;

export function typedNavigate(src: Base, name: string, params?: any) {
    src.navigate({ name, params: { ...params }, key: randomKey() });
}

export class TypedNavigation {
    readonly base: any;
    constructor(navigation: any) {
        this.base = navigation;
    }

    navigate = (name: string, params?: any) => {
        typedNavigate(this.base, name, params);
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
}

export function useTypedNavigation() {
    const baseNavigation = useNavigation();
    const typedNavigation = React.useMemo(() => new TypedNavigation(baseNavigation), [baseNavigation]);
    return typedNavigation;
}