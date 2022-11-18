import { Canvas, LinearGradient, Rect, vec } from "@shopify/react-native-skia";
import BN from "bn.js";
import React, { useCallback } from "react";
import { TouchableHighlight, View, Text, useWindowDimensions } from "react-native";
import { PriceComponent } from "../../components/PriceComponent";
import { ValueComponent } from "../../components/ValueComponent";
import { Engine } from "../../engine/Engine";
import { t } from "../../i18n/t";
import { Theme } from "../../Theme";

export const ZenPayProductButton = React.memo(({ engine, cardNumber }: { engine: Engine, cardNumber?: string }) => {
    const dimentions = useWindowDimensions();
    const fontScaleNormal = dimentions.fontScale <= 1;
    const card = engine.products.zenPay.useCard(cardNumber);

    const onPress = useCallback(
        () => {

        },
        [],
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
                <View style={{ width: 34, height: 46, borderRadius: 6, borderWidth: 0, marginVertical: 10, marginLeft: 10, marginRight: 10, overflow: 'hidden' }}>
                    <Canvas style={{ width: 34, height: 46, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                        <Rect x={0} y={0} width={34} height={46}>
                            <LinearGradient
                                start={vec(0, 0)}
                                end={vec(34, 46)}
                                colors={card?.colors ?? ['#333A5A', "#A7AFD3"]}
                            />
                        </Rect>
                    </Canvas>
                    <Text style={{ color: 'white', fontSize: 10, marginHorizontal: 4, marginTop: 2 }} numberOfLines={2}>
                        {cardNumber?.slice(cardNumber.length - 4, cardNumber.length) ?? 'Zen Pay'}
                    </Text>
                </View>
                <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 10, marginRight: 10 }}>
                        <Text style={{ color: Theme.textColor, fontSize: 16, marginRight: 16, fontWeight: '600', flexShrink: 1 }} ellipsizeMode="tail" numberOfLines={fontScaleNormal ? 1 : 2}>
                            {card?.name ?? t('products.zenPay.card.defaultTitle')}
                        </Text>
                        {!!card?.value && (
                            <Text style={{ color: Theme.textColor, fontWeight: '400', fontSize: 16, marginRight: 2, alignSelf: 'flex-start' }}>
                                <ValueComponent value={card.value} />{' TON'}
                            </Text>
                        )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginRight: 10, marginBottom: 10, }}>
                        <Text
                            style={{ color: '#8E979D', fontSize: 13, flexShrink: 1, paddingRight: 16, marginTop: 4 }}
                            ellipsizeMode="tail"
                            numberOfLines={1}
                        >
                            <Text style={{ flexShrink: 1 }}>
                                {card?.subtitle ?? t('products.zenPay.card.defaultSubtitle')}
                            </Text>
                        </Text>
                        {!!card?.value &&
                            (
                                <PriceComponent
                                    amount={card.value}
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
                {!card && (
                    <View style={{
                        backgroundColor: Theme.accent,
                        borderRadius: 70,
                        width: 50, height: 30,
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'absolute',
                        top: 0, right: 10, bottom: 0
                    }}>
                        <Text style={{ color: 'white' }}>
                            {t('common.add')}
                        </Text>
                    </View>
                )}
            </View>
        </TouchableHighlight>
    );
});