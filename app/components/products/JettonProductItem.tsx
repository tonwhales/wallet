import BN from 'bn.js';
import * as React from 'react';
import { Address } from 'ton';
import { Engine } from '../../engine/Engine';
import { markJettonDisabled } from '../../engine/sync/ops';
import { confirmJettonAction } from '../../fragments/AccountsFragment';
import { KnownJettonMasters } from '../../secure/KnownWallets';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { View, Text, Pressable } from 'react-native';
import { useAppConfig } from '../../utils/AppConfigContext';
import { ValueComponent } from '../ValueComponent';
import { WImage } from '../WImage';
import { useAnimatedPressedInOut } from '../../utils/useAnimatedPressedInOut';
import Animated from 'react-native-reanimated';

import Verified from '../../../assets/ic-verified.svg';

export const JettonProductItem = React.memo((props: {
    engine: Engine,
    jetton: {
        master: Address;
        wallet: Address;
        name: string;
        description: string;
        symbol: string;
        balance: BN;
        icon: string | null;
        decimals: number | null;
    },
    last?: boolean,
    onPress?: () => void
    onLongPress?: () => void
}) => {
    const { Theme } = useAppConfig();
    const navigation = useTypedNavigation();
    const balance = props.jetton.balance;

    const isKnown = !!KnownJettonMasters(props.engine.isTestnet)[props.jetton.master.toFriendly({ testOnly: props.engine.isTestnet })];

    const promptDisable = React.useCallback(
        async () => {
            const c = await confirmJettonAction(true, props.jetton.symbol);
            if (c) markJettonDisabled(props.engine, props.jetton.master);
        },
        [],
    );

    const { onPressIn, onPressOut, animatedStyle } = useAnimatedPressedInOut();

    return (
        <Pressable
            onPress={() => {
                if (props.onPress) {
                    props.onPress();
                    return;
                }
                navigation.navigateSimpleTransfer({
                    amount: null,
                    target: null,
                    comment: null,
                    jetton: props.jetton.wallet,
                    stateInit: null,
                    job: null,
                    callback: null
                });
            }}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            onLongPress={props.onLongPress ? props.onLongPress : promptDisable}
        >
            <Animated.View style={[{ flex: 1 }, animatedStyle]}>
                <View style={{ flexDirection: 'row', flexGrow: 1, alignItems: 'center', padding: 20, }}>
                    <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 0 }}>
                        <WImage
                            src={props.jetton.icon ? props.jetton.icon : undefined}
                            width={46}
                            heigh={46}
                            borderRadius={23}
                        />
                        {isKnown && (
                            <Verified
                                height={16} width={16}
                                style={{
                                    height: 16, width: 16,
                                    position: 'absolute', right: -2, bottom: -2,
                                }}
                            />
                        )}
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text
                            style={{ color: Theme.textColor, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
                            ellipsizeMode="tail"
                            numberOfLines={1}
                        >
                            {props.jetton.name}
                        </Text>
                        <Text
                            numberOfLines={1} ellipsizeMode={'tail'}
                            style={{ fontSize: 15, fontWeight: '400', lineHeight: 20, color: Theme.darkGrey }}
                        >
                            <Text style={{ flexShrink: 1 }}>
                                {props.jetton.description}
                            </Text>
                        </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{
                            color: Theme.textColor, fontSize: 17, lineHeight: 24, fontWeight: '600',
                        }}>
                            <ValueComponent
                                value={balance}
                                decimals={props.jetton.decimals}
                            />{props.jetton.symbol ? (' ' + props.jetton.symbol) : ''}
                        </Text>
                        <View style={{ flexGrow: 1 }} />
                    </View>
                </View>
                {!props.last && (<View style={{ backgroundColor: Theme.mediumGrey, height: 1, marginHorizontal: 20 }} />)}
            </Animated.View>
        </Pressable>
    );
});