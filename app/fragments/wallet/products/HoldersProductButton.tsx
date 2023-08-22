import { Canvas, LinearGradient, Rect, vec } from "@shopify/react-native-skia";
import React, { useCallback } from "react";
import { TouchableHighlight, View, Text, useWindowDimensions, Image } from "react-native";
import { PriceComponent } from "../../../components/PriceComponent";
import { ValueComponent } from "../../../components/ValueComponent";
import { extractDomain } from "../../../engine/utils/extractDomain";
import { t } from "../../../i18n/t";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { useAppConfig } from "../../../utils/AppConfigContext";
import { HoldersCard, holdersUrl } from '../../../engine/legacy/holders/HoldersProduct';

const colorsMap: { [key: string]: string[] } = {
    'minimal-1': ['#8689b5', '#9fa2d1'],
    'minimal-2': ['#000000', '#333333'],
    'minimal-3': ['#dca6c0', '#cda3b7'],
    'minimal-4': ['#93c1a6', '#8da998'],
    'default-1': ['#dec08e', '#b9a88b'],
    'default-2': ['#792AF6', "#954CF9"], // Default
}

export const HoldersProductButton = React.memo(({ account, engine }: { account?: HoldersCard }) => {
    const { Theme } = useAppConfig();
    const dimentions = useWindowDimensions();
    const navigation = useTypedNavigation();
    const fontScaleNormal = dimentions.fontScale <= 1;
    const status = engine.products.holders.useStatus();

    const needsEnrolment = React.useMemo(() => {
        try {
            let domain = extractDomain(holdersUrl);
            if (!domain) {
                return; // Shouldn't happen
            }
            let domainKey = engine.products.keys.getDomainKey(domain);
            if (!domainKey) {
                return true;
            }
            if (status.state === 'need-enrolment') {
                return true;
            }
        } catch (error) {
            return true;
        }
        return false;
    }, [status]);

    const onPress = useCallback(
        () => {
            if (needsEnrolment) {
                navigation.navigate(
                    'HoldersLanding',
                    {
                        endpoint: holdersUrl,
                        onEnrollType: account ? { type: 'card', id: account.id } : { type: 'account' }
                    }
                );
                return;
            }
            navigation.navigate('Holders', account ? { type: 'card', id: account.id } : { type: 'account' });
        },
        [account, needsEnrolment],
    );

    const colors = account ? (colorsMap[account.card.personalizationCode] ?? colorsMap['default-2']) : ['#333A5A', "#A7AFD3"];

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
                                colors={colors}
                            />
                        </Rect>
                    </Canvas>
                    {!!account?.card.lastFourDigits && (
                        <Text style={{ color: 'white', fontSize: 8, marginHorizontal: 4, marginTop: 2 }} numberOfLines={1}>
                            {account.card.lastFourDigits}
                        </Text>
                    )}
                    {!account && (
                        <Image source={require('../../../../assets/ic_eu.png')} style={{ position: 'absolute', bottom: 4, right: 4 }} />
                    )}
                    {account && account.type === 'virtual' && (
                        <Image source={require('../../../../assets/ic_virtual_card.png')} style={{ position: 'absolute', bottom: 4, right: 4 }} />
                    )}
                    {account && account.type === 'physical' && (
                        <Image source={require('../../../../assets/ic_visa_card.png')} style={{ position: 'absolute', bottom: 4, right: 4 }} />
                    )}
                </View>
                {!!account && (
                    <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 10, marginRight: 10 }}>
                            <Text style={{ color: Theme.textColor, fontSize: 16, marginRight: 16, fontWeight: '600', flexShrink: 1 }} ellipsizeMode="tail" numberOfLines={fontScaleNormal ? 1 : 2}>
                                {account.card.lastFourDigits ? t('products.zenPay.card.title', { cardNumber: account.card.lastFourDigits }) : t('products.zenPay.card.defaultTitle') + `${account.card.personalizationCode === 'minimal-2' ? ' PRO' :''}`}
                            </Text>
                            {!!account && account.balance && (
                                <Text style={{ color: Theme.textColor, fontWeight: '400', fontSize: 16, marginRight: 2, alignSelf: 'flex-start' }}>
                                    <ValueComponent value={account.balance} precision={2} />{' TON'}
                                </Text>
                            )}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginRight: 10, marginBottom: 10, }}>
                            <Text
                                style={{ color: '#8E979D', fontSize: 13, flexShrink: 1, paddingRight: 16, marginTop: 4 }}
                                ellipsizeMode="tail"
                                numberOfLines={1}
                            >
                                {!!account && (
                                    <Text style={{ flexShrink: 1 }}>
                                        {t(`products.zenPay.card.type.${account.type}` as any)}
                                    </Text>
                                )}
                                {!account && (
                                    <Text style={{ flexShrink: 1 }}>
                                        {t('products.zenPay.card.defaultSubtitle')}
                                    </Text>
                                )}
                            </Text>
                            {!!account &&
                                (
                                    <PriceComponent
                                        amount={account.balance}
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
                {!account && (
                    <View style={{ flexDirection: 'row', flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'space-between', paddingRight: 10 }}>
                        <View style={{ flexDirection: 'column', flexShrink: 1 }}>
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