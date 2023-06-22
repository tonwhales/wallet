import React, { useMemo } from "react";
import { BN } from "bn.js";
import { useEngine } from "../../engine/Engine";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { TouchableHighlight, View, Text, useWindowDimensions, StyleProp, ViewStyle, TextStyle } from "react-native";
import { PriceComponent } from "../PriceComponent";
import { t } from "../../i18n/t";
import { ValueComponent } from "../ValueComponent";
import { useAppConfig } from "../../utils/AppConfigContext";

import StakingIcon from '../../../assets/ic-staking.svg';
import { ProductBanner } from "./ProductBanner";

const style: StyleProp<ViewStyle> = {
    height: 84,
    borderRadius: 20,
    marginBottom: 16, marginVertical: 4,
    backgroundColor: '#F7F8F9',
    padding: 20
}

const icStyle: StyleProp<ViewStyle> = {
    width: 46, height: 46,
    marginRight: 12
}

const icStyleInner: StyleProp<ViewStyle> = {
    width: 46, height: 46,
    borderRadius: 23,
    alignItems: 'center', justifyContent: 'center'
}

const titleStyle: StyleProp<TextStyle> = {
    fontSize: 17, fontWeight: '600',
    lineHeight: 24
}

const subtitleStyle: StyleProp<TextStyle> = {
    fontSize: 15, fontWeight: '400',
    lineHeight: 20
}

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
            style={style}
        >
            <View style={{ alignSelf: 'stretch', flexDirection: 'row' }}>
                <View style={icStyle}>
                    <View style={{ backgroundColor: Theme.success, ...icStyleInner }}>
                        <StakingIcon width={32} height={32} color={'white'} />
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
                            style={{ color: Theme.textColor, ...titleStyle }}
                            ellipsizeMode={'tail'}
                            numberOfLines={1}
                        >
                            {t('products.staking.title')}
                        </Text>
                        <Text style={{ color: Theme.textColor, ...titleStyle }}>
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
        </TouchableHighlight>
    );

    return (
        <ProductBanner
            onPress={() => navigation.navigate('StakingPools')}
            title={t('products.staking.title')}
            subtitle={AppConfig.isTestnet ? t('products.staking.subtitle.devPromo') : t("products.staking.subtitle.join", { apy: apyWithFee ?? '8' })}
            illustration={require('../../../assets/banner-staking.png')}
        />
    );
})