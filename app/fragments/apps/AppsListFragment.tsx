import { StatusBar } from "expo-status-bar";
import { Platform, View, Text, ScrollView, Alert } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { fragment } from "../../fragment"
import { t } from "../../i18n/t";
import { Theme } from "../../Theme";
import LottieView from 'lottie-react-native';
import { useCallback, useLayoutEffect, useRef } from "react";
import { useEngine } from "../../engine/Engine";
import { extractDomain } from "../../engine/utils/extractDomain";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import React from "react";
import { AnimatedProductButton } from "../../components/products/AnimatedProductButton";
import { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { CloseButton } from "../../components/CloseButton";

export const AppsListFragment = fragment(() => {
    const engine = useEngine();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    const extensions = engine.products.extensions.useExtensions();

    const openExtension = useCallback((url: string) => {
        let domain = extractDomain(url);
        if (!domain) {
            return; // Shouldn't happen
        }
        let k = engine.persistence.domainKeys.getValue(domain);
        if (!k) {
            navigation.navigate('Install', { url });
        } else {
            navigation.navigate('App', { url });
        }
    }, []);

    let removeExtension = React.useCallback((key: string) => {
        Alert.alert(t('auth.apps.delete.title'), t('auth.apps.delete.message'), [{ text: t('common.cancel') }, {
            text: t('common.delete'),
            style: 'destructive',
            onPress: () => {
                engine.products.extensions.removeExtension(key);
            }
        }]);
    }, []);

    const anim = useRef<LottieView>(null);
    useLayoutEffect(() => {
        if (Platform.OS === 'ios') {
            setTimeout(() => {
                anim.current?.play()
            }, 300);
        }
    }, []);

    return (
        <View style={{
            flexGrow: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar pageTitle={t('auth.apps.title')} />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 17,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        fontSize: 17
                    }, { textAlign: 'center' }]}>
                        {t('auth.apps.title')}
                    </Text>
                </View>
            )}
            {extensions.length === 0 && (
                <View style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    paddingHorizontal: 16
                }}>
                    <LottieView
                        ref={anim}
                        source={require('../../../assets/animations/empty.json')}
                        autoPlay={true}
                        loop={true}
                        style={{ width: 128, height: 128, maxWidth: 140, maxHeight: 140 }}
                    />
                    <Text style={{
                        fontSize: 18,
                        fontWeight: '700',
                        marginHorizontal: 8,
                        marginBottom: 8,
                        textAlign: 'center',
                        color: Theme.textColor,
                    }}
                    >
                        {t('auth.noApps')}
                    </Text>
                </View>
            )}
            {extensions.length > 0 && (
                <>
                    <ScrollView style={{ flexGrow: 1 }}>
                        <View style={{
                            marginBottom: 16,
                            marginTop: 24,
                            borderRadius: 14,
                            flexShrink: 1,
                        }}>
                            {extensions.map((e) => {
                                return (
                                    <AnimatedProductButton
                                        entering={FadeInUp}
                                        exiting={FadeOutDown}
                                        key={e.key}
                                        name={e.name}
                                        subtitle={e.description ? e.description : e.url}
                                        image={e.image?.url}
                                        blurhash={e.image?.blurhash}
                                        value={null}
                                        onLongPress={() => removeExtension(e.key)}
                                        onPress={() => openExtension(e.url)}
                                        extension={true}
                                        style={{ marginVertical: 4 }}
                                    />
                                );
                            })}
                        </View>
                    </ScrollView>
                </>
            )}
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={() => {
                        navigation.goBack();
                    }}
                />
            )}
        </View>
    );
});