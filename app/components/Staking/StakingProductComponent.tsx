import React, { useMemo } from "react";
import { BN } from "bn.js";
import { useEngine } from "../../engine/Engine";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { TouchableHighlight, View, Text, useWindowDimensions } from "react-native";
import StakingIcon from '../../../assets/ic_staking.svg';
import { PriceComponent } from "../PriceComponent";
import { t } from "../../i18n/t";
import { ValueComponent } from "../ValueComponent";
import { useAppConfig } from "../../utils/AppConfigContext";

export const StakingProductComponent = React.memo(() => {
    const { Theme, AppConfig } = useAppConfig();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const staking = engine.products.whalesStakingPools.useStaking();
    const showJoin = staking.total.eq(new BN(0));

    const apy = engine.products.whalesStakingPools.useStakingApy()?.apy;
    const apyWithFee = useMemo(() => {
        if (!!apy) {
            return (apy - apy * (5 / 100)).toFixed(2)
        }
    }, [apy]);

    const dimentions = useWindowDimensions();
    const fontScaleNormal = dimentions.fontScale <= 1;

    if (!showJoin) return (
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
                            <Text style={{ color: Theme.textColor, fontSize: 16, marginRight: 16, fontWeight: '600' }} ellipsizeMode="tail" numberOfLines={1}>
                                {t('products.staking.title')}
                            </Text>
                            <Text style={{
                                fontWeight: '400',
                                fontSize: 16,
                                color: staking.total && staking.total.gt(new BN(0))
                                    ? Theme.pricePositive
                                    : Theme.textColor
                            }}>
                                <ValueComponent
                                    value={staking.total}
                                    precision={3}
                                />
                            </Text>
                        </View>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                        }}>
                            <Text style={{ color: Theme.price, fontSize: 13, fontWeight: '400' }} ellipsizeMode="tail">
                                {t("products.staking.subtitle.joined", { apy: apyWithFee ?? '8' })}
                            </Text>
                            <PriceComponent
                                amount={staking.total}
                                style={{
                                    backgroundColor: Theme.transparent,
                                    paddingHorizontal: 0, paddingVertical: 0,
                                    alignSelf: 'flex-end',
                                    marginTop: 2, height: undefined,
                                    minHeight: fontScaleNormal ? 14 : undefined
                                }}
                                textStyle={{ color: Theme.textSubtitle, fontWeight: '400', fontSize: 12 }}
                            />
                        </View>
                    </View>
                </View>
            </View>
        </TouchableHighlight>
    );

    return (
        <TouchableHighlight
            onPress={() => navigation.navigate('StakingPools')}
            underlayColor={Theme.selector}
            style={{
                alignSelf: 'stretch', borderRadius: 14,
                backgroundColor: Theme.item,
                marginHorizontal: 16, marginVertical: 4,
            }}
        >
            <View style={{
                padding: 10
            }}>
                <View style={{ alignSelf: 'stretch', flexDirection: 'row' }}>
                    <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 0, marginRight: 10, alignSelf: 'center' }}>
                        <View style={{ backgroundColor: Theme.success, borderRadius: 21, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
                            <StakingIcon width={42} height={42} color={'white'} />
                        </View>
                    </View>
                    <View style={{
                        flexDirection: 'row',
                        flexGrow: 1,
                        paddingVertical: 2,
                        justifyContent: 'space-between',
                    }}>
                        <View>
                            <Text style={{
                                color: Theme.textColor, fontSize: 16,
                                marginRight: 16, fontWeight: '600',
                                marginBottom: 3
                            }}
                                ellipsizeMode="tail"
                                numberOfLines={1}
                            >
                                {t('products.staking.title')}
                            </Text>
                            <Text style={{
                                color: Theme.price, fontSize: 13,
                                fontWeight: '400',
                            }}
                                ellipsizeMode="tail"
                            >
                                {AppConfig.isTestnet ? t('products.staking.subtitle.devPromo') : t("products.staking.subtitle.join", { apy: apyWithFee ?? '8' })}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableHighlight>
    );
})