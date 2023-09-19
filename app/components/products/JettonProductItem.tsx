import BN from 'bn.js';
import * as React from 'react';
import { Address } from 'ton';
import { useEngine } from '../../engine/Engine';
import { KnownJettonMasters } from '../../secure/KnownWallets';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { View, Text, Pressable } from 'react-native';
import { useAppConfig } from '../../utils/AppConfigContext';
import { ValueComponent } from '../ValueComponent';
import { WImage } from '../WImage';
import { useAnimatedPressedInOut } from '../../utils/useAnimatedPressedInOut';
import Animated from 'react-native-reanimated';
import { memo, useCallback, useRef, useState } from 'react';
import { Swipeable } from 'react-native-gesture-handler';

import Verified from '@assets/ic-verified.svg';

export const JettonProductItem = memo((props: {
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
    first?: boolean,
    rightAction?: () => void
    rightActionIcon?: any,
    single?: boolean
}) => {
    const { Theme } = useAppConfig();
    const engine = useEngine();
    const navigation = useTypedNavigation();
    const balance = props.jetton.balance;
    const [swiping, setSwiping] = useState(false);
    const swipableRef = useRef<Swipeable>(null);

    const isKnown = !!KnownJettonMasters(engine.isTestnet)[props.jetton.master.toFriendly({ testOnly: engine.isTestnet })];

    const { onPressIn, onPressOut, animatedStyle } = useAnimatedPressedInOut();

    const onSwipe = useCallback((inProgress: boolean) => {
        setSwiping(inProgress);
        onPressOut();
    }, []);

    const onPress = useCallback(() => {
        if (swiping) {
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
        });;
    }, [props.jetton, swiping]);

    return (
        (props.rightAction) ? (
            <Pressable
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={{ flex: 1 }}
                onPress={onPress}
            >
                <Animated.View style={[
                    { flex: 1, flexDirection: 'row' },
                    swiping ? { transform: [{ scale: 1 }] } : animatedStyle
                ]}>
                    <Swipeable
                        ref={swipableRef}
                        onSwipeableWillOpen={() => onSwipe(true)}
                        onSwipeableOpen={() => onSwipe(true)}
                        onSwipeableWillClose={() => onSwipe(false)}
                        onSwipeableClose={() => onSwipe(false)}
                        overshootRight={false}
                        containerStyle={{ flex: 1 }}
                        useNativeAnimations={true}
                        childrenContainerStyle={{
                            marginHorizontal: 16,
                            borderTopLeftRadius: props.first ? 20 : 0,
                            borderTopRightRadius: props.first ? 20 : 0,
                            borderBottomLeftRadius: props.last ? 20 : 0,
                            borderBottomRightRadius: props.last ? 20 : 0,
                            overflow: 'hidden'
                        }}
                        renderRightActions={() => {
                            return (
                                <Pressable
                                    style={{
                                        right: -16,
                                        padding: 20,
                                        justifyContent: 'center', alignItems: 'center',
                                        borderTopRightRadius: props.first ? 20 : 0,
                                        borderBottomRightRadius: props.last ? 20 : 0,
                                        backgroundColor: props.single ? Theme.transparent : Theme.surfaceSecondary,
                                    }}
                                    onPress={() => {
                                        swipableRef.current?.close();
                                        if (props.rightAction) {
                                            props.rightAction();
                                        }
                                    }}
                                >
                                    {props.rightActionIcon}
                                    {!props.single && <View
                                        style={{
                                            position: 'absolute',
                                            top: 0, bottom: 0, left: -20,
                                            width: 20,
                                            backgroundColor: Theme.surfaceSecondary,
                                        }}
                                    />}
                                </Pressable>
                            )
                        }}
                    >
                        <View style={{
                            flexDirection: 'row', flexGrow: 1,
                            alignItems: 'center',
                            padding: 20,
                            backgroundColor: Theme.surfaceSecondary,
                        }}>
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
                                    style={{ color: Theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
                                    ellipsizeMode="tail"
                                    numberOfLines={1}
                                >
                                    {props.jetton.name}
                                </Text>
                                <Text
                                    numberOfLines={1} ellipsizeMode={'tail'}
                                    style={{ fontSize: 15, fontWeight: '400', lineHeight: 20, color: Theme.textSecondary }}
                                >
                                    <Text style={{ flexShrink: 1 }}>
                                        {props.jetton.description}
                                    </Text>
                                </Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{
                                    color: Theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600',
                                }}>
                                    <ValueComponent
                                        value={balance}
                                        decimals={props.jetton.decimals}
                                    />{props.jetton.symbol ? (' ' + props.jetton.symbol) : ''}
                                </Text>
                                <View style={{ flexGrow: 1 }} />
                            </View>
                        </View>
                    </Swipeable>
                </Animated.View>
                {!props.last && (
                    <View style={{ backgroundColor: Theme.divider, height: 1, position: 'absolute', bottom: 0, left: 36, right: 36 }} />
                )}
            </Pressable>
        ) : (
            <Pressable
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={{ flex: 1, borderRadius: 20, paddingHorizontal: 16 }}
                onPress={onPress}
            >
                <Animated.View style={[
                    {
                        flexDirection: 'row', flexGrow: 1,
                        alignItems: 'center',
                        padding: 20,
                        backgroundColor: Theme.surfaceSecondary
                    },
                    animatedStyle
                ]}>
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
                            style={{ color: Theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
                            ellipsizeMode="tail"
                            numberOfLines={1}
                        >
                            {props.jetton.name}
                        </Text>
                        <Text
                            numberOfLines={1} ellipsizeMode={'tail'}
                            style={{ fontSize: 15, fontWeight: '400', lineHeight: 20, color: Theme.textSecondary }}
                        >
                            <Text style={{ flexShrink: 1 }}>
                                {props.jetton.description}
                            </Text>
                        </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{
                            color: Theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600',
                        }}>
                            <ValueComponent
                                value={balance}
                                decimals={props.jetton.decimals}
                            />{props.jetton.symbol ? (' ' + props.jetton.symbol) : ''}
                        </Text>
                        <View style={{ flexGrow: 1 }} />
                    </View>
                </Animated.View>
                {!props.last && (<View style={{ backgroundColor: Theme.divider, height: 1, position: 'absolute', bottom: 0, left: 36, right: 36 }} />)}
            </Pressable>
        )
    );
});