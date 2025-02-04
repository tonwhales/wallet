import { memo, useCallback, useMemo } from "react";
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
import { useBounceableWalletFormat, useJettonContent } from "../../engine/hooks";
import { useGaslessConfig } from "../../engine/hooks/jettons/useGaslessConfig";
import { useWalletVersion } from "../../engine/hooks/useWalletVersion";
import { GaslessInfoButton } from "../jettons/GaslessInfoButton";
import { ReceiveableAsset } from "../../fragments/wallet/ReceiveFragment";
import { t } from "../../i18n/t";

export const SpecialJettonProduct = memo(({
    theme,
    isLedger,
    address,
    testOnly,
    divider,
    assetCallback
}: {
    theme: ThemeType,
    isLedger?: boolean,
    address: Address,
    testOnly: boolean,
    divider?: 'top' | 'bottom',
    assetCallback?: (asset: ReceiveableAsset | null) => void
}) => {
    const navigation = useTypedNavigation();
    const specialJetton = useSpecialJetton(address);
    const masterContent = useJettonContent(specialJetton?.master.toString({ testOnly }));
    const balance = specialJetton?.balance ?? 0n;
    const [bounceableFormat] = useBounceableWalletFormat();
    const ledgerAddressStr = address.toString({ bounceable: bounceableFormat, testOnly });
    const gaslessConfig = useGaslessConfig().data;
    const walletVersion = useWalletVersion(address);

    const isGassless = useMemo(() => {
        if (walletVersion !== 'v5R1') {
            return false;
        }

        if (!gaslessConfig) {
            return false;
        }

        return gaslessConfig.gas_jettons.find((j) => {
            try {
                return specialJetton?.master?.equals(Address.parse(j.master_id));
            } catch (error) {
                return false;
            }
        }) !== undefined;
    }, [gaslessConfig?.gas_jettons, walletVersion, specialJetton?.master]);

    const onPress = useCallback(() => {

        if (!!assetCallback && specialJetton?.master) {
            assetCallback({
                address: specialJetton?.master,
                content: {
                    icon: masterContent?.originalImage,
                    name: masterContent?.name,
                }
            });
            return;
        }

        const hasWallet = !!specialJetton?.wallet;

        if (isLedger) {
            if (!hasWallet) {
                navigation.navigate(
                    'LedgerReceive',
                    {
                        addr: ledgerAddressStr,
                        ledger: true, asset: specialJetton ? {
                            address: specialJetton.master,
                            content: {
                                icon: masterContent?.originalImage,
                                name: masterContent?.name,
                            }
                        } : undefined
                    });
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

            navigation.navigateSimpleTransfer(tx, { ledger: true });
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

        navigation.navigateReceive({
            asset: specialJetton ? {
                address: specialJetton.master,
                content: {
                    icon: masterContent?.originalImage,
                    name: masterContent?.name,
                }
            } : undefined
        });
    }, [assetCallback, specialJetton, isLedger, ledgerAddressStr, navigation, masterContent]);

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
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text
                            style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}
                            ellipsizeMode="tail"
                            numberOfLines={1}
                        >
                            {'USDT'}
                        </Text>
                        {(isGassless && !assetCallback) && (<GaslessInfoButton />)}
                    </View>
                    <Text
                        numberOfLines={1}
                        ellipsizeMode={'tail'}
                        style={[{ color: theme.textSecondary }, Typography.regular15_20]}
                    >
                        {t('savings.usdt')}
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
                )}
            </View>
            {divider === 'bottom' && <ItemDivider marginVertical={0} />}
        </Pressable>
    );
});