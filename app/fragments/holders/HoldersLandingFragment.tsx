import * as React from 'react';
import { ActivityIndicator, Platform, Text, View, KeyboardAvoidingView, Alert, Pressable } from 'react-native';
import WebView from 'react-native-webview';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebViewMessageEvent, WebViewNavigation } from 'react-native-webview/lib/WebViewTypes';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { t } from '../../i18n/t';
import { useEngine } from '../../engine/Engine';
import { warn } from '../../utils/log';
import { AndroidToolbar } from '../../components/topbar/AndroidToolbar';
import { StatusBar } from 'expo-status-bar';
import { extractDomain } from '../../engine/utils/extractDomain';
import { useParams } from '../../utils/useParams';
import { HoldersAppParams } from './HoldersAppFragment';
import { extractHoldersQueryParams } from './utils';
import { getLocales } from 'react-native-localize';
import { fragment } from '../../fragment';
import { useAppConfig } from '../../utils/AppConfigContext';
import { useKeysAuth } from '../../components/secure/AuthWalletKeys';
import { OfflineWebView } from './components/OfflineWebView';
import * as FileSystem from 'expo-file-system';
import { useCallback, useEffect, useRef, useState } from 'react';
import { storage } from '../../storage/storage';
import { normalizePath } from '../../engine/holders/HoldersProduct';

export const HoldersLandingFragment = fragment(() => {
    const { Theme } = useAppConfig();
    const webRef = useRef<WebView>(null);
    const authContext = useKeysAuth();
    const engine = useEngine();
    const navigation = useTypedNavigation();
    const [hideKeyboardAccessoryView, setHideKeyboardAccessoryView] = useState(true);
    const { endpoint, onEnrollType } = useParams<{ endpoint: string, onEnrollType: HoldersAppParams }>();
    const lang = getLocales()[0].languageCode;
    const currency = engine.products.price.usePrimaryCurrency();
    const offlineApp = engine.persistence.holdersOfflineApp.item().value;

    //
    // View
    //
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
            backgroundColor: Theme.item,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: withTiming(opacity.value, { duration: 300 }),
        };
    });

    let [auth, setAuth] = React.useState(false);
    const authOpacity = useSharedValue(0);
    const animatedAuthStyles = useAnimatedStyle(() => {
        return {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: Theme.item,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: withTiming(opacity.value, { duration: 300, easing: Easing.bezier(0.42, 0, 1, 1) }),
        };
    });

    const onEnroll = useCallback(async () => {
        if (auth) {
            return;
        }
        // Show loader
        authOpacity.value = 1;
        setAuth(true);

        try {
            const data = await engine.products.extensions.getAppData(endpoint);
            if (!data) {
                Alert.alert(t('auth.failed'));
                authOpacity.value = 0;
                setAuth(false);
                return;
            }

            const domain = extractDomain(endpoint);
            const res = await engine.products.holders.enroll(domain, authContext);
            if (!res) {
                Alert.alert(t('auth.failed'));
                authOpacity.value = 0;
                setAuth(false)
                return;
            }

            // Navigate to continue
            navigation.replace('Holders', onEnrollType);

            authOpacity.value = 0;
            setAuth(false);

        } catch (error) {
            authOpacity.value = 0;
            setAuth(false);
            Alert.alert(t('auth.failed'));
            warn(error);
        }
    }, [auth]);

    //
    // Navigation
    //
    const handleWebViewMessage = useCallback((event: WebViewMessageEvent) => {
        const nativeEvent = event.nativeEvent;

        // Resolve parameters
        let data: any;
        let id: number;
        try {
            let parsed = JSON.parse(nativeEvent.data);
            if (typeof parsed.id !== 'number') {
                warn('Invalid operation id');
                return;
            }
            id = parsed.id;
            data = parsed.data;
        } catch (e) {
            warn(e);
            return;
        }

        if (data.name === 'openEnrollment') {
            onEnroll();
            return;
        }
        if (data.name === 'closeApp') {
            navigation.goBack();
            return;
        }
    }, [onEnroll]);

    const onNavigation = useCallback((url: string) => {
        const params = extractHoldersQueryParams(url);
        if (params.closeApp) {
            navigation.goBack();
            return;
        }
        setHideKeyboardAccessoryView(!params.showKeyboardAccessoryView);
        if (params.openEnrollment) {
            onEnroll();
            return;
        }
    }, [onEnroll]);

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            backgroundColor: Theme.item
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <View style={{ backgroundColor: Theme.item, flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}>
                {offlineApp && (
                    <Animated.View style={{ flexGrow: 1, flexBasis: 0, height: '100%', }} entering={FadeIn}>
                        <OfflineWebView
                            ref={webRef}
                            uri={`${FileSystem.documentDirectory}holders${normalizePath(offlineApp.version)}/index.html`}
                            baseUrl={`${FileSystem.documentDirectory}holders${normalizePath(offlineApp.version)}/`}
                            initialRoute={`/about?lang=${lang}&currency=${currency}`}
                            style={{
                                backgroundColor: Theme.item,
                                flexGrow: 1, flexBasis: 0, height: '100%',
                                alignSelf: 'stretch',
                                marginTop: Platform.OS === 'ios' ? 0 : 8,
                            }}
                            onLoadEnd={() => {
                                setLoaded(true);
                                opacity.value = 0;
                            }}
                            onLoadProgress={(event) => {
                                if (Platform.OS === 'android' && event.nativeEvent.progress === 1) {
                                    // Searching for supported query
                                    onNavigation(event.nativeEvent.url);
                                }
                            }}
                            onNavigationStateChange={(event: WebViewNavigation) => {
                                // Searching for supported query
                                onNavigation(event.url);
                            }}
                            // Locking scroll, it's handled within the Web App
                            scrollEnabled={false}
                            contentInset={{ top: 0, bottom: 0 }}
                            autoManageStatusBarEnabled={false}
                            decelerationRate="normal"
                            allowsInlineMediaPlayback={true}
                            onMessage={handleWebViewMessage}
                            keyboardDisplayRequiresUserAction={false}
                            hideKeyboardAccessoryView={hideKeyboardAccessoryView}
                            bounces={false}
                            startInLoadingState={true}
                        />
                    </Animated.View>
                )}
                {!offlineApp && (
                    <Animated.View style={{ flexGrow: 1, flexBasis: 0, height: '100%', }} entering={FadeIn}>
                        <WebView
                            ref={webRef}
                            source={{ uri: `${endpoint}/about?lang=${lang}&currency=${currency}` }}
                            startInLoadingState={true}
                            style={{
                                backgroundColor: Theme.item,
                                flexGrow: 1, flexBasis: 0, height: '100%',
                                alignSelf: 'stretch',
                                marginTop: Platform.OS === 'ios' ? 0 : 8,
                            }}
                            onLoadEnd={() => {
                                setLoaded(true);
                                opacity.value = 0;
                            }}
                            onLoadProgress={(event) => {
                                if (Platform.OS === 'android' && event.nativeEvent.progress === 1) {
                                    // Searching for supported query
                                    onNavigation(event.nativeEvent.url);
                                }
                            }}
                            onNavigationStateChange={(event: WebViewNavigation) => {
                                // Searching for supported query
                                onNavigation(event.url);
                            }}
                            // Locking scroll, it's handled within the Web App
                            scrollEnabled={false}
                            contentInset={{ top: 0, bottom: 0 }}
                            autoManageStatusBarEnabled={false}
                            allowFileAccessFromFileURLs={false}
                            allowUniversalAccessFromFileURLs={false}
                            decelerationRate="normal"
                            allowsInlineMediaPlayback={true}
                            onMessage={handleWebViewMessage}
                            keyboardDisplayRequiresUserAction={false}
                            hideKeyboardAccessoryView={hideKeyboardAccessoryView}
                            bounces={false}
                        />
                    </Animated.View>
                )}
                {!offlineApp && (
                    <Animated.View
                        style={animatedStyles}
                        pointerEvents={loaded ? 'none' : 'box-none'}
                    >
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
                            <AndroidToolbar tintColor={'#564CE2'} onBack={() => navigation.goBack()} />
                        </View>
                        {Platform.OS === 'ios' && (
                            <Pressable
                                style={{ position: 'absolute', top: 22, right: 16 }}
                                onPress={() => {
                                    navigation.goBack();
                                }} >
                                <Text style={{ color: '#564CE2', fontWeight: '500', fontSize: 17 }}>
                                    {t('common.close')}
                                </Text>
                            </Pressable>
                        )}
                        <ActivityIndicator size="small" color={'#564CE2'} />
                    </Animated.View>
                )}
                {offlineApp && (
                    <Animated.View
                        style={animatedStyles}
                        pointerEvents={loaded ? 'none' : 'box-none'}
                    >
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
                            <AndroidToolbar onBack={() => navigation.goBack()} />
                        </View>
                        {Platform.OS === 'ios' && (
                            <Pressable
                                style={{ position: 'absolute', top: 22, right: 16 }}
                                onPress={() => {
                                    navigation.goBack();
                                }} >
                                <Text style={{ color: '#564CE2', fontWeight: '500', fontSize: 17 }}>
                                    {t('common.close')}
                                </Text>
                            </Pressable>
                        )}
                    </Animated.View>
                )}
                <Animated.View
                    style={animatedAuthStyles}
                    pointerEvents={!auth ? 'none' : 'box-none'}
                >
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
                        <AndroidToolbar onBack={() => navigation.goBack()} />
                    </View>
                    {Platform.OS === 'ios' && (
                        <Pressable
                            style={{ position: 'absolute', top: 22, right: 16 }}
                            onPress={() => {
                                navigation.goBack();
                            }} >
                            <Text style={{ color: '#564CE2', fontWeight: '500', fontSize: 17 }}>
                                {t('common.close')}
                            </Text>
                        </Pressable>
                    )}
                    <ActivityIndicator size="small" color={'#564CE2'} />
                </Animated.View>
            </View>
        </View>
    );
});