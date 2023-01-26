import React from "react";
import { View, Text, Pressable, Platform, Image, ScrollView, ActivityIndicator } from "react-native";
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
import WebView from "react-native-webview";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { LinearGradient } from 'expo-linear-gradient';

export const ZenPayInfoComponent = React.memo(({ callback }: { callback: () => void }) => {
    const safeArea = useSafeAreaInsets();

    let [loaded, setLoaded] = React.useState(false);
    const opacity = useSharedValue(1);
    const animatedStyles = useAnimatedStyle(() => {
        return {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: Theme.background,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: withTiming(opacity.value, { duration: 300 }),
        };
    });

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
        <View style={{ backgroundColor: Theme.item, flexGrow: 1 }}>
            <AndroidToolbar pageTitle={t('products.zenPay.title')} />
            {Platform.OS === 'ios' && (
                <>
                    <View style={{
                        width: '100%',
                        flexDirection: 'row',
                        marginTop: 24,
                        marginBottom: 24,
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
            <WebView
                source={{ uri: 'https://next.zenpay.org/about' }}
                onLoadEnd={() => {
                    setLoaded(true);
                    opacity.value = 0;
                }}
            />
            <View style={{
                position: 'absolute',
                bottom: 0, left: 0, right: 0,
                paddingHorizontal: 16,
                paddingBottom: 40,
                paddingTop: 46
            }}>
                <LinearGradient
                    colors={["rgba(256,256,256,0)", "rgba(256,256,256,0.9)"]}
                    style={{
                        position: 'absolute',
                        bottom: 0, left: 0, right: 0, top: 0
                    }}
                />

                <RoundButton
                    title={t('common.continue')}
                    subtitle={t('products.zenPay.enroll.buttonSub')}
                    onPress={callback}
                    style={{
                        height: 56,
                    }}
                />
            </View>
            <Animated.View
                style={animatedStyles}
                pointerEvents={loaded ? 'none' : 'box-none'}
            >
                <ActivityIndicator size="small" color={Theme.accent} />
            </Animated.View>
        </View>
    );
});