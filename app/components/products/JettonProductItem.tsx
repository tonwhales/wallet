import * as React from 'react';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { View, Pressable, Text, StyleProp, ViewStyle } from 'react-native';
import { ValueComponent } from '../ValueComponent';
import { useAnimatedPressedInOut } from '../../utils/useAnimatedPressedInOut';
import Animated from 'react-native-reanimated';
import { Suspense, memo, useCallback, useRef } from 'react';
import { Swipeable } from 'react-native-gesture-handler';
import { useJetton, useJettonWallet, useNetwork, useTheme, useVerifyJetton } from '../../engine/hooks';
import { PerfText } from '../basic/PerfText';
import { useJettonSwap } from '../../engine/hooks/jettons/useJettonSwap';
import { PriceComponent } from '../PriceComponent';
import { Address, fromNano, toNano } from '@ton/core';
import { JettonIcon } from './JettonIcon';
import { Typography } from '../styles';
import { PerfView } from '../basic/PerfView';
import { JettonMasterState } from '../../engine/metadata/fetchJettonMasterContent';
import { ellipsiseAddress } from '../address/WalletAddress';
import { LoadingIndicator } from '../LoadingIndicator';
import { t } from '../../i18n/t';
import { Image } from 'expo-image';
import { ToastDuration, useToaster } from '../toast/ToastProvider';
import { copyText } from '../../utils/copyText';
import { Jetton } from '../../engine/types';
import { mapJettonToMasterState } from '../../utils/jettons/mapJettonToMasterState';
import { useJettonRate } from '../../engine/hooks/jettons/useJettonRate';
import { fromBnWithDecimals, toBnWithDecimals } from '../../utils/withDecimals';
import { CurrencySymbols } from '../../utils/formatCurrency';

import IcCheck from "@assets/ic-check.svg";
import { calculateSwapAmount } from '../../utils/jettons/calculateSwapAmount';

type JettonProductItemProps = {
    wallet: Address,
    owner: Address,
    last?: boolean,
    first?: boolean,
    rightAction?: () => void,
    rightActionIcon?: any,
    single?: boolean,
    card?: boolean,
    ledger?: boolean,
    itemStyle?: StyleProp<ViewStyle>,
    selectParams?: {
        onSelect: (j: Jetton) => void,
        selectedFn?: (j: Jetton) => boolean
        hideSelection?: boolean,
    }
    selected?: boolean,
    onReady?: (address: string) => void,
};

const JettonItemSekeleton = memo((props: JettonProductItemProps & { type: 'loading' | 'failed' }) => {
    const theme = useTheme();
    const { isTestnet: testOnly } = useNetwork();
    const toaster = useToaster();
    const swipableRef = useRef<Swipeable>(null);

    const onPressed = useCallback(() => {
        copyText(props.wallet.toString({ testOnly }));
        toaster.show({
            message: t('common.walletAddress') + ' ' + t('common.copied').toLowerCase(),
            type: 'default',
            duration: ToastDuration.SHORT,
        });
    }, [props.wallet]);

    return (
        (props.rightAction) ? (
            <Swipeable
                ref={swipableRef}
                overshootRight={false}
                containerStyle={[{ flex: 1 }, props.itemStyle]}
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
                        },
                ]}
                renderRightActions={() => {
                    return (
                        <Pressable
                            style={[
                                {
                                    padding: 20,
                                    justifyContent: 'center', alignItems: 'center',
                                    backgroundColor: theme.accent,
                                },
                                props.card
                                    ? {
                                        borderRadius: 20,
                                        marginLeft: 10
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
                <Pressable
                    style={{
                        height: 86,
                        flexDirection: 'row',
                        borderRadius: 20,
                        overflow: 'hidden',
                        padding: 20,
                        alignItems: 'center',
                        flex: 1,
                        backgroundColor: theme.surfaceOnBg
                    }}
                    onPress={onPressed}
                >
                    <View style={{
                        height: 46,
                        width: 46,
                        borderRadius: 23,
                        backgroundColor: theme.divider,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }} >
                        {props.type === 'loading' ? (
                            <LoadingIndicator simple color={theme.textPrimary} />
                        ) : (

                            <Image
                                style={{ width: 46, height: 46, borderRadius: 23 }}
                                placeholder={require('@assets/ic_app_placeholder.png')}
                                placeholderContentFit={'contain'}
                            />
                        )}
                    </View>
                    <View style={{ marginLeft: 12, flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                        <PerfView>
                            {props.type === 'loading' ? (

                                <PerfView style={{
                                    height: 20, width: 100,
                                    backgroundColor: theme.textSecondary,
                                    borderRadius: 8,
                                    marginBottom: 4,
                                    opacity: 0.5
                                }} />
                            ) : (
                                <PerfText
                                    style={[{ color: theme.textPrimary, marginRight: 2 }, Typography.semiBold17_24]}
                                    ellipsizeMode="tail"
                                    numberOfLines={1}
                                >
                                    {t('common.notFound')}
                                </PerfText>
                            )}
                            <PerfText
                                numberOfLines={1} ellipsizeMode={'tail'}
                                style={[{ color: theme.textSecondary }, Typography.regular15_20]}
                            >
                                <PerfText style={{ flexShrink: 1 }}>
                                    {ellipsiseAddress(props.wallet.toString({ testOnly }), { start: 6, end: 6 })}
                                </PerfText>
                            </PerfText>
                        </PerfView>
                        <PerfView style={{ alignItems: 'flex-end' }}>
                            <PerfView style={{
                                height: 20, width: 86,
                                backgroundColor: theme.textSecondary,
                                borderRadius: 8,
                                marginBottom: 8,
                                opacity: 0.5
                            }} />
                            <PerfView style={{
                                height: 20, width: 30,
                                backgroundColor: theme.textSecondary,
                                borderRadius: 8,
                                marginBottom: 4,
                                opacity: 0.5
                            }} />
                        </PerfView>
                    </View>
                </Pressable>
            </Swipeable>
        ) : (
            <Pressable style={[
                {
                    height: 86,
                    flexDirection: 'row',
                    borderRadius: 20,
                    overflow: 'hidden',
                    padding: 20,
                    alignItems: 'center',
                    flex: 1,
                    backgroundColor: theme.surfaceOnBg
                },
                props.itemStyle
            ]}
                onPress={onPressed}
            >
                <View style={{
                    height: 46,
                    width: 46,
                    borderRadius: 23,
                    backgroundColor: theme.divider,
                    overflow: 'hidden',
                    justifyContent: 'center',
                    alignItems: 'center'
                }} >
                    {props.type === 'loading' ? (
                        <LoadingIndicator simple color={theme.textPrimary} />
                    ) : (

                        <Image
                            style={{ width: 46, height: 46, borderRadius: 23 }}
                            placeholder={require('@assets/ic_app_placeholder.png')}
                            placeholderContentFit={'contain'}
                        />
                    )}
                </View>
                <View style={{ marginLeft: 12, flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <PerfView>
                        {props.type === 'loading' ? (
                            <PerfView style={{
                                height: 20, width: 100,
                                backgroundColor: theme.textSecondary,
                                borderRadius: 8,
                                marginBottom: 4,
                                opacity: 0.5
                            }} />
                        ) : (
                            <PerfText
                                style={[{ color: theme.textPrimary, marginRight: 2 }, Typography.semiBold17_24]}
                                ellipsizeMode="tail"
                                numberOfLines={1}
                            >
                                {t('common.notFound')}
                            </PerfText>
                        )}
                        <PerfText
                            numberOfLines={1} ellipsizeMode={'tail'}
                            style={[{ color: theme.textSecondary }, Typography.regular15_20]}
                        >
                            <PerfText style={{ flexShrink: 1 }}>
                                {ellipsiseAddress(props.wallet.toString({ testOnly }), { start: 6, end: 6 })}
                            </PerfText>
                        </PerfText>
                    </PerfView>
                    <PerfView style={{ alignItems: 'flex-end' }}>
                        <PerfView style={{
                            height: 20, width: 86,
                            backgroundColor: theme.textSecondary,
                            borderRadius: 8,
                            marginBottom: 8,
                            opacity: 0.5
                        }} />
                        <PerfView style={{
                            height: 20, width: 30,
                            backgroundColor: theme.textSecondary,
                            borderRadius: 8,
                            marginBottom: 4,
                            opacity: 0.5
                        }} />
                    </PerfView>
                </View>
            </Pressable>
        )
    );
});

export const JettonProductItem = memo((props: JettonProductItemProps) => {
    return (
        <Suspense fallback={<JettonItemSekeleton {...props} type={'loading'} />}>
            <JettonProductItemComponent {...props} />
        </Suspense>
    );
});

const JettonProductItemComponent = memo((props: JettonProductItemProps) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const jettonWallet = useJettonWallet(props.wallet.toString({ testOnly: isTestnet }));
    const jetton = useJetton({ owner: props.owner, master: jettonWallet?.master, wallet: props.wallet }, true);
    const navigation = useTypedNavigation();
    const balance = jetton?.balance ?? 0n;
    const [rate, currency] = useJettonRate(jetton?.master.toString({ testOnly: isTestnet }));
    const decimals = jetton?.decimals ?? 9;
    const swapAmount = rate ? calculateSwapAmount(balance, rate, decimals) : undefined;
    const swipableRef = useRef<Swipeable>(null);

    const { isSCAM } = useVerifyJetton({
        ticker: jetton?.symbol,
        master: jetton?.master.toString({ testOnly: isTestnet })
    });

    const { onPressIn, onPressOut, animatedStyle } = useAnimatedPressedInOut();

    const onPress = useCallback(() => {
        if (!jetton) {
            return;
        }

        if (props.selectParams?.onSelect) {
            props.selectParams.onSelect(jetton);
            return;
        }

        navigation.navigate(
            props.ledger ? 'LedgerSimpleTransfer' : 'SimpleTransfer',
            {
                amount: null,
                target: null,
                comment: null,
                jetton: jetton.wallet,
                stateInit: null,
                job: null,
                callback: null
            }
        );
    }, [jetton, props.ledger, props.selectParams?.onSelect]);

    if (!jetton) {
        return null;
    }

    let name = jetton.name;
    let description = jetton.description;
    let symbol = jetton.symbol ?? '';
    let isSelected = props.selectParams?.selectedFn ? props.selectParams.selectedFn(jetton) : false;

    const masterState: JettonMasterState & { address: string } = mapJettonToMasterState(jetton, isTestnet);

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
                                        backgroundColor: theme.accent,
                                    },
                                    props.card
                                        ? {
                                            borderRadius: 20,
                                            marginLeft: 10
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
                    <Pressable
                        style={({ pressed }) => ({ flexGrow: 1, opacity: pressed ? 0.8 : 1 })}
                        onPressIn={onPressIn}
                        onPressOut={onPressOut}
                        onPress={onPress}
                    >
                        <View style={[{
                            flexDirection: 'row', flexGrow: 1,
                            alignItems: 'center',
                            padding: 20,
                            backgroundColor: theme.surfaceOnBg
                        }, props.itemStyle]}>
                            <JettonIcon
                                size={46}
                                jetton={masterState}
                                theme={theme}
                                isTestnet={isTestnet}
                                backgroundColor={theme.surfaceOnElevation}
                            />
                            <View style={{ marginLeft: 12, flex: 1 }}>
                                <PerfText
                                    style={[{ color: theme.textPrimary, marginRight: 2 }, Typography.semiBold17_24]}
                                    ellipsizeMode="tail"
                                    numberOfLines={1}
                                >
                                    {name}
                                </PerfText>
                                <Text
                                    numberOfLines={1} ellipsizeMode={'tail'}
                                    style={[{ color: theme.textSecondary }, Typography.regular15_20]}
                                >
                                    <Text style={{ flexShrink: 1 }}>
                                        {isSCAM && (
                                            <>
                                                <Text style={{ color: theme.accentRed }}>
                                                    {'SCAM'}
                                                </Text>
                                                {description ? ' • ' : ''}
                                            </>
                                        )}
                                        {description}
                                    </Text>
                                </Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                    <ValueComponent
                                        value={balance}
                                        decimals={jetton?.decimals}
                                        precision={1}
                                        centFontStyle={{ color: theme.textSecondary }}
                                    />
                                    {!!swapAmount ? (
                                        <Text style={{ color: theme.textSecondary, fontSize: 15 }}>
                                            {` ${symbol}`}
                                        </Text>
                                    ) : (symbol.length <= 5 && (
                                        <Text style={{ color: theme.textSecondary, fontSize: 15 }}>
                                            {` ${symbol}`}
                                        </Text>
                                    ))}
                                </Text>
                                {!!swapAmount ? (
                                    <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                                        <ValueComponent
                                            value={swapAmount}
                                            precision={2}
                                            suffix={CurrencySymbols[currency]?.symbol}
                                            decimals={decimals}
                                            forcePrecision
                                        />
                                    </Text>
                                ) : (symbol.length > 5 && (
                                    <Text style={{ color: theme.textSecondary, fontSize: 15 }}>
                                        {` ${symbol}`}
                                    </Text>
                                ))}
                            </View>
                        </View>
                    </Pressable>
                </Swipeable>
                {!props.last && !props.card && (
                    <PerfView
                        style={{
                            backgroundColor: theme.divider,
                            height: 1,
                            position: 'absolute',
                            bottom: 0,
                            left: 36, right: 36
                        }}
                    />
                )}
            </Animated.View>
        ) : (
            <Pressable
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={{ flex: 1, borderRadius: 20, overflow: 'hidden', maxHeight: 102 }}
                onPress={onPress}
            >
                <Animated.View style={[
                    {
                        flexDirection: 'row', flexGrow: 1,
                        alignItems: 'center',
                        padding: 20,
                        backgroundColor: theme.surfaceOnBg
                    },
                    animatedStyle,
                    props.itemStyle
                ]}>
                    <JettonIcon
                        size={46}
                        jetton={masterState}
                        theme={theme}
                        isTestnet={isTestnet}
                    />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                        <PerfText
                            style={[{ color: theme.textPrimary, marginRight: 2 }, Typography.semiBold17_24]}
                            ellipsizeMode="tail"
                            numberOfLines={1}
                        >
                            {name}
                        </PerfText>
                        <Text
                            numberOfLines={1} ellipsizeMode={'tail'}
                            style={[{ color: theme.textSecondary }, Typography.regular15_20]}
                        >
                            <Text style={{ flexShrink: 1 }}>
                                {isSCAM && (
                                    <>
                                        <Text style={{ color: theme.accentRed }}>
                                            {'SCAM'}
                                        </Text>
                                        {description ? ' • ' : ''}
                                    </>
                                )}
                                {description}
                            </Text>
                        </Text>
                    </View>
                    {!props.selectParams ? (
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[{ color: theme.textPrimary, flexShrink: 1 }, Typography.semiBold17_24]}>
                                <ValueComponent
                                    value={balance}
                                    decimals={jetton?.decimals}
                                    precision={2}
                                    forcePrecision
                                    centFontStyle={{ color: theme.textSecondary }}
                                />
                                {!!swapAmount ? (
                                    <Text style={{ color: theme.textSecondary, fontSize: 15 }}>
                                        {` ${symbol}`}
                                    </Text>
                                ) : (symbol.length <= 5 && (
                                    <Text style={{ color: theme.textSecondary, fontSize: 15 }}>
                                        {` ${symbol}`}
                                    </Text>
                                ))}
                            </Text>
                            {!!swapAmount ? (
                                <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                                    <ValueComponent
                                        value={swapAmount}
                                        precision={2}
                                        suffix={CurrencySymbols[currency]?.symbol}
                                        decimals={decimals}
                                        forcePrecision
                                    />
                                </Text>
                            ) : (symbol.length > 5 && (
                                <Text style={{ color: theme.textSecondary, fontSize: 15 }}>
                                    {` ${symbol}`}
                                </Text>
                            ))}
                        </View>
                    ) : (
                        !props.selectParams.hideSelection && (
                            <View style={{
                                justifyContent: 'center', alignItems: 'center',
                                height: 24, width: 24,
                                backgroundColor: isSelected ? theme.accent : theme.divider,
                                borderRadius: 12
                            }}>
                                {isSelected && (
                                    <IcCheck
                                        color={theme.white}
                                        height={16} width={16}
                                        style={{ height: 16, width: 16 }}
                                    />
                                )}
                            </View>
                        )
                    )}
                </Animated.View>
                {!props.last && !props.card && (
                    <PerfView
                        style={{
                            backgroundColor: theme.divider,
                            height: 1,
                            position: 'absolute',
                            bottom: 0,
                            left: 36, right: 36
                        }}
                    />
                )}
            </Pressable>
        )
    );
});
JettonProductItem.displayName = 'JettonProductItem';