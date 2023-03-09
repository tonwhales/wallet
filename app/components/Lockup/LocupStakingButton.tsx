import React, { useMemo } from "react";
import { TouchableHighlight, useWindowDimensions, Text, View } from "react-native";
import { Address } from "ton";
import { useEngine } from "../../engine/Engine";
import { t } from "../../i18n/t";
import { Theme } from "../../Theme";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import StakingIcon from '../../../assets/ic_staking.svg';
import { PriceComponent } from "../PriceComponent";
import { ValueComponent } from "../ValueComponent";
import BN from "bn.js";
import { AppConfig } from "../../AppConfig";

export const LocupStakingButton = React.memo(({ address }: { address: Address }) => {
    const engine = useEngine();
    const navigation = useTypedNavigation();
    console.log('lockup staking button', { address: address.toFriendly({ testOnly: AppConfig.isTestnet }) })
    const staking = engine.products.whalesStakingPools.useStaking(address);;

    const apy = engine.products.whalesStakingPools.useStakingApy()?.apy;
    const apyWithFee = useMemo(() => {
        if (!!apy) {
            return (apy - apy * (5 / 100)).toFixed(2)
        }
    }, [apy]);

    const dimentions = useWindowDimensions();
    const fontScaleNormal = dimentions.fontScale <= 1;

    return (
        <TouchableHighlight
            onPress={() => navigation.navigate('StakingPools')}
            underlayColor={Theme.selector}
            style={{
                alignSelf: 'stretch', borderRadius: 14,
                backgroundColor: Theme.item,
                marginHorizontal: 16, marginVertical: 4
            }}
        >
            <View style={{
                padding: 10
            }}>
                <View style={{ alignSelf: 'stretch', flexDirection: 'row' }}>
                    <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 0, marginRight: 10 }}>
                        <View style={{ backgroundColor: Theme.success, borderRadius: 21, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
                            <StakingIcon width={42} height={42} color={'white'} />
                        </View>
                    </View>
                    <View style={{
                        flexDirection: 'column',
                        flexGrow: 1,
                        paddingVertical: 2,
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            marginBottom: 3
                        }}>
                            <Text
                                style={{ color: Theme.textColor, fontSize: 16, marginRight: 16, fontWeight: '600' }}
                                ellipsizeMode="tail" numberOfLines={1}
                            >
                                {t('products.staking.title')}
                            </Text>
                            <Text style={{
                                fontWeight: '400',
                                fontSize: 16,
                                color: staking.total && staking.total.gt(new BN(0))
                                    ? '#4FAE42'
                                    : Theme.textColor
                            }}>
                                <ValueComponent
                                    value={staking.total}
                                    precision={3}
                                />
                                {' TON'}
                            </Text>
                        </View>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                        }}>
                            <Text
                                style={{ color: '#787F83', fontSize: 13, fontWeight: '400' }}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {t("products.lockups.stakingProductTitle")}
                            </Text>
                            <PriceComponent
                                amount={staking.total}
                                style={{
                                    backgroundColor: 'transparent',
                                    paddingHorizontal: 0, paddingVertical: 0,
                                    alignSelf: 'flex-end',
                                    marginTop: 2, height: undefined,
                                    minHeight: fontScaleNormal ? 14 : undefined
                                }}
                                textStyle={{ color: '#8E979D', fontWeight: '400', fontSize: 12 }}
                            />
                        </View>
                    </View>
                </View>
            </View>
        </TouchableHighlight>
    )
});