import { Dispatch, forwardRef, memo, SetStateAction, useCallback, useImperativeHandle, useMemo, useRef } from 'react'
import { Text, View, Pressable } from "react-native";
import Animated, { FadeOut, FadeIn, LinearTransition, Easing, FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { useTypedNavigation } from '../../../../utils/useTypedNavigation';
import { t } from '../../../../i18n/t';
import { formatInputAmount } from '../../../../utils/formatCurrency';
import { ValueComponent } from '../../../../components/ValueComponent';
import { useNetwork, useTheme } from '../../../../engine/hooks';
import { ItemDivider } from '../../../../components/ItemDivider';
import { JettonIcon } from '../../../../components/products/JettonIcon';
import { Typography } from '../../../../components/styles';
import { Image } from 'expo-image';
import { mapJettonToMasterState } from '../../../../utils/jettons/mapJettonToMasterState';
import { AssetViewType } from '../../../wallet/AssetsFragment';
import { PressableChip } from '../../../../components/PressableChip';
import { AmountInput } from '../../../../components/input/AmountInput';
import IcChevron from '@assets/ic_chevron_forward.svg';
import { Jetton } from '../../../../engine/types';
import { HoldersAccountTarget } from '../../../../engine/hooks/holders/useHoldersAccountTrargets';
import { SimpleTransferAsset } from '../hooks/useSimpleTransfer';
import { ExtraCurrencyHint } from '../../../../engine/api/fetchExtraCurrencyHints';
import { WImage } from '../../../../components/WImage';

type Props = {
    onAssetSelected: (selected?: SimpleTransferAsset) => void;
    jetton: Jetton | null;
    extraCurrency?: ExtraCurrencyHint | null;
    isLedger: boolean;
    isSCAM: boolean;
    symbol: string;
    balance: bigint;
    onAddAll: () => void;
    amount: string;
    amountError?: string;
    setAmount: Dispatch<SetStateAction<string>>;
    priceText?: string;
    shouldChangeJetton?: boolean;
    holdersTarget?: HoldersAccountTarget;
    onChangeJetton: () => void;
    onInputFocus: (index: number) => void;
    selectedAsset: SimpleTransferAsset | null
}

export const SimpleTransferAmount = memo(forwardRef(({
    onAssetSelected,
    jetton,
    extraCurrency,
    isLedger,
    isSCAM,
    symbol,
    balance,
    onAddAll,
    amount,
    setAmount,
    amountError,
    priceText,
    shouldChangeJetton,
    holdersTarget,
    onChangeJetton,
    onInputFocus,
    selectedAsset,
}: Props, ref) => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const network = useNetwork();
    const innerRef = useRef(null)

    useImperativeHandle(ref, () => innerRef.current)

    const onValueChange = useCallback((newVal: string) => {
        setAmount(prev => formatInputAmount(newVal, jetton?.decimals ?? 9, { skipFormattingDecimals: true }, prev));
    }, [jetton?.decimals])

    const onNavigateAssets = useCallback(() => {
        navigation.navigateAssets({
            simpleTransferAssetCallback: onAssetSelected,
            selectedAsset,
            viewType: AssetViewType.Transfer,
            isLedger
        });
    }, [onAssetSelected, jetton?.master, isLedger, selectedAsset])

    const assetButton = useMemo(() => {
        let icon = <Image
            source={require('@assets/ic-ton-acc.png')}
            style={{ height: 46, width: 46 }}
        />;

        if (selectedAsset?.type === 'extraCurrency') {
            icon = <WImage
                src={extraCurrency?.preview?.image}
                style={{ height: 46, width: 46 }}
                height={46}
                width={46}
                borderRadius={23}
            />;
        }

        if (selectedAsset?.type === 'jetton' && jetton) {
            icon = <JettonIcon
                isTestnet={network.isTestnet}
                theme={theme}
                size={46}
                jetton={mapJettonToMasterState(jetton, network.isTestnet)}
                backgroundColor={theme.elevation}
                isSCAM={isSCAM}
            />;
        }

        return (
            <Pressable
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                onPress={onNavigateAssets}
            >
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <View style={{ flexDirection: 'row', flexShrink: 1, overflow: 'visible' }}>
                        <View style={{
                            height: 46, width: 46,
                            justifyContent: 'center', alignItems: 'center',
                            marginRight: 12
                        }}>
                            {icon}
                        </View>
                        <View style={{ justifyContent: isSCAM ? 'space-between' : 'center', flexShrink: 1 }}>
                            <Text
                                style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}
                                numberOfLines={2}
                                ellipsizeMode={'tail'}
                            >
                                {symbol}
                            </Text>
                            {isSCAM && (
                                <Text
                                    style={{ flexShrink: 1 }}
                                    numberOfLines={4}
                                    ellipsizeMode={'tail'}
                                >
                                    <Text
                                        style={[{ color: theme.accentRed }, Typography.regular15_20]}
                                        selectable={false}
                                    >
                                        {'SCAM'}
                                    </Text>
                                </Text>
                            )}
                        </View>
                    </View>
                    <IcChevron style={{ height: 12, width: 12 }} height={12} width={12} />
                </View>
            </Pressable>
        );
    }, [onNavigateAssets, network.isTestnet, jetton, symbol, isSCAM]);

    const decimals = selectedAsset?.type === 'extraCurrency' ? extraCurrency?.preview?.decimals : jetton?.decimals;

    const valueComponent = useMemo(() => (
        <View style={{
            flexDirection: 'row',
            marginBottom: 12,
            justifyContent: 'space-between'
        }}>
            <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                {`${t('common.balance')}: `}
                <ValueComponent
                    precision={4}
                    value={balance}
                    decimals={decimals}
                    suffix={symbol ? ` ${symbol}` : ''}
                />
            </Text>
            <Pressable
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                onPress={onAddAll}
            >
                <Text style={[{ color: theme.accent }, Typography.medium15_20]}>
                    {t('transfer.sendAll')}
                </Text>
            </Pressable>
        </View>
    ), [balance, jetton?.decimals, jetton?.symbol, onAddAll])

    const onFocus = useCallback(() => onInputFocus(1), [])

    const amountInput = useMemo(() => (
        <AmountInput
            index={1}
            ref={innerRef}
            onFocus={onFocus}
            value={amount}
            onValueChange={onValueChange}
            style={{
                backgroundColor: theme.elevation,
                paddingHorizontal: 16, paddingVertical: 14,
                borderRadius: 16
            }}
            inputStyle={[{
                color: amountError ? theme.accentRed : theme.textPrimary,
                flexGrow: 1
            }, Typography.regular17_24, { lineHeight: undefined }]}
            suffix={priceText}
            ticker={symbol || 'TON'}
            cursorColor={theme.accent}
        />
    ), [onInputFocus, onValueChange, amountError, priceText, symbol, amount])

    const amountErrorLabel = useMemo(() => amountError && (
        <Animated.View
            style={{ flexShrink: 1 }}
            entering={FadeIn}
            exiting={FadeOut.duration(100)}
        >
            <Text style={[{ color: theme.accentRed, flexShrink: 1 }, Typography.regular13_18]}>
                {amountError}
            </Text>
        </Animated.View>
    ), [amountError])

    const changeJettonButton = useMemo(() => shouldChangeJetton && (
        <Animated.View
            entering={FadeInUp} exiting={FadeOutDown}
            layout={LinearTransition.duration(200).easing(Easing.bezierFn(0.25, 0.1, 0.25, 1))}
        >
            <PressableChip
                text={t('transfer.changeJetton', { symbol: holdersTarget?.symbol })}
                style={{ backgroundColor: theme.accent }}
                textStyle={{ color: theme.textUnchangeable }}
                onPress={onChangeJetton}
            />
        </Animated.View>
    ), [shouldChangeJetton, holdersTarget?.symbol, onChangeJetton])

    return (
        <View
            style={{
                backgroundColor: theme.surfaceOnElevation,
                borderRadius: 20,
                justifyContent: 'center',
                padding: 20
            }}
        >
            {assetButton}
            <ItemDivider marginHorizontal={0} />
            {valueComponent}
            {amountInput}
            <View style={{
                flexDirection: 'row',
                marginTop: 8, gap: 4
            }}>
                {amountErrorLabel}
                {changeJettonButton}
            </View>
        </View>
    )
}))
