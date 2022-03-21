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
import { fromNano, toNano } from "ton";
import { useAccount } from "../../sync/Engine";
import { ValueComponent } from "../ValueComponent";
import { PoolInfo } from "./PoolInfo";

export const StakingJoinComponent = React.memo((props: {
    pool: StakingPoolState
}) => {
    const { t } = useTranslation();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const [account, engine] = useAccount();
    const price = engine.products.price.useState();

    const onJoin = useCallback(() => {
        navigation.navigate(
            'Transfer',
            {
                target: props.pool.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                comment: 'Deposit',
                amount: props.pool.minStake.add(toNano('0.2')),
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
            <Text style={{
                textAlign: 'center',
                color: Theme.textColor,
                marginBottom: 12,
                fontSize: 30,
                fontWeight: '700',
                marginTop: 24
            }}>
                {t('products.staking.join.title')}
            </Text>
            <Text style={{
                textAlign: 'center',
                color: Theme.textSecondary,
                fontSize: 16
            }}>
                {t('products.staking.join.message')}
            </Text>
            <View style={{
                backgroundColor: 'white',
                padding: 16,
                borderRadius: 14,
                marginTop: 64
            }}>
                <Text style={{
                    textAlign: 'center',
                    color: Theme.textColor,
                    fontSize: 18,
                    fontWeight: '600',
                    marginBottom: 16
                }}>
                    {t('products.staking.subtitle.join')}
                </Text>
                <PoolInfo pool={props.pool} />
                {account.balance.gtn(0) && (
                    <>
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginVertical: 8 }} />
                        <View style={{
                            flexDirection: 'row', justifyContent: 'space-between',
                            alignItems: 'flex-end', width: '100%',
                            marginRight: 10,
                            flexWrap: 'wrap'
                        }}>
                            <Text style={{ color: Theme.textColor, fontSize: 16 }} ellipsizeMode="tail">
                                {t("products.staking.subtitle.rewards")}
                            </Text>
                            <Text style={{ color: '#4FAE42', fontWeight: '600', fontSize: 20, marginTop: 4 }}>
                                {'~'}
                                <ValueComponent
                                    value={account.balance.muln(0.133)}
                                    centFontStyle={{ fontSize: 16, fontWeight: '500', opacity: 0.8 }}
                                    centLength={3}
                                />
                                {price && !AppConfig.isTestnet && (
                                    <Text style={{
                                        fontSize: 16
                                    }}>
                                        {` ($ ${(parseFloat(fromNano(account.balance.muln(0.133))) * price.price.usd)
                                            .toFixed(2)
                                            .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')})`
                                        }
                                    </Text>
                                )}
                            </Text>
                        </View>
                    </>
                )}
            </View>
            <View style={{ flex: 1, flexGrow: 1 }} />
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
                    marginTop: 8,
                    padding: 4,
                    borderRadius: 4,
                    alignItems: 'center', justifyContent: 'center',
                }}
            >
                <Text style={{
                    textAlign: 'center',
                    color: Theme.accent,
                    fontSize: 16,
                    fontWeight: '800'
                }}>
                    {t('products.staking.join.moreAbout')}
                </Text>
            </TouchableOpacity>
            <RoundButton
                title={t('products.staking.join.buttonTitle')}
                onPress={onJoin}
                style={{ alignSelf: 'stretch', marginBottom: 16 + safeArea.bottom, marginTop: 30 }}
            />
        </View>
    );
})