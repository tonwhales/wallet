import { Canvas, LinearGradient, Rect, vec } from "@shopify/react-native-skia";
import React, { memo, useCallback, useMemo } from "react";
import { TouchableHighlight, View, Text, useWindowDimensions, Image } from "react-native";
import { PriceComponent } from "../../../components/PriceComponent";
import { ValueComponent } from "../../../components/ValueComponent";
import { extractDomain } from "../../../engine/utils/extractDomain";
import { t } from "../../../i18n/t";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { useTheme } from '../../../engine/hooks/useTheme';
import { useDomainKey } from "../../../engine/hooks/dapps/useDomainKey";
import { useHoldersAccountStatus } from "../../../engine/hooks/holders/useHoldersAccountStatus";
import { getCurrentAddress } from "../../../storage/appState";
import { HoldersAccountState, holdersUrl } from "../../../engine/api/holders/fetchAccountState";
import { HoldersCard } from "../../../engine/api/holders/fetchCards";
import { useNetwork } from "../../../engine/hooks/useNetwork";

const colorsMap: { [key: string]: string[] } = {
    'minimal-1': ['#8689b5', '#9fa2d1'],
    'minimal-2': ['#000000', '#333333'],
    'minimal-3': ['#dca6c0', '#cda3b7'],
    'minimal-4': ['#93c1a6', '#8da998'],
    'default-1': ['#dec08e', '#b9a88b'],
    'default-2': ['#792AF6', "#954CF9"], // Default
}

export const HoldersProductButton = memo(({ account }: { account?: HoldersCard }) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const dimentions = useWindowDimensions();
    const navigation = useTypedNavigation();
    const fontScaleNormal = dimentions.fontScale <= 1;

    const acc = useMemo(() => getCurrentAddress(), []);
    const status = useHoldersAccountStatus(acc.address.toString({ testOnly: isTestnet })).data;

    const domain = extractDomain(holdersUrl);
    const domainKey = useDomainKey(domain);

    const needsenrollment = useMemo(() => {
        try {
            if (!domainKey) {
                return true;
            }
            if (!!status && status.state === HoldersAccountState.NeedEnrollment) {
                return true;
            }
        } catch (error) {
            return true;
        }
        return false;
    }, [status, domainKey]);

    const onPress = useCallback(
        () => {
            if (needsenrollment) {
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
        [account, needsenrollment],
    );

    const colors = account ? (colorsMap[account.card.personalizationCode] ?? colorsMap['default-2']) : ['#333A5A', "#A7AFD3"];
    const cardKind = account?.card.kind === 'virtual' ? 'virtual' : 'physical';

    return (
        <TouchableHighlight
            onPress={onPress}
            underlayColor={theme.selector}
            style={{
                alignSelf: 'stretch', borderRadius: 14,
                backgroundColor: theme.item,
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
                    {account && cardKind === 'virtual' ? (
                        <Image source={require('../../../../assets/ic_virtual_card.png')} style={{ position: 'absolute', bottom: 4, right: 4 }} />
                    ) : (
                        <Image source={require('../../../../assets/ic_visa_card.png')} style={{ position: 'absolute', bottom: 4, right: 4 }} />
                    )}
                </View>
                {!!account && (
                    <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 10, marginRight: 10 }}>
                            <Text style={{ color: theme.textColor, fontSize: 16, marginRight: 16, fontWeight: '600', flexShrink: 1 }} ellipsizeMode="tail" numberOfLines={fontScaleNormal ? 1 : 2}>
                                {account.card.lastFourDigits ? t('products.zenPay.card.title', { cardNumber: account.card.lastFourDigits }) : t('products.zenPay.card.defaultTitle') + `${account.card.personalizationCode === 'minimal-2' ? ' PRO' : ''}`}
                            </Text>
                            {!!account && (
                                <Text style={{ color: theme.textColor, fontWeight: '400', fontSize: 16, marginRight: 2, alignSelf: 'flex-start' }}>
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
                                        {t(`products.zenPay.card.type.${cardKind}` as any)}
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
                                        amount={BigInt(account.balance)}
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
                                <Text style={{ color: theme.textColor, fontSize: 16, marginRight: 16, fontWeight: '600', flexShrink: 1 }} ellipsizeMode="tail" numberOfLines={fontScaleNormal ? 1 : 2}>
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
                            backgroundColor: theme.accent,
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