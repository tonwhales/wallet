import BN from "bn.js";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { useTranslation } from "react-i18next";
import { Platform, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { CloseButton } from "../../components/CloseButton";
import { fragment } from "../../fragment";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import CheckIcon from '../../../assets/ic_check.svg';
import { Theme } from "../../Theme";
import { fromNano, toNano } from "ton";
import { useAccount } from "../../sync/Engine";
import { RoundButton } from "../../components/RoundButton";

export const StakingJoinSuccessFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const { t } = useTranslation();
    const safeArea = useSafeAreaInsets();
    const params = useParams<{ amount?: BN | null }>();
    const [account, engine] = useAccount();
    const price = engine.products.price.useState();

    return (
        <View style={{ flexGrow: 1 }}>
            <AndroidToolbar
                style={{ marginTop: safeArea.top }}
                pageTitle={t('products.staking.title')}
                backRoute={'Home'}
            />
            <StatusBar style={Platform.OS === 'ios' ? "light" : 'dark'} />
            {
                Platform.OS === 'ios' && (
                    <View style={{
                        paddingTop: 12,
                        paddingBottom: 17
                    }}>
                        <Text style={{
                            textAlign: 'center',
                            fontWeight: '600',
                            fontSize: 17,
                            lineHeight: 32
                        }}>
                            {t('products.staking.title')}
                        </Text>
                    </View>
                )
            }
            <View style={{ flexGrow: 1 }} />
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                <CheckIcon height={56} width={56} color={'#4DC47D'} />
                {!!params.amount && (
                    <Text style={{
                        fontWeight: '800',
                        fontSize: 30,
                        color: Theme.textColor,
                        textAlign: 'center',
                        marginTop: 10,
                    }}>
                        {t('products.staking.join.successTitle', { amount: fromNano(params.amount) })}
                    </Text>
                )}
                <Text style={{
                    fontWeight: '400',
                    fontSize: 16,
                    color: Theme.textColor,
                    textAlign: 'center',
                    maxWidth: 260,
                    marginTop: 18,
                }}>
                    {t('products.staking.join.successNote')}
                </Text>
                {!!params.amount && !!price && (
                    <Text style={{
                        fontWeight: '400',
                        fontSize: 16,
                        color: Theme.textColor,
                        textAlign: 'center',
                        maxWidth: 260,
                        marginTop: 18,
                    }}>
                        {t('products.staking.join.successEtimation',
                            {
                                amount: fromNano(params.amount),
                                price: parseFloat(fromNano(params.amount.muln(price.price.usd))).toFixed(3)
                            }
                        )}
                    </Text>
                )}
            </View>
            <View style={{ flexGrow: 1 }} />
            <View style={{ height: 64, marginHorizontal: 16, marginTop: 16, marginBottom: safeArea.bottom, alignSelf: 'stretch' }}>
                <RoundButton title={t('common.done')} onPress={() => {
                    navigation.popToTop();
                    setTimeout(() => navigation.navigate('Staking', {
                        backToHome: true
                    }), 200);
                }} />
            </View>
            {
                Platform.OS === 'ios' && (
                    <CloseButton
                        style={{ position: 'absolute', top: 12, right: 10 }}
                        onPress={() => {
                            navigation.popToTop();
                            setTimeout(() => navigation.navigate('Staking', {
                                backToHome: true
                            }), 200);
                        }}
                    />
                )
            }
        </View>
    );
})