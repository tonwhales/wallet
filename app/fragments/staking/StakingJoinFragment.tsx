import React, { useCallback, useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, Image, Pressable, Platform } from "react-native";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { RoundButton } from "../../components/RoundButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StakingPoolState } from "../../storage/cache";
import { AppConfig } from "../../AppConfig";
import { toNano } from "ton";
import { useAccount } from "../../sync/Engine";
import { useNavigation } from "@react-navigation/native";
import { Theme } from "../../Theme";
import CheckIcon from '../../../assets/ic_check.svg';
import { openLink } from "../../utils/InAppBrowser";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { fragment } from "../../fragment";
import { StakingTransferParams } from "./StakingTransferFragment";
import { CloseButton } from "../../components/CloseButton";
import { StatusBar } from "expo-status-bar";

export const StakingJoinFragment = fragment(() => {
    const { t } = useTranslation();
    const navigation = useTypedNavigation();
    const baseNavigation = useNavigation();
    const safeArea = useSafeAreaInsets();
    const [account, engine] = useAccount();
    const pool = engine.products.stakingPool.useState();
    const price = engine.products.price.useState();

    const onJoin = useCallback(() => {
        navigation.navigate(
            'StakingTransfer',
            {
                target: pool?.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                comment: 'Deposit',
                amount: pool?.minStake.add(toNano('0.2')),
                lockAddress: true,
                lockComment: true,
                action: 'deposit',
                navigateToStakingAfter: true
            } as StakingTransferParams
        );
    }, []);

    const openMoreInfo = useCallback(
        () => {
            openLink(AppConfig.isTestnet ? 'https://test.tonwhales.com/staking' : 'https://tonwhales.com/staking');
        },
        [],
    );

    useLayoutEffect(() => {
        baseNavigation.setOptions({
            title: t('products.staking.title'),
            headerStyle: {
                backgroundColor: Theme.background
            },
            headerRight: () => (
                <Pressable onPress={openMoreInfo} style={({ pressed }) => {
                    return {
                        opacity: pressed ? 0.3 : 1,
                    }
                }}>
                    <Text
                        style={{
                            color: Theme.accent,
                            fontSize: 17, fontWeight: '600'
                        }}
                    >
                        {t('products.staking.moreInfo')}
                    </Text>
                </Pressable>
            )
        })
    }, []);

    return (
        <View style={{
            flex: 1,
            backgroundColor: Theme.background,
        }}>
            <AndroidToolbar
                style={{ marginTop: safeArea.top }}
                pageTitle={t('products.staking.title')}
            />
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            {Platform.OS === 'ios' && (
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
            )}
            <View style={{ flexGrow: 1, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ flex: 1, flexGrow: 1 }} />
                <Image source={require('../../../assets/ic_staking.png')} />
                <View style={{
                    marginTop: 19
                }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <Text style={{
                            fontSize: 30,
                            fontWeight: '800',
                            lineHeight: 41,
                            letterSpacing: -0.5,
                            color: Theme.textColor,
                            textAlign: 'right',
                        }}>
                            {t('products.staking.join.earn') + ' '}
                        </Text>
                        <View style={{
                            borderRadius: 6,
                            overflow: 'hidden',
                            backgroundColor: '#4DC47D',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: 41,
                            paddingHorizontal: 4,
                            marginLeft: 2
                        }}>
                            <Text style={{
                                color: 'white',
                                fontSize: 30,
                                fontWeight: '800',
                                letterSpacing: -0.5,
                            }}>

                                {t('products.staking.join.apy')}
                            </Text>
                        </View>
                    </View>
                    <Text style={{
                        fontSize: 30,
                        fontWeight: '800',
                        lineHeight: 41,
                        letterSpacing: -0.5,
                        color: Theme.textColor,
                        textAlign: 'center',
                    }}>
                        {' ' + t('products.staking.join.onYourTons')}
                    </Text>
                </View>

                <View style={{
                    marginTop: 30,
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    width: '100%',
                    paddingHorizontal: 14
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
                        <CheckIcon height={20} width={20} color={'#4DC47D'} />
                        <Text style={{
                            fontWeight: '400',
                            fontSize: 16,
                            lineHeight: 19,
                            marginLeft: 10
                        }}>
                            {t('products.staking.join.cycle')}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
                        <CheckIcon height={20} width={20} color={'#4DC47D'} />
                        <Text style={{
                            fontWeight: '400',
                            fontSize: 16,
                            lineHeight: 19,
                            marginLeft: 10
                        }}>
                            {t('products.staking.join.ownership')}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
                        <CheckIcon height={20} width={20} color={'#4DC47D'} />
                        <Text style={{
                            fontWeight: '400',
                            fontSize: 16,
                            lineHeight: 19,
                            marginLeft: 10
                        }}>
                            {t('products.staking.join.withdraw')}
                        </Text>
                    </View>
                </View>
                <View style={{ flex: 1, flexGrow: 1 }} />
                <View style={{
                    width: '100%'
                }}>
                    <RoundButton
                        title={t('products.staking.moreInfo')}
                        onPress={openMoreInfo}
                        style={{ alignSelf: 'stretch', marginBottom: 14 }}
                        display={'secondary'}
                    />
                    <RoundButton
                        title={t('products.staking.join.buttonTitle')}
                        onPress={onJoin}
                        style={{ alignSelf: 'stretch', marginBottom: 22 + safeArea.bottom, }}
                    />
                </View>
            </View>
            {
                Platform.OS === 'ios' && (
                    <CloseButton
                        style={{ position: 'absolute', top: 12, right: 10 }}
                        onPress={() => {
                            navigation.goBack();
                        }}
                    />
                )
            }
        </View>
    );
})