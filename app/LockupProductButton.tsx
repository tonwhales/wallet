import BN from "bn.js";
import React from "react"
import { TouchableHighlight, View, Text, useWindowDimensions } from "react-native"
import { Address } from "ton";
import { AppConfig } from "./AppConfig";
import { PriceComponent } from "./components/PriceComponent";
import { ValueComponent } from "./components/ValueComponent";
import { t } from "./i18n/t";
import { Theme } from "./Theme"
import { useTypedNavigation } from "./utils/useTypedNavigation";
import TonSign from '../assets/ic_ton_sign.svg';
import LockupMark from '../assets/ic_lock_mark.svg';

export const LockupProductButton = React.memo(({ address, value }: { address: Address, value: BN }) => {
    const dimentions = useWindowDimensions();
    const fontScaleNormal = dimentions.fontScale <= 1;
    const navigation = useTypedNavigation();
    const friendly = address.toFriendly({ testOnly: AppConfig.isTestnet });

    return (
        <TouchableHighlight
            onPress={() => {
                navigation.navigate('LockupWallet', { address: address.toFriendly({ testOnly: AppConfig.isTestnet }) });
            }}
            underlayColor={Theme.selector}
            style={[
                {
                    alignSelf: 'stretch', borderRadius: 14,
                    backgroundColor: Theme.item,
                    marginHorizontal: 16, marginVertical: 8
                },
            ]}
        >
            <View style={{ alignSelf: 'stretch', flexDirection: 'row', minHeight: fontScaleNormal ? undefined : 62 }}>
                <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 0, marginVertical: 10, marginLeft: 10, marginRight: 10 }}>
                    <View style={{ backgroundColor: Theme.accent, borderRadius: 21, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
                        <TonSign width={16} height={16} color={'white'} />
                    </View>
                    <LockupMark
                        style={{
                            position: 'absolute', bottom: -1, right: -1
                        }}
                        height={16}
                        width={16}
                    />
                </View>
                <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0 }}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginTop: 10,
                        marginRight: 10
                    }}>
                        <Text style={{ color: Theme.textColor, fontSize: 16, marginRight: 16, fontWeight: '600', flexShrink: 1 }} ellipsizeMode="tail" numberOfLines={fontScaleNormal ? 1 : 2}>
                            {t('products.lockups.totalBalance')}
                        </Text>
                        <Text style={{ color: value.gte(new BN(0)) ? '#4FAE42' : '#FF0000', fontWeight: '400', fontSize: 16, marginRight: 2, alignSelf: 'flex-start' }}>
                            <ValueComponent value={value} />
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginRight: 10, marginBottom: 10, }}>
                        <Text
                            style={{ color: '#8E979D', fontSize: 13, flexShrink: 1, paddingRight: 16, marginTop: 4 }}
                            ellipsizeMode="tail"
                            numberOfLines={1}
                        >
                            <Text style={{ flexShrink: 1 }}>
                                {friendly.slice(0, 6) + '...' + friendly.slice(friendly.length - 8)}
                            </Text>
                        </Text>
                        <PriceComponent
                            amount={value}
                            style={{
                                backgroundColor: 'transparent',
                                paddingHorizontal: 0, paddingVertical: 0,
                                alignSelf: 'flex-end',
                                marginTop: 2, height: 14
                            }}
                            textStyle={{ color: '#8E979D', fontWeight: '400', fontSize: 12 }}
                        />
                    </View>
                    <View style={{ flexGrow: 1 }} />
                </View>
            </View>
        </TouchableHighlight>
    )
})