import * as React from 'react';
import { KnownJettonMasters, KnownJettonTickers } from '../../secure/KnownWallets';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { View, Pressable, Image, Text } from 'react-native';
import { ValueComponent } from '../ValueComponent';
import { WImage } from '../WImage';
import { useAnimatedPressedInOut } from '../../utils/useAnimatedPressedInOut';
import Animated from 'react-native-reanimated';
import { memo, useCallback, useRef } from 'react';
import { Swipeable, TouchableHighlight } from 'react-native-gesture-handler';
import { useNetwork, useTheme } from '../../engine/hooks';
import { Jetton } from '../../engine/types';
import { PerfText } from '../basic/PerfText';
import { useJettonSwap } from '../../engine/hooks/jettons/useJettonSwap';
import { PriceComponent } from '../PriceComponent';
import { fromNano, toNano } from '@ton/core';
import { Typography } from '../styles';

export const JettonProductItem = memo((props: {
    jetton: Jetton,
    last?: boolean,
    first?: boolean,
    rightAction?: () => void
    rightActionIcon?: any,
    single?: boolean,
    card?: boolean,
    ledger?: boolean
}) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const swap = useJettonSwap(props.jetton.master.toString({ testOnly: isTestnet }));
    const navigation = useTypedNavigation();
    const balance = props.jetton.balance;
    const balanceNum = Number(fromNano(balance));
    const swapAmount = (!!swap && balance > 0n)
        ? Number(fromNano(swap)) * balanceNum
        : null;
    const swipableRef = useRef<Swipeable>(null);

    const isKnown = !!KnownJettonMasters(isTestnet)[props.jetton.master.toString({ testOnly: isTestnet })];
    const isSCAM = !isKnown && KnownJettonTickers.includes(props.jetton.symbol);

    const { onPressIn, onPressOut, animatedStyle } = useAnimatedPressedInOut();

    const onPress = useCallback(() => {
        if (props.ledger) {
            navigation.navigate('LedgerSimpleTransfer', {
                amount: null,
                target: null,
                comment: null,
                jetton: props.jetton.wallet,
                stateInit: null,
                job: null,
                callback: null
            });
            return
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
    }, [props.jetton, props.ledger]);

    return (
        (props.rightAction) ? (
            <Animated.View style={[
                { flex: 1, flexDirection: 'row', paddingHorizontal: props.card ? 0 : 16 },
                animatedStyle
            ]}>
                <Swipeable
                    ref={swipableRef}
                    overshootRight={false}
                    containerStyle={{ flex: 1 }}
                    useNativeAnimations={true}
                    childrenContainerStyle={[
                        {
                            flex: 1,
                            overflow: 'hidden'
                        },
                        props.card
                            ? { borderRadius: 20 }
                            : {
                                borderTopLeftRadius: props.first ? 20 : 0,
                                borderTopRightRadius: props.first ? 20 : 0,
                                borderBottomLeftRadius: props.last ? 20 : 0,
                                borderBottomRightRadius: props.last ? 20 : 0,
                            }
                    ]}
                    renderRightActions={() => {
                        return (
                            <Pressable
                                style={[
                                    {
                                        padding: 20,
                                        justifyContent: 'center', alignItems: 'center',
                                        borderRadius: 20,
                                        backgroundColor: theme.accent,
                                        marginLeft: 10
                                    },
                                    props.card
                                        ? {
                                            borderTopRightRadius: 20,
                                            borderBottomRightRadius: 20,
                                        } : {
                                            borderTopRightRadius: props.first ? 20 : 0,
                                            borderBottomRightRadius: props.last ? 20 : 0,
                                        }
                                ]}
                                onPress={() => {
                                    swipableRef.current?.close();
                                    if (props.rightAction) {
                                        props.rightAction();
                                    }
                                }}
                            >
                                {props.rightActionIcon}
                            </Pressable>
                        )
                    }}
                >
                    <TouchableHighlight
                        style={{ flexGrow: 1 }}
                        onPressIn={onPressIn}
                        onPressOut={onPressOut}
                        onPress={onPress}
                    >
                        <View style={{
                            flexDirection: 'row', flexGrow: 1,
                            alignItems: 'center',
                            padding: 20,
                            backgroundColor: theme.surfaceOnBg
                        }}>
                            <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 0 }}>
                                <WImage
                                    src={props.jetton.icon ? props.jetton.icon : undefined}
                                    width={46}
                                    heigh={46}
                                    borderRadius={23}
                                />
                                {isKnown ? (
                                    <View style={{
                                        justifyContent: 'center', alignItems: 'center',
                                        height: 20, width: 20, borderRadius: 10,
                                        position: 'absolute', right: -2, bottom: -2,
                                        backgroundColor: theme.surfaceOnBg
                                    }}>
                                        <Image
                                            source={require('@assets/ic-verified.png')}
                                            style={{ height: 20, width: 20 }}
                                        />
                                    </View>
                                ) : (isSCAM && (
                                    <View style={{
                                        justifyContent: 'center', alignItems: 'center',
                                        height: 20, width: 20, borderRadius: 10,
                                        position: 'absolute', right: -2, bottom: -2,
                                        backgroundColor: theme.surfaceOnBg
                                    }}>
                                        <Image
                                            source={require('@assets/ic-jetton-scam.png')}
                                            style={{ height: 20, width: 20 }}
                                        />
                                    </View>
                                ))}
                            </View>
                            <View style={{ marginLeft: 12, flex: 1 }}>
                                <PerfText
                                    style={{ color: theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
                                    ellipsizeMode="tail"
                                    numberOfLines={1}
                                >
                                    {props.jetton.name}
                                </PerfText>
                                <PerfText
                                    numberOfLines={1} ellipsizeMode={'tail'}
                                    style={[{ color: theme.textSecondary }, Typography.regular15_20]}
                                >
                                    <PerfText style={{ flexShrink: 1 }}>
                                        {isSCAM && (
                                            <>
                                                <PerfText style={{ color: theme.accentRed }}>
                                                    {'SCAM'}
                                                </PerfText>
                                                {props.jetton.description ? ' • ' : ''}
                                            </>
                                        )}
                                        {props.jetton.description}
                                    </PerfText>
                                </PerfText>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <PerfText style={{
                                    color: theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600',
                                }}>
                                    <ValueComponent
                                        value={balance}
                                        decimals={props.jetton.decimals}
                                    />
                                    <Text style={{ color: theme.textSecondary, fontSize: 15 }}>
                                        {props.jetton.symbol ? (' ' + props.jetton.symbol) : ''}
                                    </Text>
                                </PerfText>
                                {!!swapAmount && (
                                    <PriceComponent
                                        amount={toNano(swapAmount)}
                                        style={{
                                            backgroundColor: 'transparent',
                                            paddingHorizontal: 0, paddingVertical: 0,
                                            alignSelf: 'flex-end',
                                            height: undefined
                                        }}
                                        textStyle={{ color: theme.textSecondary, fontWeight: '400', fontSize: 15, lineHeight: 20 }}
                                        theme={theme}
                                    />
                                )}
                            </View>
                        </View>
                    </TouchableHighlight>
                </Swipeable>
                {
                    !props.last && !props.card && (
                        <View style={{ backgroundColor: theme.divider, height: 1, position: 'absolute', bottom: 0, left: 36, right: 36 }} />
                    )
                }
            </Animated.View >
        ) : (
            <Pressable
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={{ flex: 1, borderRadius: 20, overflow: 'hidden' }}
                onPress={onPress}
            >
                <Animated.View style={[
                    {
                        flexDirection: 'row', flexGrow: 1,
                        alignItems: 'center',
                        padding: 20,
                        backgroundColor: theme.surfaceOnBg
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
                            <View style={{
                                justifyContent: 'center', alignItems: 'center',
                                height: 20, width: 20, borderRadius: 10,
                                position: 'absolute', right: -2, bottom: -2,
                                backgroundColor: theme.surfaceOnBg
                            }}>
                                <Image
                                    source={require('@assets/ic-verified.png')}
                                    style={{ height: 20, width: 20 }}
                                />
                            </View>
                        )}
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                        <PerfText
                            style={{ color: theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
                            ellipsizeMode="tail"
                            numberOfLines={1}
                        >
                            {props.jetton.name}
                        </PerfText>
                        <PerfText
                            numberOfLines={1} ellipsizeMode={'tail'}
                            style={{ fontSize: 15, fontWeight: '400', lineHeight: 20, color: theme.textSecondary }}
                        >
                            <PerfText style={{ flexShrink: 1 }}>
                                {props.jetton.description}
                            </PerfText>
                        </PerfText>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <PerfText style={{
                            color: theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600',
                        }}>
                            <ValueComponent
                                value={balance}
                                decimals={props.jetton.decimals}
                            />
                            <Text style={{ color: theme.textSecondary, fontSize: 15 }}>
                                {props.jetton.symbol ? (' ' + props.jetton.symbol) : ''}
                            </Text>
                        </PerfText>
                        <View style={{ flexGrow: 1 }} />
                    </View>
                </Animated.View>
                {!props.last && (<View style={{ backgroundColor: theme.divider, height: 1, position: 'absolute', bottom: 0, left: 36, right: 36 }} />)}
            </Pressable>
        )
    );
});