import { memo, useCallback } from "react";
import { ThemeType } from "../../../engine/state/theme";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { Pressable, View, Image, Text } from "react-native";
import { Typography } from "../../styles";
import { PriceComponent } from "../../PriceComponent";
import { ValueComponent } from "../../ValueComponent";
import { ItemDivider } from "../../ItemDivider";
import { useBounceableWalletFormat, useSolanaAccount } from "../../../engine/hooks";
import { SolanaAddress } from "../../../utils/solana/core";

import SolanaIcon from '@assets/ic-solana.svg';

export const SolanaWalletProduct = memo(({
    theme,
    address,
    testOnly,
    divider,
    assetCallback
}: {
    theme: ThemeType,
    address: SolanaAddress,
    testOnly: boolean,
    divider?: 'top' | 'bottom',
    assetCallback?: (asset: any) => void
}) => {
    const navigation = useTypedNavigation();
    const [bounceableFormat] = useBounceableWalletFormat();
    const account = useSolanaAccount(address);

    // Placeholder values - would come from the actual Solana wallet integration
    const balance = account.data?.lamports ?? 0n;
    const symbol = "SOL";
    const decimals = 9;

    const onPress = useCallback(async () => {
        if (!!assetCallback) {
            assetCallback({
                address,
                content: {
                    icon: require('@assets/ic-solana.svg'),
                    name: "Solana",
                }
            });
            return;
        }

        navigation.navigateSolanaWallet({ owner: address });
    }, [assetCallback, navigation, address, bounceableFormat, testOnly]);

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
                    backgroundColor: theme.surfaceOnBg,
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
                    </View>
                    <Text
                        numberOfLines={1}
                        ellipsizeMode={'tail'}
                        style={[{ color: theme.textSecondary }, Typography.regular15_20]}
                    >
                        {'Solana Wallet'}
                    </Text>
                </View>
                {!!assetCallback ? (
                    <View style={{ flexGrow: 1, alignItems: 'flex-end', marginLeft: 8 }}>
                        <Image
                            source={require('@assets/ic-chevron-right.png')}
                            style={{ height: 16, width: 16, tintColor: theme.iconPrimary }}
                        />
                    </View>
                ) : (
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
                            priceUSD={144}
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
