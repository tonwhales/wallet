import { memo } from "react";
import { ThemeType } from "../../../engine/state/theme";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { Pressable, View, Image, Text } from "react-native";
import { Typography } from "../../styles";
import { PriceComponent } from "../../PriceComponent";
import { ValueComponent } from "../../ValueComponent";
import { ItemDivider } from "../../ItemDivider";
import { usePrice, useSolanaAccount } from "../../../engine/hooks";
import { t } from "../../../i18n/t";

import SolanaIcon from '@assets/ic-solana.svg';

export const SolanaWalletProduct = memo(({
    theme,
    address,
    divider,
    onSelect
}: {
    theme: ThemeType,
    address: string,
    divider?: 'top' | 'bottom',
    onSelect?: () => void
}) => {
    const navigation = useTypedNavigation();
    const account = useSolanaAccount(address);
    const [, , rates] = usePrice();

    const balance = account.data?.balance ?? 0n;
    const symbol = "SOL";
    const decimals = 9;

    const onPress = () => {
        if (onSelect) {
            onSelect();
        } else {
            navigation.navigateSolanaWallet({ owner: address });
        }
    };

    return (
        <Pressable
            style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.5 : 1 })}
            onPress={onPress}
        >
            {divider === 'top' && <ItemDivider marginVertical={0} />}
            <View style={[
                {
                    flexDirection: 'row', flexGrow: 1,
                    alignItems: 'center',
                    padding: 20,
                    backgroundColor: onSelect ? theme.surfaceOnElevation : theme.surfaceOnBg,
                    borderRadius: 20,
                    overflow: 'hidden'
                },
            ]}>
                <View style={{
                    width: 46, height: 46, borderRadius: 23,
                    borderWidth: 0,
                    backgroundColor: theme.backgroundPrimary,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <SolanaIcon
                        width={32}
                        height={32}
                        style={{
                            borderRadius: 16,
                            height: 32,
                            width: 32
                        }}
                    />
                </View>
                <View style={{ marginLeft: 12, flexShrink: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text
                            style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}
                            ellipsizeMode="tail"
                            numberOfLines={1}
                        >
                            {'Solana'}
                        </Text>
                        <Image
                            source={require('@assets/ic-verified.png')}
                            style={{ height: 20, width: 20 }}
                        />
                    </View>
                    <Text
                        numberOfLines={1}
                        ellipsizeMode={'tail'}
                        style={[{ color: theme.textSecondary }, Typography.regular15_20]}
                    >
                        {t('savings.general', { symbol })}
                    </Text>
                </View>
                {!onSelect && (
                    <View style={{ flexGrow: 1, alignItems: 'flex-end' }}>
                        <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                            <ValueComponent
                                value={balance}
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
                            amount={balance}
                            style={{
                                backgroundColor: 'transparent',
                                paddingHorizontal: 0, paddingVertical: 0,
                                alignSelf: 'flex-end',
                                height: undefined,
                            }}
                            textStyle={[{ color: theme.textSecondary }, Typography.regular15_20]}
                            theme={theme}
                            priceUSD={rates?.price?.usd}
                            hideCentsIfNull
                        />
                    </View>
                )}
            </View>
            {divider === 'bottom' && <ItemDivider marginVertical={0} />}
        </Pressable>
    );
});

SolanaWalletProduct.displayName = 'SolanaWalletProduct';
