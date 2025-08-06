import { memo } from "react";
import { Pressable, View, Text } from "react-native";
import { Image } from "expo-image";
import { ThemeType } from "../../../engine/state/theme";
import { ReceiveableTonAsset } from "../../../fragments/wallet/ReceiveFragment";
import { ASSET_ITEM_HEIGHT } from "../../../utils/constants";
import { Typography } from "../../styles";
import { GaslessInfoButton } from "../../jettons/GaslessInfoButton";
import { PriceComponent } from "../../PriceComponent";
import { ValueComponent } from "../../ValueComponent";
import { ChainIcon } from "./ChainIcon";
import { CoinIcon } from "./CoinIcon";
import { Currency } from "../../../engine/types/deposit";

interface CoinItemProps {
    theme: ThemeType;
    balance?: bigint | string;
    currency?: Currency;
    decimals?: number;
    symbol?: string;
    priceNano?: bigint;
    isGassless?: boolean;
    assetCallback?: (asset: ReceiveableTonAsset | null) => void;
    divider?: 'top' | 'bottom';
    onPress?: () => void;
    name: string;
    description: string;
    blockchain?: string;
    tag?: string;
    imageUrl?: string | null
    isPressable?: boolean
    withArrow?: boolean
    priceUSD?: number
}

export const Tag = memo(({ tag, theme }: { tag: string, theme: ThemeType }) => {
    return (
        <View style={{
            justifyContent: 'center', alignItems: 'center',
            borderRadius: 10,
            marginLeft: 6,
            paddingHorizontal: 6,
            paddingVertical: 1,
            backgroundColor: theme.divider
        }}>
            <Text style={{ ...Typography.regular13_18, color: theme.textSecondary }}>{tag}</Text>
        </View>
    );
});

export const CoinItem = memo(({
    theme,
    balance,
    currency,
    symbol,
    decimals,
    priceNano,
    isGassless,
    assetCallback,
    onPress,
    name,
    description,
    blockchain,
    tag,
    imageUrl,
    isPressable = true,
    withArrow,
    priceUSD,
}: CoinItemProps) => {
    return (
        <Pressable
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
            onPress={onPress}
            disabled={!isPressable}
        >
            <View style={[
                {
                    flexDirection: 'row', flexGrow: 1,
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    minHeight: ASSET_ITEM_HEIGHT,
                    backgroundColor: theme.surfaceOnBg,
                    borderRadius: 20,
                    overflow: 'hidden',
                    gap: 12
                },
            ]}>
                <View style={{
                    width: 46, height: 46, borderRadius: 23,
                    borderWidth: 0,
                    backgroundColor: theme.white,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <CoinIcon type={currency} url={imageUrl} />
                    {blockchain && (
                        <View style={{
                            justifyContent: 'center', alignItems: 'center',
                            height: 21, width: 21, borderRadius: 10,
                            position: 'absolute', right: -3, bottom: -3,
                        }}>
                            <ChainIcon blockchain={blockchain} size={21} />
                        </View>
                    )}
                </View>
                <View style={{ flexShrink: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Text
                            style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}
                            ellipsizeMode="tail"
                            numberOfLines={1}
                        >
                            {name}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {(isGassless && !assetCallback) && (<GaslessInfoButton />)}
                            {tag ? <Tag tag={tag} theme={theme} /> : <Image
                                source={require('@assets/ic-verified.png')}
                                style={{ height: 20, width: 20 }}
                            />}
                        </View>
                    </View>
                    <Text
                        numberOfLines={1}
                        ellipsizeMode={'tail'}
                        style={[{ color: theme.textSecondary }, Typography.regular15_20]}
                    >
                        {description}
                    </Text>
                </View>
                {withArrow ? (
                    <View style={{ flexGrow: 1, alignItems: 'flex-end', marginLeft: 8 }}>
                        <Image
                            source={require('@assets/ic-chevron-right.png')}
                            style={{ height: 16, width: 16, tintColor: theme.iconPrimary }}
                        />
                    </View>
                ) : (
                    <>
                        {isPressable && (<View style={{ flexGrow: 1, alignItems: 'flex-end' }}>
                            <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                <ValueComponent
                                    value={balance ?? 0n}
                                    precision={2}
                                    decimals={decimals}
                                    centFontStyle={{ color: theme.textSecondary }}
                                />
                                <Text
                                    style={{ color: theme.textSecondary, fontSize: 15 }}>
                                    {` ${symbol}`}
                                </Text>
                            </Text>
                            <PriceComponent
                                amount={priceNano ?? 0n}
                                style={{
                                    backgroundColor: 'transparent',
                                    paddingHorizontal: 0, paddingVertical: 0,
                                    alignSelf: 'flex-end',
                                    height: undefined,
                                }}
                                textStyle={[{ color: theme.textSecondary }, Typography.regular15_20]}
                                theme={theme}
                                priceUSD={priceUSD}
                                hideCentsIfNull
                            />
                        </View>
                        )}
                    </>
                )}
            </View>
        </Pressable>
    );
});