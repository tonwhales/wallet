import { memo, useCallback } from "react";
import { ThemeType } from "../../../engine/state/theme";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { Pressable, View, Image, Text } from "react-native";
import { Typography } from "../../styles";
import { PriceComponent } from "../../PriceComponent";
import { ValueComponent } from "../../ValueComponent";
import { ItemDivider } from "../../ItemDivider";
import { useBounceableWalletFormat, useSelectedAccount } from "../../../engine/hooks";
import { t } from "../../../i18n/t";
import { SolanaAddress } from "../../../utils/solana/core";

import SolanaIcon from '@assets/ic-solana.svg';

// Mock Solana wallet hook - this would need to be implemented
const useSolanaWallet = (address: SolanaAddress) => {
    return {
        balance: 10000000000n,
        nanoBalance: 10000000000n,
        address: address,
        priceUSD: 144.44
    };
};

export const SolanaWalletProduct = memo(({
    theme,
    isLedger,
    address,
    testOnly,
    divider,
    assetCallback
}: {
    theme: ThemeType,
    isLedger?: boolean,
    address: SolanaAddress,
    testOnly: boolean,
    divider?: 'top' | 'bottom',
    assetCallback?: (asset: any) => void
}) => {
    const navigation = useTypedNavigation();
    const solanaWallet = useSolanaWallet(address);
    const [bounceableFormat] = useBounceableWalletFormat();
    const selectedAccount = useSelectedAccount();
    
    // Placeholder values - would come from the actual Solana wallet integration
    const balance = solanaWallet?.balance ?? 0n;
    const symbol = "SOL";
    const decimals = 9;
    
    const onPress = useCallback(async () => {
        if (!!assetCallback && solanaWallet?.address) {
            assetCallback({
                address,
                content: {
                    icon: require('@assets/ic-solana.svg'),
                    name: "Solana",
                }
            });
            return;
        }

        const hasWallet = !!solanaWallet;

        console.log('hasWallet', hasWallet);

        const privateKey = selectedAccount?.secretKeyEnc;

        if (!hasWallet && !privateKey) {
            return;
        }

        if (hasWallet) {
            navigation.navigateSolanaWallet({
                owner: address,
                isLedger
            });
            return;
        }

        // navigation.navigateReceive({
        //     asset: solanaWallet ? {
        //         address: address, // Use TON address as a placeholder
        //         content: {
        //             icon: require('@assets/ic-solana.svg'),
        //             name: "Solana",
        //         }
        //     } : undefined,
        //     addr: address.toString({ bounceable: isLedger ? false : bounceableFormat, testOnly })
        // }, isLedger);
    }, [assetCallback, solanaWallet, isLedger, navigation, address, bounceableFormat, testOnly]);

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
                    backgroundColor: theme.surfaceOnBg,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <SolanaIcon
                        width={46}
                        height={46}
                        style={{
                            borderRadius: 23,
                            height: 46,
                            width: 46
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
                            amount={solanaWallet?.nanoBalance ?? 0n}
                            style={{
                                backgroundColor: 'transparent',
                                paddingHorizontal: 0, paddingVertical: 0,
                                alignSelf: 'flex-end',
                                height: undefined,
                            }}
                            textStyle={[{ color: theme.textSecondary }, Typography.regular15_20]}
                            theme={theme}
                            priceUSD={solanaWallet?.priceUSD ?? 0}
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
