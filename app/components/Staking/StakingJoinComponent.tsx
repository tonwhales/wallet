import React, { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Platform, View, Text, Pressable, Linking } from "react-native";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { CloseButton } from "../CloseButton";
import LottieView from 'lottie-react-native';
import { RoundButton } from "../RoundButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "../../Theme";
import { TouchableOpacity } from "react-native-gesture-handler";
import { StakingPoolState } from "../../storage/cache";
import { AppConfig } from "../../AppConfig";

export const StakingJoinComponent = React.memo((props: {
    pool: StakingPoolState
}) => {
    const { t } = useTranslation();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();

    const animRef = React.useRef<LottieView>(null);

    useEffect(() => {
        setTimeout(() => {
            if (Platform.OS) {
                animRef.current?.play();
            }
        }, 1000);
    }, [animRef.current]);

    const onJoin = useCallback(() => {
        navigation.navigate(
            'Transfer',
            {
                target: props.pool.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                comment: 'Deposit',
                amount: props.pool.minStake,
                lockAddress: true,
                lockComment: true,
                staking: {
                    minAmount: props.pool.minStake,
                    action: 'deposit'
                }
            }
        )
    }, []);

    return (
        <View style={{ flexGrow: 1, paddingHorizontal: 16 }}>
            {Platform.OS === 'ios' && (
                <View style={{
                    paddingTop: 12,
                    paddingBottom: 17
                }}>
                    <Text style={[{
                        textAlign: 'center', fontWeight: '600',
                        fontSize: 17
                    }]}>{t('products.stake.title')}</Text>
                </View>
            )}
            <View style={{ flex: 1, flexGrow: 1 }} />
            <View style={{ alignSelf: 'center' }}>
                <LottieView
                    ref={animRef}
                    source={require('../../../assets/animations/whale.json')}
                    autoPlay={true}
                    loop={true}
                    style={{ width: 140, height: 140 }}
                />
            </View>
            <View style={{ flex: 1, flexGrow: 1 }} />
            <View
                style={{
                    backgroundColor: AppConfig.isTestnet ? 'rgba(243,162,3, 0.8)' : 'rgba(71,169,241, 0.8)',
                    borderRadius: 14,
                    padding: 16,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                <Text style={{
                    textAlign: 'center',
                    color: 'white',
                    marginBottom: 12,
                    fontSize: 18,
                    fontWeight: '600'
                }}>
                    {t('products.stake.join.title')}
                </Text>
                <Text style={{
                    textAlign: 'center',
                    marginBottom: 12,
                    fontSize: 60,
                }}>
                    {'💎'}
                </Text>
                <Text style={{
                    textAlign: 'center',
                    color: 'white',
                    fontSize: 14
                }}>
                    {t('products.stake.join.message')}
                </Text>

                <TouchableOpacity
                    activeOpacity={0.6}
                    onPress={() => {
                        Linking.openURL(
                            AppConfig.isTestnet
                                ? 'https://test.tonwhales.com/staking'
                                : 'https://tonwhales.com/staking'
                        )
                    }}
                    style={{
                        height: 28,
                        // backgroundColor: AppConfig.isTestnet ? 'rgb(71,169,241)' : 'rgb(243,162,3)',
                        marginTop: 8,
                        padding: 4,
                        borderRadius: 4,
                        alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <Text style={{
                        textAlign: 'center',
                        color: 'white',
                        fontSize: 16,
                    }}>
                        <Text style={{ color: 'white', fontWeight: '800' }}>
                            {t('products.stake.join.moreAbout')}
                        </Text>
                    </Text>

                </TouchableOpacity>
            </View>
            <View style={{ flex: 1, flexGrow: 1 }} />
            <RoundButton
                title={t('products.stake.join.buttonTitle')}
                onPress={onJoin}
                style={{ alignSelf: 'stretch', marginBottom: 16 + safeArea.bottom, marginTop: 30 }}
            />
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