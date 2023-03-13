import { View, Text, Platform, Pressable, Image } from "react-native";
import { fragment } from "../../fragment";
import LottieView from 'lottie-react-native';
import { useLayoutEffect, useMemo, useRef } from "react";
import { t } from "../../i18n/t";
import { ItemGroup } from "../../components/ItemGroup";
import { Theme } from "../../Theme";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { CloseButton } from "../../components/CloseButton";
import { ValueComponent } from "../../components/ValueComponent";
import { PriceComponent } from "../../components/PriceComponent";
import { Address } from "ton";
import { useEngine } from "../../engine/Engine";
import BN from "bn.js";
import { ScrollView } from "react-native-gesture-handler";
import { getCurrentAddress } from "../../storage/appState";
import { AppConfig } from "../../AppConfig";
import { ItemDivider } from "../../components/ItemDivider";

export const LiquidBalanceFragment = fragment(() => {
    const { address } = useParams<{ address: string }>();
    const engine = useEngine()
    const myAddress = useMemo(() => getCurrentAddress(), []);
    const friendly = myAddress.address.toFriendly({ testOnly: AppConfig.isTestnet });
    const target = useMemo(() => Address.parse(address), []);
    const walletState = engine.products.lockup.useLockupWallet(target);
    const anim = useRef<LottieView>(null);
    const navigation = useTypedNavigation();

    const liquid = useMemo(() => {
        let balance = new BN(0);
        if (!walletState?.balance) {
            return balance;
        }

        balance = balance.add(walletState.balance);

        if (walletState.wallet?.locked) {
            Array.from(walletState.wallet.locked).forEach(([key, value]) => {
                const until = parseInt(key);
                if (until <= Date.now() / 1000) {
                    balance = balance.add(new BN(value));
                }
            });
        }

        if (walletState.wallet?.restricted) {
            Array.from(walletState.wallet.restricted).forEach(([key, value]) => {
                const until = parseInt(key);
                if (until <= Date.now() / 1000) {
                    balance = balance.add(new BN(value));
                }
            });
        }

        return balance;
    }, [walletState]);

    useLayoutEffect(() => {
        setTimeout(() => {
            anim.current?.play();
        }, 300);
    }, []);

    return (
        <View style={{ flexGrow: 1, justifyContent: 'center' }}>
            <ScrollView>

                <View style={{
                    justifyContent: 'center', alignItems: 'center',
                    paddingHorizontal: 16, marginTop: 70,
                }}>
                    <View style={{
                        justifyContent: 'center', alignItems: 'center',
                        paddingHorizontal: 48
                    }}>
                        <LottieView
                            ref={anim}
                            source={require('../../../assets/animations/liquid.json')}
                            style={{ width: 120, height: 120 }}
                            autoPlay={false}
                            loop={false}
                        />
                        <Text style={{
                            fontWeight: '700',
                            fontSize: 24,
                            textAlign: 'center'
                        }}>
                            {t('products.lockups.liquidBalance')}
                        </Text>
                        <Text style={{
                            fontWeight: '400',
                            fontSize: 16,
                            textAlign: 'center',
                            marginTop: 10
                        }}>
                            {t('products.lockups.liquidBalanceDescription')}
                        </Text>
                    </View>
                    <ItemGroup style={{ width: '100%', paddingTop: 14, marginTop: 30 }}>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            marginBottom: 7, marginLeft: 6,
                            paddingHorizontal: 10,
                        }}>
                            <View style={{
                                flexDirection: 'column',
                                paddingVertical: 2,
                                justifyContent: 'space-between'
                            }}>
                                <Text style={{
                                    fontWeight: '600',
                                    fontSize: 16,
                                    color: Theme.textColor
                                }}>
                                    {t('common.balance')}
                                </Text>

                                <Text style={{
                                    fontWeight: '400',
                                    fontSize: 12,
                                    color: Theme.textSecondary
                                }}>
                                    {t('products.lockups.liquidBalanceSubtitle')}
                                </Text>
                            </View>
                            <View style={{
                                flexDirection: 'column',
                                paddingVertical: 2,
                            }}>
                                <Text style={{
                                    fontWeight: '400',
                                    fontSize: 16,
                                    color: Theme.textColor
                                }}>
                                    <ValueComponent
                                        value={liquid}
                                        precision={3}
                                    />
                                    {' TON'}
                                </Text>
                                <PriceComponent
                                    amount={liquid}
                                    style={{
                                        backgroundColor: 'transparent',
                                        paddingHorizontal: 0, paddingVertical: 0,
                                        alignSelf: 'flex-end',
                                        marginTop: 2, height: undefined,
                                        minHeight: 14
                                    }}
                                    textStyle={{ color: '#8E979D', fontWeight: '400', fontSize: 12 }}
                                />
                            </View>
                        </View>
                    </ItemGroup>

                </View>
                <View style={{ width: '100%' }}>
                    <Text
                        style={{
                            fontSize: 18,
                            fontWeight: '700',
                            marginTop: 30,
                            marginBottom: 8,
                            marginHorizontal: 16
                        }}
                    >
                        {`${t('common.send')} TON`}
                    </Text>
                    <ItemGroup style={{ marginHorizontal: 16 }}>
                        <Pressable
                            style={({ pressed }) => {
                                return { opacity: pressed ? 0.3 : 1 }
                            }}
                            onPress={() => {
                                // TODO: navigate to transfer with payload
                            }}
                        >
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center', justifyContent: 'space-between',
                                paddingHorizontal: 16
                            }}>
                                <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <View style={{ height: 30, flexDirection: 'row' }}>
                                        <Text style={{
                                            fontSize: 16, fontWeight: '500',
                                            color: Theme.textColor,
                                            alignSelf: 'center',
                                            flexGrow: 1
                                        }}>
                                            {t('products.lockups.sendToMyWallet')}
                                        </Text>
                                    </View>
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center', justifyContent: 'center',
                                        paddingBottom: 14
                                    }}>
                                        <Text
                                            style={[
                                                {
                                                    fontSize: 12,
                                                    fontWeight: '400',
                                                    color: Theme.textSecondary,
                                                },
                                            ]}
                                            selectable={false}
                                            numberOfLines={1}
                                        >
                                            {friendly.slice(0, 8)
                                                + '...'
                                                + friendly.slice(friendly.length - 6)}
                                        </Text>
                                    </View>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <View style={{
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        borderRadius: 14
                                    }}>
                                        <View style={{
                                            backgroundColor: Theme.accent,
                                            width: 30, height: 30,
                                            borderRadius: 15,
                                            alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Image source={require('../../../assets/ic_send.png')} />
                                        </View>
                                        <Text style={{
                                            fontSize: 13,
                                            color: Theme.accentText,
                                            marginTop: 4,
                                            fontWeight: '400'
                                        }}>
                                            {t('wallet.actions.send')}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </Pressable>
                        <ItemDivider />
                        <Pressable
                            style={({ pressed }) => {
                                return { opacity: pressed ? 0.3 : 1 }
                            }}
                            onPress={() => {
                                // TODO: navigate to transfer with payload
                            }}
                        >
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center', justifyContent: 'space-between',
                                paddingHorizontal: 16
                            }}>
                                <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <View style={{ height: 30, flexDirection: 'row' }}>
                                        <Text style={{
                                            fontSize: 16, fontWeight: '500',
                                            color: Theme.textColor,
                                            alignSelf: 'center', flexGrow: 1
                                        }}>
                                            {t('products.lockups.sendToOtherWallet')}
                                        </Text>
                                    </View>
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center', justifyContent: 'center',
                                        paddingBottom: 14
                                    }}>
                                        <Text
                                            style={[
                                                {
                                                    fontSize: 12,
                                                    fontWeight: '400',
                                                    color: Theme.textSecondary,
                                                },
                                            ]}
                                            selectable={false}
                                            numberOfLines={1}
                                        >
                                            {t('products.lockups.sendToOtherWalletDescription')}
                                        </Text>
                                    </View>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <View style={{
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        borderRadius: 14
                                    }}>
                                        <View style={{
                                            backgroundColor: Theme.accent,
                                            width: 30, height: 30,
                                            borderRadius: 15,
                                            alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Image source={require('../../../assets/ic_send.png')} />
                                        </View>
                                        <Text style={{
                                            fontSize: 13,
                                            color: Theme.accentText,
                                            marginTop: 4,
                                            fontWeight: '400'
                                        }}>
                                            {t('wallet.actions.send')}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </Pressable>
                    </ItemGroup>
                </View>
                {Platform.OS === 'ios' && (
                    <CloseButton
                        style={{ position: 'absolute', top: 12, right: 10 }}
                        onPress={() => {
                            navigation.goBack();
                        }}
                    />
                )}
            </ScrollView>
        </View>
    );
})