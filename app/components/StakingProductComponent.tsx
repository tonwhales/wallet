import React from "react";
import { useTranslation } from "react-i18next";
import { AppConfig } from "../AppConfig";
import { ProductButton } from "../fragments/wallet/products/ProductButton";
import { getCurrentAddress } from "../storage/appState";
import { useAccount } from "../sync/Engine";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import OldWalletIcon from '../../assets/ic_old_wallet.svg';
import { Theme } from "../Theme";
import { fromNano } from "ton";
import { TouchableHighlight } from "react-native-gesture-handler";
import { View, Text } from "react-native";
import { ValueComponent } from "./ValueComponent";
import BN from "bn.js";

export const StakingProductComponent = React.memo(() => {
    const { t } = useTranslation();
    const [account, engine] = useAccount();
    const address = React.useMemo(() => getCurrentAddress().address, []);
    const pool = engine.products.stakingPool.useState();
    const navigation = useTypedNavigation();

    if (!pool) {
        return <></>;
    }

    const member = pool
        .members
        .find((m) => {
            return m.address
                .toFriendly({ testOnly: AppConfig.isTestnet }) === address
                    .toFriendly({ testOnly: AppConfig.isTestnet })
        });

    console.log({ member })

    return (
        // <ProductButton
        //     name={t('products.stake.title')}
        //     subtitle={member
        //         ? parseFloat(fromNano(member.withdraw)) > 0
        //             ? `${t('products.stake.withdrawStatus.ready')}: ${fromNano(member.withdraw)}`
        //             : parseFloat(fromNano(member.pendingWithdraw)) > 0
        //                 ? `${t('products.stake.withdrawStatus.pending')}: ${fromNano(member.pendingWithdraw)}`
        //                 : undefined
        //         : t("products.stake.subtitle.join")}
        //     icon={OldWalletIcon}
        //     value={member?.balance}
        //     graph={
        //         member
        //             ? {
        //                 full: member.balance
        //                     .add(member.pendingDeposit)
        //                     .add(member.withdraw),
        //                 values: [
        //                     {
        //                         amount: member.balance,
        //                         color: '#47A9F1'
        //                     },
        //                     {
        //                         amount: member.pendingDeposit,
        //                         color: '#F3A203'
        //                     },
        //                     {
        //                         amount: member.withdraw,
        //                         color: '#4FAE42'
        //                     },
        //                 ]
        //             }
        //             : undefined
        //     }
        //     onPress={() => navigation.navigate('Staking')}
        // />
        <TouchableHighlight
            onPress={() => navigation.navigate('Staking')}
            underlayColor={Theme.selector}
            style={{
                alignSelf: 'stretch', borderRadius: 14,
                backgroundColor: 'white',
                marginHorizontal: 16, marginVertical: 16
            }}
        >
            <View style={{ alignSelf: 'stretch', flexDirection: 'row' }}>
                <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 0, marginVertical: 10, marginLeft: 10, marginRight: 10 }}>
                    <View style={{ backgroundColor: Theme.accent, borderRadius: 21, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
                        <OldWalletIcon width={29} height={29} color={'white'} />
                    </View>
                </View>
                <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0 }}>
                    <View style={{ flexGrow: 1 }} />
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 10, marginRight: 10 }}>
                        <Text style={{ color: Theme.textColor, fontSize: 16, flexGrow: 1, flexBasis: 0, marginRight: 16, fontWeight: '600' }} ellipsizeMode="tail" numberOfLines={1}>
                            {t('products.stake.title')}
                        </Text>
                        {member && (
                            <Text style={{ color: member.balance.gte(new BN(0)) ? '#4FAE42' : 'grey', fontWeight: '600', fontSize: 16, marginRight: 2 }}>
                                <ValueComponent
                                    value={member.balance}
                                    centFontStyle={{ fontSize: 14, fontWeight: '500', opacity: 0.8 }}
                                />
                            </Text>
                        )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginRight: 10 }}>
                        <Text style={{ color: '#8E979D', fontSize: 13, flexGrow: 1, flexBasis: 0, marginRight: 16, marginTop: 4 }} ellipsizeMode="tail" numberOfLines={1}>
                            {member
                                ? parseFloat(fromNano(member.withdraw)) > 0
                                    ? `${t('products.stake.withdrawStatus.ready')}: ${fromNano(member.withdraw)}`
                                    : parseFloat(fromNano(member.pendingWithdraw)) > 0
                                        ? `${t('products.stake.withdrawStatus.pending')}: ${fromNano(member.pendingWithdraw)}`
                                        : undefined
                                : t("products.stake.subtitle.join")
                            }
                        </Text>
                    </View>
                    <View style={{ flexGrow: 1 }} />
                </View>
            </View>
        </TouchableHighlight>
    )
})