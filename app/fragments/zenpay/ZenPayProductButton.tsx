import { Canvas, LinearGradient, Rect, vec } from "@shopify/react-native-skia";
import React, { useCallback } from "react";
import { TouchableHighlight, View, Text, useWindowDimensions, Image } from "react-native";
import { PriceComponent } from "../../components/PriceComponent";
import { ValueComponent } from "../../components/ValueComponent";
import { ZenPayCard } from "../../engine/corp/ZenPayProduct";
import { t } from "../../i18n/t";
import { Theme } from "../../Theme";
import { useTypedNavigation } from "../../utils/useTypedNavigation";

export const ZenPayProductButton = React.memo(({ card }: { card?: ZenPayCard }) => {
    const dimentions = useWindowDimensions();
    const navigation = useTypedNavigation();
    const fontScaleNormal = dimentions.fontScale <= 1;

    const onPress = useCallback(
        () => {
            navigation.navigateZenPay(card ? { type: 'card', id: card.id } : { type: 'account' });
        },
        [card],
    );

    return (
        <TouchableHighlight
            onPress={onPress}
            underlayColor={Theme.selector}
            style={{
                alignSelf: 'stretch', borderRadius: 14,
                backgroundColor: Theme.item,
                marginHorizontal: 16, marginVertical: 4
            }}
        >
            <View style={{ alignSelf: 'stretch', flexDirection: 'row', minHeight: fontScaleNormal ? undefined : 62 }}>
                <View style={{ width: 34, height: 46, borderRadius: 6, borderWidth: 0, marginVertical: 8, marginLeft: 14, marginRight: 14, overflow: 'hidden' }}>
                    <Canvas style={{ width: 34, height: 46, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                        <Rect x={0} y={0} width={34} height={46}>
                            <LinearGradient
                                start={vec(0, 0)}
                                end={vec(34, 46)}
                                colors={card ? ['#EA7509', '#E9A904'] : ['#333A5A', "#A7AFD3"]}
                            />
                        </Rect>
                    </Canvas>
                    {!!card?.card.lastFourDigits && (
                        <Text style={{ color: 'white', fontSize: 10, marginHorizontal: 4, marginTop: 2 }} numberOfLines={2}>
                            {card.card.lastFourDigits}
                        </Text>
                    )}
                    {!card && (
                        <Image source={require('../../../assets/ic_eu.png')} style={{ position: 'absolute', bottom: 4, right: 4 }} />
                    )}
                    {card && card.type === 'virtual' && (
                        <Image source={require('../../../assets/ic_virtual_card.png')} style={{ position: 'absolute', bottom: 4, right: 4 }} />
                    )}
                    {card && card.type === 'physical' && (
                        <Image source={require('../../../assets/ic_visa_card.png')} style={{ position: 'absolute', bottom: 4, right: 4 }} />
                    )}
                </View>
                {!!card && (
                    <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 10, marginRight: 10 }}>
                            <Text style={{ color: Theme.textColor, fontSize: 16, marginRight: 16, fontWeight: '600', flexShrink: 1 }} ellipsizeMode="tail" numberOfLines={fontScaleNormal ? 1 : 2}>
                                {t('products.zenPay.card.defaultTitle')}
                            </Text>
                            {!!card && card.balance && (
                                <Text style={{ color: Theme.textColor, fontWeight: '400', fontSize: 16, marginRight: 2, alignSelf: 'flex-start' }}>
                                    <ValueComponent value={card.balance} />{' TON'}
                                </Text>
                            )}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginRight: 10, marginBottom: 10, }}>
                            <Text
                                style={{ color: '#8E979D', fontSize: 13, flexShrink: 1, paddingRight: 16, marginTop: 4 }}
                                ellipsizeMode="tail"
                                numberOfLines={1}
                            >
                                {!!card && (
                                    <Text style={{ flexShrink: 1 }}>
                                        {t(`products.zenPay.card.type.${card.type}`)}
                                    </Text>
                                )}
                                {!card && (
                                    <Text style={{ flexShrink: 1 }}>
                                        {t('products.zenPay.card.defaultSubtitle')}
                                    </Text>
                                )}
                            </Text>
                            {!!card &&
                                (
                                    <PriceComponent
                                        amount={card.balance}
                                        style={{
                                            backgroundColor: 'transparent',
                                            paddingHorizontal: 0, paddingVertical: 0,
                                            alignSelf: 'flex-end',
                                            marginTop: 2, height: 14
                                        }}
                                        textStyle={{ color: '#8E979D', fontWeight: '400', fontSize: 12 }}
                                    />
                                )
                            }
                        </View>
                        <View style={{ flexGrow: 1 }} />
                    </View>
                )}
                {!card && (
                    <View style={{ flexDirection: 'row', flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'space-between', paddingRight: 10 }}>
                        <View style={{ flexDirection: 'column' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 10, marginRight: 10 }}>
                                <Text style={{ color: Theme.textColor, fontSize: 16, marginRight: 16, fontWeight: '600', flexShrink: 1 }} ellipsizeMode="tail" numberOfLines={fontScaleNormal ? 1 : 2}>
                                    {t('products.zenPay.card.defaultTitle')}
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginRight: 10, marginBottom: 10, }}>
                                <Text
                                    style={{ color: '#8E979D', fontSize: 13, flexShrink: 1, paddingRight: 16, marginTop: 4 }}
                                    ellipsizeMode="tail"
                                    numberOfLines={1}
                                >
                                    <Text style={{ flexShrink: 1 }}>
                                        {t('products.zenPay.card.defaultSubtitle')}
                                    </Text>
                                </Text>
                            </View>
                        </View>
                        <View style={{
                            backgroundColor: Theme.accent,
                            borderRadius: 70,
                            minWidth: 50, height: 30, paddingHorizontal: 8,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}>
                            <Text style={{ color: 'white' }}>
                                {t('common.add')}
                            </Text>
                        </View>
                    </View>
                )}
            </View>
        </TouchableHighlight>
    );
});