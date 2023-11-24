import * as React from 'react';
import { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { KnownJettonMasters } from '../../../secure/KnownWallets';
import { TypedNavigation } from '../../../utils/useTypedNavigation';
import { AnimatedProductButton } from './AnimatedProductButton';
import { useNetwork } from '../../../engine/hooks';
import { Alert } from 'react-native';
import { t } from '../../../i18n/t';
import { Jetton } from '../../../engine/types';
import { useMarkJettonDisabled } from '../../../engine/hooks/jettons/useMarkJettonDisabled';
import { memo, useCallback } from 'react';

export async function confirmJettonAction(disable: boolean, symbol: string) {
    return await new Promise<boolean>(resolve => {
        Alert.alert(
            disable
                ? t('accounts.alertDisabled', { symbol })
                : t('accounts.alertActive', { symbol }),
            t('transfer.confirm'),
            [{
                text: t('common.yes'),
                style: 'destructive',
                onPress: () => {
                    resolve(true)
                }
            }, {
                text: t('common.no'),
                onPress: () => {
                    resolve(false);
                }
            }])
    });
}

export const JettonProduct = memo((props: {
    navigation: TypedNavigation,
    jetton: Jetton,
    onPress?: () => void
    onLongPress?: () => void,
}) => {
    let balance = props.jetton.balance;
    const { isTestnet } = useNetwork();

    const isKnown = !!KnownJettonMasters(isTestnet)[props.jetton.master.toString({ testOnly: isTestnet })];
    const markJettonDisabled = useMarkJettonDisabled();

    const promptDisable = useCallback(async () => {
        const c = await confirmJettonAction(true, props.jetton.symbol);
        if (c) markJettonDisabled(props.jetton.master);
    }, [markJettonDisabled]);

    return (
        <AnimatedProductButton
            entering={FadeInUp}
            exiting={FadeOutDown}
            key={props.jetton.master.toString()}
            name={props.jetton.name}
            subtitle={props.jetton.description}
            image={props.jetton.icon ? props.jetton.icon : undefined}
            value={balance}
            decimals={props.jetton.decimals}
            symbol={props.jetton.symbol}
            onPress={() => {
                if (props.onPress) {
                    props.onPress();
                    return;
                }
                props.navigation.navigateSimpleTransfer({
                    amount: null,
                    target: null,
                    comment: null,
                    jetton: props.jetton.wallet,
                    stateInit: null,
                    job: null,
                    callback: null
                })
            }}
            onLongPress={props.onLongPress ? props.onLongPress : promptDisable}
            style={{ marginVertical: 4 }}
            known={isKnown}
        />
    );
}, (prev, next) => {
    return prev.jetton.master.equals(next.jetton.master)
        && prev.jetton.balance === next.jetton.balance
        && prev.jetton.disabled === next.jetton.disabled
        && prev.jetton.icon === next.jetton.icon;
});