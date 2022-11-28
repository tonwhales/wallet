import React from "react";
import { View, Text, Pressable, Platform, Image, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MixpanelEvent, trackEvent, useTrackEvent } from "../../analytics/mixpanel";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { RoundButton } from "../../components/RoundButton";
import { t } from "../../i18n/t";
import { Theme } from "../../Theme";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import Description_1 from '../../../assets/ic_zenpay_description_1.svg';
import Description_2 from '../../../assets/ic_zenpay_description_2.svg';
import Description_3 from '../../../assets/ic_zenpay_description_3.svg';
import { openWithInApp } from "../../utils/openWithInApp";

export const ZenPayInfoComponent = React.memo(({ callback }: { callback: () => void }) => {
    const safeArea = useSafeAreaInsets();

    // 
    // Track events
    // 
    const navigation = useTypedNavigation();
    const start = React.useMemo(() => {
        return Date.now();
    }, []);
    const close = React.useCallback(() => {
        navigation.goBack();
        trackEvent(MixpanelEvent.ZenPayInfoClose, { duration: Date.now() - start });
    }, []);
    useTrackEvent(MixpanelEvent.ZenPayInfo);

    return (
        <View style={{ backgroundColor: Theme.background, flexGrow: 1 }}>
            <AndroidToolbar pageTitle={t('products.zenPay.title')} />
            {Platform.OS === 'ios' && (
                <>
                    <View style={{
                        width: '100%',
                        flexDirection: 'row',
                        marginTop: 24,
                        paddingHorizontal: 15,
                        justifyContent: 'center'
                    }}>
                        <Pressable
                            style={({ pressed }) => {
                                return ({
                                    opacity: pressed ? 0.3 : 1,
                                    position: 'absolute', top: 0, bottom: 0, left: 15
                                });
                            }}
                            onPress={close}
                        >
                            <Text style={{
                                fontWeight: '400',
                                fontSize: 17,
                                textAlign: 'center',
                            }}>
                                {t('common.close')}
                            </Text>
                        </Pressable>
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 17,
                            textAlign: 'center'
                        }}>
                            {t('products.zenPay.title')}
                        </Text>
                    </View>
                </>
            )}
            <View style={{ flexGrow: 1, marginTop: 30 }}>
                <ScrollView style={{ flexGrow: 1 }}>
                    <View style={{ flexGrow: 1, alignItems: 'center' }}>
                        <Image source={require('../../../assets/img_zenpay_card.png')} />
                        <Text style={{
                            marginTop: 20, fontSize: 17, color: '#858B93'
                        }}>
                            {t('products.zenPay.enroll.poweredBy')}
                        </Text>
                        <View style={{ marginTop: 30, flexGrow: 1, paddingHorizontal: 20, width: '100%' }}>
                            <View style={{ flexDirection: 'row', marginVertical: 10, alignItems: 'center' }}>
                                <View style={{ height: 56, width: 56, borderRadius: 56, marginRight: 15, backgroundColor: Theme.item }}>
                                    <Description_1 color={Theme.accent} />
                                </View>
                                <Text style={{
                                    fontSize: 17,
                                    color: Theme.textColor,
                                    maxWidth: 260
                                }}>
                                    {t('products.zenPay.enroll.description_1')}
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', marginVertical: 10, alignItems: 'center' }}>
                                <View style={{ height: 56, width: 56, borderRadius: 56, marginRight: 15, backgroundColor: Theme.item }}>
                                    <Description_2 />
                                </View>
                                <Text style={{
                                    fontSize: 17,
                                    color: Theme.textColor,
                                    maxWidth: 260
                                }}>
                                    {t('products.zenPay.enroll.description_2')}
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', marginVertical: 10, alignItems: 'center' }}>
                                <View style={{ height: 56, width: 56, borderRadius: 56, marginRight: 15, backgroundColor: Theme.item }}>
                                    <Description_3 />
                                </View>
                                <Text style={{
                                    fontSize: 17,
                                    color: Theme.textColor,
                                    maxWidth: 260
                                }}>
                                    {t('products.zenPay.enroll.description_3')}
                                </Text>
                            </View>
                            <Pressable
                                style={({ pressed }) => {
                                    return {
                                        opacity: pressed ? 0.3 : 1,
                                        marginTop: 20
                                    }
                                }}
                                onPress={() => {
                                    openWithInApp('https://zenpay.org');
                                }}
                            >
                                <Text style={{
                                    fontSize: 17,
                                    color: Theme.accent,
                                    maxWidth: 260
                                }}>
                                    {t('products.zenPay.enroll.moreInfo')}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>

                <View
                    style={{
                        position: 'absolute', bottom: safeArea.bottom + 16, left: 0, right: 0, paddingHorizontal: 16
                    }}
                >
                    <RoundButton
                        title={t('common.continue')}
                        onPress={callback}
                        style={{
                            height: 56,
                        }}
                    />
                </View>
            </View>
        </View>
    );
});