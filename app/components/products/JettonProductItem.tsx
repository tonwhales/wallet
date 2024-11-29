import * as React from 'react';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { View, Pressable, Text, StyleProp, ViewStyle } from 'react-native';
import { ValueComponent } from '../ValueComponent';
import { Suspense, memo, useCallback, useMemo, useRef } from 'react';
import { Swipeable } from 'react-native-gesture-handler';
import { useNetwork, usePrimaryCurrency, useTheme, useVerifyJetton } from '../../engine/hooks';
import { PerfText } from '../basic/PerfText';
import { Address, toNano } from '@ton/core';
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
import { mapJettonFullToMasterState } from '../../utils/jettons/mapJettonToMasterState';
import { CurrencySymbols } from '../../utils/formatCurrency';
import { calculateSwapAmount } from '../../utils/jettons/calculateSwapAmount';
import { JettonFull } from '../../engine/api/fetchHintsFull';
import { AssetViewType } from '../../fragments/wallet/AssetsFragment';
import { useGaslessConfig } from '../../engine/hooks/jettons/useGaslessConfig';

import IcCheck from "@assets/ic-check.svg";
import { useWalletVersion } from '../../engine/hooks/useWalletVersion';
import { GaslessInfoButton } from '../jettons/GaslessInfoButton';

type JettonProductItemProps = {
    hint: JettonFull,
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
        onSelect: (j: JettonFull) => void,
        selectedFn?: (j: JettonFull) => boolean
        hideSelection?: boolean,
    }
    selected?: boolean,
    onReady?: (address: string) => void,
    jettonViewType: AssetViewType
};

const JettonItemSekeleton = memo((props: JettonProductItemProps & { type: 'loading' | 'failed' }) => {
    const theme = useTheme();
    const toaster = useToaster();
    const swipableRef = useRef<Swipeable>(null);

    const onPressed = useCallback(() => {
        copyText(props.hint.walletAddress.address);
        toaster.show({
            message: t('common.walletAddress') + ' ' + t('common.copied').toLowerCase(),
            type: 'default',
            duration: ToastDuration.SHORT,
        });
    }, [props.hint]);

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
                                    {ellipsiseAddress(props.hint.walletAddress.address, { start: 6, end: 6 })}
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
                                {ellipsiseAddress(props.hint.walletAddress.address, { start: 6, end: 6 })}
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
    const { hint, jettonViewType, owner } = props;
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const balance = BigInt(hint.balance) ?? 0n;
    const [currency] = usePrimaryCurrency();
    const rate = hint.price?.prices?.[currency];
    const decimals = hint.jetton.decimals ?? 9;
    const swapAmount = rate ? calculateSwapAmount(balance, rate, decimals) : undefined;
    const swipableRef = useRef<Swipeable>(null);
    const gaslessConfig = useGaslessConfig().data;
    const walletVersion = useWalletVersion(owner);

    const isGassless = useMemo(() => {
        if (walletVersion !== 'v5R1') {
            return false;
        }

        if (!gaslessConfig) {
            return false;
        }

        return gaslessConfig.gas_jettons.find((j) => {
            try {
                return Address.parse(j.master_id).equals(Address.parse(hint.jetton.address));
            } catch (error) {
                return false;
            }
        }) !== undefined;
    }, [gaslessConfig?.gas_jettons, walletVersion, hint.jetton.address]);

    const { isSCAM } = useVerifyJetton({
        ticker: hint.jetton.symbol,
        master: hint.jetton.address
    });

    const onPress = useCallback(() => {
        if (!hint) {
            return;
        }

        if (props.selectParams?.onSelect) {
            props.selectParams.onSelect(hint);
            return;
        }

        navigation.navigate(
            props.ledger ? 'LedgerSimpleTransfer' : 'SimpleTransfer',
            {
                amount: null,
                target: null,
                comment: null,
                jetton: hint.walletAddress.address,
                stateInit: null,
                job: null,
                callback: null
            }
        );
    }, [hint, props.ledger, props.selectParams?.onSelect]);

    if (!hint) {
        return null;
    }

    let name = hint.jetton.name;

    if (name === 'Tether USD') {
        name = 'USDT';
    }

    let symbol = hint.jetton.symbol;

    if (symbol === 'USD₮') {
        symbol = 'USDT';
    }
    const isSelected = props.selectParams?.selectedFn
        ? props.selectParams.selectedFn(hint)
        : false;

    const masterState: JettonMasterState & { address: string } = mapJettonFullToMasterState(hint);

    const subtitle = useMemo(() => {
        switch (jettonViewType) {
            case JettonViewType.Default:
                let showRate = !!rate && rate !== 0;

                // Check if rate is valid 
                if (showRate) {
                    try {
                        toNano(rate!);
                    } catch {
                        showRate = false;
                    }
                }

                if (!showRate && !isSCAM) {
                    return null;
                } else if (isSCAM) {
                    return (
                        <Text
                            numberOfLines={1} ellipsizeMode={'tail'}
                            style={[{ color: theme.accentRed }, Typography.regular15_20]}
                        >
                            {'SCAM'}
                        </Text>
                    )
                }

                return (
                    <Text
                        numberOfLines={1} ellipsizeMode={'tail'}
                        style={[{ color: theme.textSecondary }, Typography.regular15_20]}
                    >
                        <Text style={{ flexShrink: 1 }}>
                            {isSCAM && (
                                <Text style={{ color: theme.accentRed }}>
                                    {'SCAM'}
                                </Text>
                            )}
                            {showRate && (
                                <ValueComponent
                                    value={toNano(rate!)}
                                    precision={2}
                                    suffix={` ${CurrencySymbols[currency]?.symbol}`}
                                    forcePrecision
                                />
                            )}
                        </Text>
                    </Text>
                );
            case AssetViewType.Receive:
                return null;
            case AssetViewType.Transfer:
                return (
                    <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                        <ValueComponent
                            value={balance}
                            decimals={hint.jetton.decimals}
                            precision={2}
                            forcePrecision
                            centFontStyle={{ color: theme.textSecondary }}
                            suffix={` ${symbol}`}
                        />
                    </Text>
                );
            default:
                return null;
        }

    }, [rate, balance, symbol, jettonViewType, currency, isSCAM, theme, hint.jetton.decimals]);

    return (
        (props.rightAction) ? (
            <View style={{ flex: 1, flexDirection: 'row', paddingHorizontal: props.card ? 0 : 16 }}>
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
                        style={({ pressed }) => ({ flexGrow: 1, opacity: pressed ? 0.5 : 1 })}
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
                            <View style={{ marginLeft: 12, flex: 1, justifyContent: 'center' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <PerfText
                                        style={[{ color: theme.textPrimary, marginRight: 2 }, Typography.semiBold17_24]}
                                        ellipsizeMode="tail"
                                        numberOfLines={1}
                                    >
                                        {name}
                                    </PerfText>
                                    {isGassless && (<GaslessInfoButton />)}
                                </View>
                                {subtitle}
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                    <ValueComponent
                                        value={balance}
                                        decimals={hint.jetton.decimals}
                                        precision={2}
                                        forcePrecision
                                        centFontStyle={{ color: theme.textSecondary }}
                                        suffix={` ${symbol}`}
                                    />
                                </Text>
                                {!!swapAmount && (
                                    <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                                        <ValueComponent
                                            value={swapAmount}
                                            precision={2}
                                            suffix={` ${CurrencySymbols[currency]?.symbol}`}
                                            decimals={decimals}
                                            forcePrecision
                                        />
                                    </Text>
                                )}
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
            </View>
        ) : (
            <Pressable
                style={({ pressed }) => ({ flex: 1, borderRadius: 20, overflow: 'hidden', maxHeight: 102, opacity: pressed ? 0.5 : 1 })}
                onPress={onPress}
            >
                <View style={[
                    {
                        flexDirection: 'row', flexGrow: 1,
                        alignItems: 'center',
                        padding: 20,
                        backgroundColor: theme.surfaceOnBg
                    },
                    props.itemStyle
                ]}>
                    <JettonIcon
                        size={46}
                        jetton={masterState}
                        theme={theme}
                        isTestnet={isTestnet}
                    />
                    <View style={{ marginLeft: 12, flex: 1, justifyContent: 'center' }}>
                        <PerfText
                            style={[{ color: theme.textPrimary, marginRight: 2 }, Typography.semiBold17_24]}
                            ellipsizeMode="tail"
                            numberOfLines={1}
                        >
                            {name}
                        </PerfText>
                        {subtitle}
                    </View>
                    {!props.selectParams ? (
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[{ color: theme.textPrimary, flexShrink: 1 }, Typography.semiBold17_24]}>
                                <ValueComponent
                                    value={balance}
                                    decimals={hint.jetton.decimals}
                                    precision={2}
                                    forcePrecision
                                    centFontStyle={{ color: theme.textSecondary }}
                                    suffix={` ${symbol}`}
                                />
                            </Text>
                            {!!swapAmount && (
                                <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                                    <ValueComponent
                                        value={swapAmount}
                                        precision={2}
                                        suffix={` ${CurrencySymbols[currency]?.symbol}`}
                                        decimals={decimals}
                                        forcePrecision
                                    />
                                </Text>
                            )}
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
                </View>
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

JettonProductItemComponent.displayName = 'JettonProductItemComponent';
JettonProductItem.displayName = 'JettonProductItem';