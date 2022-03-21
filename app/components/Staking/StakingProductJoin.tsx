import React from "react"
import { View, Text } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler"
import { Theme } from "../../Theme";
import { useTypedNavigation } from "../../utils/useTypedNavigation"
import OldWalletIcon from '../../../assets/ic_old_wallet.svg';
import { useTranslation } from "react-i18next";
import { ValueComponent } from "../ValueComponent";
import { useAccount } from "../../sync/Engine";
import { StakingPoolState } from "../../storage/cache";
import { AppConfig } from "../../AppConfig";
import { fromNano } from "ton";
import { BN } from "bn.js";

export const StakingProductJoin = React.memo(({ pool }: { pool: StakingPoolState }) => {
    const navigation = useTypedNavigation();
    const { t } = useTranslation();
    const [account, engine] = useAccount();
    const price = engine.products.price.useState();

    return (
        <TouchableHighlight
            onPress={() => navigation.navigate('Staking')}
            underlayColor={Theme.selector}
            style={{
                alignSelf: 'stretch', borderRadius: 14,
                backgroundColor: 'white',
                marginHorizontal: 16, marginVertical: 16,
            }}
        >
            <View style={{
                padding: 10
            }}>
                <View style={{ alignSelf: 'stretch', flexDirection: 'row' }}>
                    <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 0, marginRight: 10 }}>
                        <View style={{ backgroundColor: Theme.accent, borderRadius: 21, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
                            <OldWalletIcon width={29} height={29} color={'white'} />
                        </View>
                    </View>
                    <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0, }}>
                        <Text style={{ color: Theme.textColor, fontSize: 16, flexGrow: 1, flexBasis: 0, marginRight: 16, fontWeight: '600' }} ellipsizeMode="tail" numberOfLines={1}>
                            {t('products.staking.title')}
                        </Text>
                        <View style={{ flexDirection: 'column', alignItems: 'baseline', flexGrow: 1, flexBasis: 0, }}>
                            <Text style={{ color: '#8E979D', fontSize: 13, flexGrow: 1, flexBasis: 0, marginTop: 4 }} ellipsizeMode="tail">
                                {t("products.staking.subtitle.join")}
                                {!account.balance.gt(pool.minStake.add(new BN(0.2)))
                                    ? " " + t("products.staking.subtitle.apy")
                                    : undefined
                                }
                                {account.balance.gt(pool.minStake.add(new BN(0.2))) && (
                                    <Text style={{ color: '#8E979D', fontSize: 13 }} ellipsizeMode="tail">
                                        {'. '}
                                        {t("products.staking.subtitle.rewards")}
                                        <Text style={{ color: '#4FAE42', fontWeight: '600', fontSize: 16 }}>
                                            {' (~'}
                                            <ValueComponent
                                                value={account.balance.muln(0.133)}
                                                centFontStyle={{ fontSize: 14, fontWeight: '500', opacity: 0.8 }}
                                                centLength={3}
                                            />
                                            {price && !AppConfig.isTestnet && (
                                                <Text style={{
                                                    fontSize: 16
                                                }}>
                                                    {`/ $ ${(parseFloat(fromNano(account.balance.muln(0.133))) * price.price.usd)
                                                        .toFixed(2)
                                                        .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')}`
                                                    }
                                                </Text>
                                            )}
                                            {')'}
                                        </Text>
                                    </Text>
                                )}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableHighlight>
    )
})