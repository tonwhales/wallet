import { memo, useCallback, useMemo, useRef } from "react";
import { ExtraCurrencyHint } from "../../engine/api/fetchExtraCurrencyHints";
import { View, Text, ViewStyle, StyleProp, Pressable } from "react-native";
import { Address } from "@ton/core";
import { AssetViewType } from "../../fragments/wallet/AssetsFragment";
import { ValueComponent } from "../ValueComponent";
import { useTheme } from "../../engine/hooks";
import { Typography } from "../styles";
import { PerfView } from "../basic/PerfView";
import { Swipeable, Pressable as GHPressable } from 'react-native-gesture-handler';
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { PerfText } from "../basic/PerfText";
import { WImage } from "../WImage";

import IcCheck from "@assets/ic-check.svg";

type ExtraCurrencyProductItemProps = {
    currency: ExtraCurrencyHint,
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
        onSelect: (j: ExtraCurrencyHint) => void,
        selectedFn?: (j: ExtraCurrencyHint) => boolean
        hideSelection?: boolean,
        forceBalance?: boolean
    }
    selected?: boolean,
    onReady?: (address: string) => void,
    jettonViewType: AssetViewType,
    description?: string
}

export const ExtraCurrencyProductItem = memo((props: ExtraCurrencyProductItemProps) => {
    const { currency, owner, jettonViewType, selectParams, ledger } = props;
    const { amount, preview } = currency;
    const { decimals, symbol } = preview;
    const theme = useTheme();
    const balance = BigInt(amount);
    const swipableRef = useRef<Swipeable>(null);
    const navigation = useTypedNavigation();
    const isSelected = props.selectParams?.selectedFn
        ? props.selectParams.selectedFn(currency)
        : false;

    const subtitle = useMemo(() => {
        switch (jettonViewType) {
            case AssetViewType.Default:
            case AssetViewType.Receive:
                return null;
            case AssetViewType.Transfer:
                return (
                    <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                        <ValueComponent
                            value={balance}
                            decimals={decimals}
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

    }, [balance, symbol, jettonViewType, theme, decimals]);

    const onPress = useCallback(() => {

        if (selectParams?.onSelect) {
            selectParams.onSelect(currency);
            return;
        }

        navigation.navigateSimpleTransfer({
            amount: null,
            target: null,
            comment: null,
            asset: { type: 'extraCurrency', id: currency.preview.id },
            stateInit: null,
            callback: null
        }, { ledger });
    }, [currency, ledger, selectParams?.onSelect]);

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
                    <GHPressable
                        style={({ pressed }) => ({ flexGrow: 1, opacity: pressed ? 0.5 : 1 })}
                        onPress={onPress}
                    >
                        <View style={[{
                            flexDirection: 'row', flexGrow: 1,
                            alignItems: 'center',
                            padding: 20,
                            backgroundColor: theme.surfaceOnBg
                        }, props.itemStyle]}>
                            <WImage
                                src={currency.preview.image}
                                width={46}
                                height={46}
                                borderRadius={46}
                            />
                            <View style={{ marginLeft: 12, flex: 1, justifyContent: 'center' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                    <PerfText
                                        style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}
                                        ellipsizeMode="tail"
                                        numberOfLines={1}
                                    >
                                        {symbol}
                                    </PerfText>
                                </View>
                                {subtitle}
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                    <ValueComponent
                                        value={balance}
                                        decimals={decimals}
                                        precision={2}
                                        forcePrecision
                                        centFontStyle={{ color: theme.textSecondary }}
                                        suffix={` ${symbol}`}
                                    />
                                </Text>
                            </View>
                        </View>
                    </GHPressable>
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
                    <WImage
                        src={currency.preview.image}
                        width={46}
                        height={46}
                        borderRadius={46}
                    />
                    <View style={{ marginLeft: 12, flex: 1, justifyContent: 'center' }}>
                        <PerfText
                            style={[{ color: theme.textPrimary, marginRight: 2 }, Typography.semiBold17_24]}
                            ellipsizeMode="tail"
                            numberOfLines={1}
                        >
                            {symbol}
                        </PerfText>
                        {subtitle}
                    </View>
                    {(!props.selectParams || props.selectParams.forceBalance) ? (
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[{ color: theme.textPrimary, flexShrink: 1 }, Typography.semiBold17_24]}>
                                <ValueComponent
                                    value={balance}
                                    decimals={decimals}
                                    precision={2}
                                    forcePrecision
                                    centFontStyle={{ color: theme.textSecondary }}
                                    suffix={` ${symbol}`}
                                />
                            </Text>
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
