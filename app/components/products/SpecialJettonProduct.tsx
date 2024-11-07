import { memo, useCallback, useEffect } from "react";
import { ThemeType } from "../../engine/state/theme";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { Pressable, View, Image, Text } from "react-native";
import { Typography } from "../styles";
import { PriceComponent } from "../PriceComponent";
import { ValueComponent } from "../ValueComponent";
import { Address } from "@ton/core";
import { useSpecialJetton } from "../../engine/hooks/jettons/useSpecialJetton";
import { WImage } from "../WImage";
import { ItemDivider } from "../ItemDivider";
import { useBounceableWalletFormat } from "../../engine/hooks";

export const SpecialJettonProduct = memo(({
    theme,
    isLedger,
    address,
    testOnly,
    divider
}: {
    theme: ThemeType,
    isLedger?: boolean,
    address: Address,
    testOnly: boolean,
    divider?: 'top' | 'bottom'
}) => {
    const navigation = useTypedNavigation();
    const specialJetton = useSpecialJetton(address);
    const balance = specialJetton?.balance ?? 0n;
    const [bounceableFormat] = useBounceableWalletFormat();
    const ledgerAddressStr = address.toString({ bounceable: bounceableFormat, testOnly });

    const onPress = useCallback(() => {
        const jetton = specialJetton
            ? { master: specialJetton.master, data: specialJetton.masterContent }
            : undefined;
        const hasWallet = !!specialJetton?.wallet;

        if (isLedger) {
            if (!hasWallet || balance === 0n) {
                navigation.navigate('LedgerReceive', { addr: ledgerAddressStr, ledger: true, jetton });
                return;
            }

            // TODO: implement LedgerJettonWallet
            const tx = {
                amount: null,
                target: null,
                comment: null,
                jetton: specialJetton.wallet,
                stateInit: null,
                job: null,
                callback: null
            }

            navigation.navigateLedgerTransfer(tx);
            return;
        }

        if (hasWallet) {
            navigation.navigateJettonWallet({
                owner: address.toString({ bounceable: bounceableFormat, testOnly }),
                master: specialJetton.master.toString({ testOnly }),
                wallet: specialJetton.wallet?.toString({ testOnly })
            });

            return;
        }

        navigation.navigateReceive({ jetton });
    }, [specialJetton, isLedger, ledgerAddressStr, navigation]);

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
                    backgroundColor: theme.ton,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <WImage
                        requireSource={require('@assets/known/ic-usdt.png')}
                        width={46}
                        height={46}
                        borderRadius={23}
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
                    <Text
                        style={{ color: theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
                        ellipsizeMode="tail"
                        numberOfLines={1}
                    >
                        {'USDT'}
                    </Text>
                    <Text
                        numberOfLines={1}
                        ellipsizeMode={'tail'}
                        style={{ fontSize: 15, fontWeight: '400', lineHeight: 20, color: theme.textSecondary }}
                    >
                        {specialJetton?.description ?? 'Tether Token for Tether USD'}
                    </Text>
                </View>
                <View style={{ flexGrow: 1, alignItems: 'flex-end' }}>
                    <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                        <ValueComponent
                            value={balance}
                            precision={2}
                            decimals={specialJetton?.decimals ?? 6}
                            centFontStyle={{ color: theme.textSecondary }}
                        />
                        <Text
                            style={{ color: theme.textSecondary, fontSize: 15 }}>
                            {` ${specialJetton?.symbol ?? 'USDT'}`}
                        </Text>
                    </Text>
                    <PriceComponent
                        amount={specialJetton?.nano ?? 0n}
                        style={{
                            backgroundColor: 'transparent',
                            paddingHorizontal: 0, paddingVertical: 0,
                            alignSelf: 'flex-end',
                            height: undefined,
                        }}
                        textStyle={[{ color: theme.textSecondary }, Typography.regular15_20]}
                        theme={theme}
                        priceUSD={1}
                        hideCentsIfNull
                    />
                </View>
            </View>
            {divider === 'bottom' && <ItemDivider marginVertical={0} />}
        </Pressable>
    );
});