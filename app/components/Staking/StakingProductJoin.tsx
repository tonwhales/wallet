import React from "react"
import { View, Text, ActivityIndicator } from "react-native";
import { TouchableHighlight } from "react-native"
import { Theme } from "../../Theme";
import { useTypedNavigation } from "../../utils/useTypedNavigation"
import StakingIcon from '../../../assets/ic_staking.svg';
import { AppConfig } from "../../AppConfig";
import { t } from "../../i18n/t";

export const StakingProductJoin = React.memo(({ loading }: { loading?: boolean }) => {
    const navigation = useTypedNavigation();
    return (
        <TouchableHighlight
            onPress={() => navigation.navigate('Staking')}
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
                                color: '#787F83', fontSize: 13,
                                fontWeight: '400',
                            }}
                                ellipsizeMode="tail"
                            >
                                {AppConfig.isTestnet ? t('products.staking.subtitle.devPromo') : t("products.staking.subtitle.join")}
                            </Text>
                        </View>
                        {loading && (<ActivityIndicator size={'small'} />)}
                    </View>
                </View>
            </View>
        </TouchableHighlight>
    )
})