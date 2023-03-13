import { StatusBar } from "expo-status-bar";
import { Platform, View, Text } from "react-native";
import { CloseButton } from "../../components/CloseButton";
import { fragment } from "../../fragment";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import LottieView from 'lottie-react-native';
import { useLayoutEffect, useMemo, useRef } from "react";
import { t } from "../../i18n/t";
import { ScrollView } from "react-native-gesture-handler";
import { ItemGroup } from "../../components/ItemGroup";
import { useEngine } from "../../engine/Engine";
import { Address } from "ton";
import { RestrictedComponent } from "../../components/Lockup/RestrictedComponent";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AllowedAddresses } from "../../components/Lockup/AllowedAddresses";
import { AndroidToolbar } from "../../components/AndroidToolbar";

export const LockupRestrictedFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const { address } = useParams<{ address: string }>();
    const target = useMemo(() => Address.parse(address), []);
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
            <AndroidToolbar/>
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
                                    <AllowedAddresses wallet={walletState.wallet} />
                                </ItemGroup>
                                <RestrictedComponent
                                    address={target}
                                    lockup={walletState}
                                    withDate
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