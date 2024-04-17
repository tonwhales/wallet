import * as React from 'react';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { View, Pressable, Text } from 'react-native';
import { ValueComponent } from '../ValueComponent';
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
import { t } from '../../i18n/t';
import { JettonIcon } from './JettonIcon';
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
        ? (Number(fromNano(swap)) * balanceNum).toFixed(2)
        : null;
    const swipableRef = useRef<Swipeable>(null);

    const { onPressIn, onPressOut, animatedStyle } = useAnimatedPressedInOut();

    let name = props.jetton.name;
    let description = props.jetton.description;
    let symbol = props.jetton.symbol ?? '';

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
                            <JettonIcon
                                size={46}
                                jetton={props.jetton}
                                theme={theme}
                                isTestnet={isTestnet}
                                backgroundColor={theme.surfaceOnElevation}
                            />
                            <View style={{ marginLeft: 12, flex: 1 }}>
                                <PerfText
                                    style={{ color: theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
                                    ellipsizeMode="tail"
                                    numberOfLines={1}
                                >
                                    {name}
                                </PerfText>
                                <PerfText
                                    numberOfLines={1} ellipsizeMode={'tail'}
                                    style={[{ color: theme.textSecondary }, Typography.regular15_20]}
                                >
                                    <PerfText style={{ flexShrink: 1 }}>
                                        {description}
                                    </PerfText>
                                </PerfText>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <PerfText style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                    <ValueComponent
                                        value={balance}
                                        decimals={props.jetton.decimals}
                                        precision={1}
                                    />
                                    {!!swapAmount && symbol.length <= 5 && (
                                        <Text style={{ color: theme.textSecondary, fontSize: 15 }}>
                                            {` ${symbol}`}
                                        </Text>
                                    )}
                                </PerfText>
                                {!!swapAmount ? (
                                    <PriceComponent
                                        amount={toNano(swapAmount)}
                                        style={{
                                            backgroundColor: 'transparent',
                                            paddingHorizontal: 0, paddingVertical: 0,
                                            alignSelf: 'flex-end',
                                            height: undefined
                                        }}
                                        textStyle={[{ color: theme.textSecondary }, Typography.regular15_20]}
                                        theme={theme}
                                    />
                                ) : (symbol.length > 5
                                    ? (
                                        <Text style={{ color: theme.textSecondary, fontSize: 15 }}>
                                            {` ${symbol}`}
                                        </Text>
                                    )
                                    : null
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
                    <JettonIcon size={46} jetton={props.jetton} theme={theme} isTestnet={isTestnet} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                        <PerfText
                            style={{ color: theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
                            ellipsizeMode="tail"
                            numberOfLines={1}
                        >
                            {name}
                        </PerfText>
                        <PerfText
                            numberOfLines={1} ellipsizeMode={'tail'}
                            style={{ fontSize: 15, fontWeight: '400', lineHeight: 20, color: theme.textSecondary }}
                        >
                            <PerfText style={{ flexShrink: 1 }}>
                                {description}
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
                                {` ${symbol}`}
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