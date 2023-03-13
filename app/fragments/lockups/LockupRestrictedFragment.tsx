import { StatusBar } from "expo-status-bar";
import { Platform, View, Text, Image } from "react-native";
import { CloseButton } from "../../components/CloseButton";
import { fragment } from "../../fragment";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import LottieView from 'lottie-react-native';
import { useLayoutEffect, useMemo, useRef } from "react";
import { t } from "../../i18n/t";
import { ScrollView } from "react-native-gesture-handler";
import { ItemGroup } from "../../components/ItemGroup";
import { ItemDivider } from "../../components/ItemDivider";
import { useEngine } from "../../engine/Engine";
import { Address } from "ton";
import { ItemAddress } from "../../components/ItemAddress";
import { RestrictedComponent } from "../../components/Lockup/RestrictedComponent";
import { AppConfig } from "../../AppConfig";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "../../Theme";

export const LockupRestrictedFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const { address } = useParams<{ address: string }>();
    const target = Address.parse(address);
    const walletState = engine.products.lockup.useLockupWallet(target);
    const anim = useRef<LottieView>(null);
    const safeArea = useSafeAreaInsets();

    useLayoutEffect(() => {
        setTimeout(() => {
            anim.current?.play();
        }, 300);
    }, []);

    return (
        <View style={{ flexGrow: 1, flex: 1 }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <View style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', flexDirection: 'column' }}>
                <ScrollView>
                    <View style={{
                        justifyContent: 'center', alignItems: 'center',
                        marginTop: 70, paddingHorizontal: 16
                    }}>
                        <LottieView
                            ref={anim}
                            source={require('../../../assets/animations/lock_key.json')}
                            style={{ width: 120, height: 120 }}
                            autoPlay={false}
                            loop={false}
                        />
                        <Text style={{
                            fontWeight: '700',
                            fontSize: 24,
                            textAlign: 'center'
                        }}>
                            {t('products.lockups.restrictedBalance')}
                        </Text>
                        <Text style={{
                            fontWeight: '400',
                            fontSize: 16,
                            textAlign: 'center',
                            marginTop: 10
                        }}>
                            {t('products.lockups.restrictedBalanceDescription')}
                        </Text>
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
                            {t('products.lockups.allowedWallets')}
                        </Text>
                        {!!walletState && !!walletState.wallet && (
                            <>
                                <ItemGroup style={{ marginHorizontal: 16 }}>
                                    {walletState.wallet?.allowedDestinations.map((owner, index) => {
                                        return (
                                            <View key={`wallet-${index}`}>
                                                <ItemAddress
                                                    title={t('common.walletAddress')}
                                                    text={owner.toFriendly({ testOnly: AppConfig.isTestnet })}
                                                    rightAction={
                                                        <View style={{ flexGrow: 1, alignItems: 'flex-end' }}>
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
                                                    }
                                                />
                                                {index < (walletState?.wallet?.allowedDestinations.length ?? 0) - 1 && (
                                                    <ItemDivider />
                                                )}
                                            </View>
                                        );
                                    })}
                                </ItemGroup>
                                <RestrictedComponent
                                    address={target}
                                    lockup={walletState}
                                />
                            </>
                        )}
                    </View>
                    <View style={{ height: safeArea.bottom }} />
                </ScrollView>
            </View>

            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={() => {
                        navigation.goBack();
                    }}
                />
            )}
        </View>
    );
})