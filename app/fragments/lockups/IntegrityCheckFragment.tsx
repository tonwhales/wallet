import { View, Text, Platform } from "react-native";
import { fragment } from "../../fragment";
import LottieView from 'lottie-react-native';
import { useLayoutEffect, useRef } from "react";
import { t } from "../../i18n/t";
import { ItemGroup } from "../../components/ItemGroup";
import { ItemLarge } from "../../components/ItemLarge";
import { Theme } from "../../Theme";
import { useParams } from "../../utils/useParams";
import { ItemDivider } from "../../components/ItemDivider";
import { ItemButton } from "../../components/ItemButton";
import Chevron from '../../../assets/ic_ios_chevron_right.svg';
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { openWithInApp } from "../../utils/openWithInApp";
import { AppConfig } from "../../AppConfig";
import { CloseButton } from "../../components/CloseButton";

export const IntegrityCheckFragment = fragment(() => {
    const { address } = useParams<{ address: string }>();
    const anim = useRef<LottieView>(null);
    const navigation = useTypedNavigation();

    useLayoutEffect(() => {
        setTimeout(() => {
            anim.current?.play();
        }, 300);
    }, []);

    return (
        <View style={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={{
                justifyContent: 'center', alignItems: 'center',
                paddingHorizontal: 16
            }}>
                <View style={{
                    justifyContent: 'center', alignItems: 'center',
                    paddingHorizontal: 48
                }}>
                    <LottieView
                        ref={anim}
                        source={require('../../../assets/animations/success.json')}
                        style={{ width: 120, height: 120 }}
                        autoPlay={false}
                        loop={false}
                    />
                    <Text style={{
                        fontWeight: '700',
                        fontSize: 24,
                        textAlign: 'center'
                    }}>
                        {t('products.lockups.integrityCheckSuccess')}
                    </Text>
                    <Text style={{
                        fontWeight: '400',
                        fontSize: 16,
                        textAlign: 'center',
                        marginTop: 10
                    }}>
                        {t('products.lockups.integrityCheckSuccessDescription')}
                    </Text>
                </View>
                <ItemGroup style={{ width: '100%', paddingTop: 14, marginTop: 30 }}>
                    <View style={{ flexDirection: 'column', paddingHorizontal: 16, alignItems: 'flex-start' }}>
                        <Text style={{
                            fontSize: 16, fontWeight: '600', color: Theme.textColor,
                        }}>
                            {t('products.lockups.contractCodeHash')}
                        </Text>
                        <Text style={{
                            fontSize: 13, fontWeight: '400',
                            marginTop: 6, color: Theme.textSecondary,
                            marginBottom: 14
                        }}>
                            {'iPv4GOR9XzKPfcNLrUMjuyihLsbHXOnsJdd3RsVuHe0='}
                        </Text>
                    </View>
                    <ItemDivider />
                    <ItemButton
                        title={t('products.lockups.checkInExplorer')}
                        rightIcon={{
                            icon: Chevron,
                            color: '#000000',
                            height: 12,
                            width: 7,
                            style: { marginLeft: 16 }
                        }}
                        textColor={Theme.accent}
                        fontWeight={'500'}
                        onPress={() => openWithInApp(AppConfig.isTestnet ? `https://test.tonwhales.com/explorer/address/${address}/code` : `https://tonwhales.com/explorer/address/${address}/code`)}
                    />
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
        </View>
    );
})