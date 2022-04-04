import React from "react"
import { View, Text } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler"
import { Theme } from "../../Theme";
import { useTypedNavigation } from "../../utils/useTypedNavigation"
import StakingIcon from '../../../assets/ic_staking.svg';
import { useTranslation } from "react-i18next";
import { useAccount } from "../../sync/Engine";
import { StakingPoolState } from "../../storage/cache";

export const StakingProductJoin = React.memo(({ pool }: { pool: StakingPoolState }) => {
    const navigation = useTypedNavigation();
    const { t } = useTranslation();
    const [account, engine] = useAccount();
    const price = engine.products.price.useState();

    return (
        <TouchableHighlight
            onPress={() => navigation.navigate('StakingJoin')}
            underlayColor={Theme.selector}
            style={{
                alignSelf: 'stretch', borderRadius: 14,
                backgroundColor: 'white',
                marginHorizontal: 16, marginVertical: 4,
            }}
        >
            <View style={{
                padding: 10
            }}>
                <View style={{ alignSelf: 'stretch', flexDirection: 'row' }}>
                    <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 0, marginRight: 10 }}>
                        <View style={{ backgroundColor: '#4DC47D', borderRadius: 21, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
                            <StakingIcon width={42} height={42} color={'white'} />
                        </View>
                    </View>
                    <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0, }}>
                        <Text style={{
                            color: Theme.textColor, fontSize: 16,
                            flexGrow: 1, flexBasis: 0,
                            marginRight: 16, fontWeight: '600'
                        }}
                            ellipsizeMode="tail"
                            numberOfLines={1}
                        >
                            {t('products.staking.title')}
                        </Text>
                        <Text style={{
                            color: '#787F83', fontSize: 13,
                            marginTop: 3, fontWeight: '400'
                        }}
                            ellipsizeMode="tail"
                        >
                            {t("products.staking.subtitle.join")}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableHighlight>
    )
})