import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Text, View, StyleSheet, Pressable, Platform, Linking, Alert, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Application from 'expo-application';
import * as IntentLauncher from 'expo-intent-launcher';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import { t } from '../../i18n/t';
import { systemFragment } from '../../systemFragment';
import { RoundButton } from '../../components/RoundButton';
import { useDimensions } from '@react-native-community/hooks';
import { ScreenHeader } from '../../components/ScreenHeader';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Canvas, rrect, rect, DiffRect } from '@shopify/react-native-skia';
import * as RNImagePicker from 'expo-image-picker';
import { BarCodeScanner, BarCodeScannerResult } from 'expo-barcode-scanner';
import { Camera, FlashMode } from 'expo-camera';
import { useTheme } from '../../engine/hooks';
import { Typography } from '../../components/styles';
import { useCameraAspectRatio } from '../../utils/useCameraAspectRatio';

import FlashOn from '../../../assets/ic-flash-on.svg';
import FlashOff from '../../../assets/ic-flash-off.svg';
import Photo from '../../../assets/ic-photo.svg';

const EmptyIllustrations = {
    dark: require('@assets/empty-cam-dark.webp'),
    light: require('@assets/empty-cam.webp')
}

export const ScannerFragment = systemFragment(() => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const route = useRoute().params;
    const dimensions = useDimensions();
    const navigation = useNavigation();

    const [hasPermission, setHasPermission] = useState<null | boolean>(null);
    const [isActive, setActive] = useState(true);
    const [flashOn, setFlashOn] = useState(false);

    const cameraRef = useRef<Camera>(null);

    // Screen Ratio and image padding for Android
    // The issue arises from the discrepancy between the camera preview's aspect ratio and the screen's aspect ratio. 
    // Possible causes: 
    // 1. Different camera manufacturers support different aspect ratios. 
    // 2. Different phone manufacturers design screens with varying aspect ratios.
    const { ratio, imagePadding, prepareRatio } = useCameraAspectRatio();

    const onCameraReady = useCallback(() => {
        if (!!cameraRef.current) {
            prepareRatio(cameraRef.current);
        }
    }, []);

    const onReadFromMedia = useCallback(async () => {
        try {
            const { status } = await RNImagePicker.requestMediaLibraryPermissionsAsync()
            if (status === 'granted') {
                const result = await RNImagePicker.launchImageLibraryAsync({
                    allowsMultipleSelection: false,
                    mediaTypes: RNImagePicker.MediaTypeOptions.Images,
                })
                if (!result.canceled) {
                    const resourceUri = result.assets[0].uri;
                    const results = await BarCodeScanner.scanFromURLAsync(resourceUri);
                    if (results.length > 0) {
                        const res = results[0];
                        setActive(false);
                        setTimeout(() => {
                            navigation.goBack();
                            (route as any).callback(res.data);
                        }, 10);
                    }
                }
            }
        } catch {
            Alert.alert(t('qr.title'), t('qr.failedToReadFromImage'));
        }
    }, []);

    useEffect(() => {
        (async () => {
            const status = await BarCodeScanner.requestPermissionsAsync();
            setHasPermission(status.granted);
        })();
    }, []);

    const onScanned = useCallback((res: BarCodeScannerResult) => {
        if (res.data.length > 0) {
            if (route && (route as any).callback) {
                setActive(false);

                setTimeout(() => {
                    navigation.goBack();
                    (route as any).callback(res.data);
                }, 10);
            }
        }
    }, [route]);

    if (!hasPermission) {
        return (
            <View style={[{ flexGrow: 1 }, Platform.select({ android: { paddingTop: safeArea.top } })]}>
                {Platform.OS === 'ios' ? <StatusBar style={'light'} /> : null}
                <ScreenHeader
                    tintColor={'white'}
                    onClosePressed={() => {
                        setActive(false);
                        setTimeout(() => {
                            navigation.goBack();
                        }, 10);
                    }}
                />
                <View style={{ flexGrow: 1 }} />
                <View style={{
                    justifyContent: 'center', alignItems: 'center',
                    paddingHorizontal: 16,
                }}>
                    <View style={{
                        justifyContent: 'center', alignItems: 'center',
                        width: dimensions.screen.width - 32,
                        height: (dimensions.screen.width - 32) * 0.91,
                        borderRadius: 20, overflow: 'hidden',
                        marginBottom: 32,
                    }}>
                        <Image
                            resizeMode={'center'}
                            style={{ height: dimensions.screen.width - 32, width: dimensions.screen.width - 32, marginTop: -20 }}
                            source={EmptyIllustrations[theme.style]}
                        />
                    </View>
                    <Text
                        style={[
                            { textAlign: 'center', color: theme.textPrimary, marginHorizontal: 16 },
                            Typography.semiBold32_38
                        ]}
                    >
                        {hasPermission === null ? t('qr.requestingPermission') : t('qr.noPermission')}
                    </Text>
                </View>
                <View style={{ flexGrow: 1 }} />
                {hasPermission !== null && (
                    <View style={{ paddingHorizontal: 16, marginBottom: safeArea.bottom === 0 ? 16 : safeArea.bottom }}>
                        <RoundButton
                            title={t('qr.requestPermission')}
                            style={{ marginBottom: 32, marginTop: 16 }}
                            onPress={(async () => {
                                if (Platform.OS === 'ios') {
                                    Linking.openURL('app-settings:');
                                } else if (Platform.OS === 'android') {
                                    const pkg = Application.applicationId;
                                    IntentLauncher.startActivityAsync(
                                        IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
                                        { data: 'package:' + pkg }
                                    );
                                }
                            })}
                        />
                    </View>
                )}
            </View>
        );
    }

    const rectSize = dimensions.screen.width - (45 * 2);
    const topLeftOuter0 = rrect(rect(0, 0, dimensions.screen.height, dimensions.screen.height), 10, 10);
    const topLeftInner0 = rrect(rect(
        (dimensions.screen.width - rectSize) / 2,
        (dimensions.screen.height - rectSize) / 2 - safeArea.top - safeArea.bottom,
        rectSize,
        rectSize
    ), 16, 16);

    return (
        <View style={styles.container}>
            {Platform.OS === 'ios' ? <StatusBar style={'light'} /> : null}

            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                <Camera
                    ref={cameraRef}
                    onBarCodeScanned={!isActive ? undefined : onScanned}
                    style={[
                        StyleSheet.absoluteFill,
                        Platform.select({ android: { marginTop: imagePadding, marginBottom: imagePadding } })
                    ]}
                    flashMode={flashOn ? FlashMode.torch : FlashMode.off}
                    onCameraReady={onCameraReady}
                    ratio={ratio}
                />
            </View>

            <Canvas style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                justifyContent: 'center', alignItems: 'center',
                paddingHorizontal: 16,
            }}>
                <DiffRect key={'dr-top-left'} inner={topLeftInner0} outer={topLeftOuter0} color={'rgba(0,0,0,0.5)'} />
            </Canvas>
            <View style={{
                position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
                justifyContent: 'center', alignItems: 'center',
                paddingTop: rectSize / 2 + 16 + safeArea.top + safeArea.bottom,
            }}>
                <Text style={{
                    fontWeight: '500',
                    fontSize: 17,
                    color: 'white',
                    textAlign: 'center',
                }}>
                    {t('qr.title')}
                </Text>
            </View>
            <View style={{ flexGrow: 1 }} />
            <View style={[
                {
                    flexDirection: 'row',
                    justifyContent: 'space-between', alignItems: 'center',
                    paddingHorizontal: 16
                },
                Platform.select({
                    android: { marginBottom: imagePadding + 16 },
                    ios: { marginBottom: safeArea.bottom === 0 ? 24 : safeArea.bottom + 24 },
                }),
            ]}>
                <Pressable style={(props) => {
                    return {
                        opacity: props.pressed ? 0.5 : 1,
                        width: 48, height: 48,
                        borderRadius: 24,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        justifyContent: 'center', alignItems: 'center',
                    }
                }}
                    onPress={onReadFromMedia}
                >
                    <Photo height={24} width={24} style={{ height: 24, width: 24 }} />
                </Pressable>
                <Pressable style={(props) => {
                    return {
                        opacity: props.pressed ? 0.5 : 1,
                        width: 48, height: 48,
                        borderRadius: 24,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        justifyContent: 'center', alignItems: 'center',
                    }
                }}
                    onPress={() => { setFlashOn(!flashOn); }}
                >
                    {flashOn
                        ? <Animated.View entering={FadeIn} exiting={FadeOut}>
                            <FlashOn height={24} width={24} style={{ height: 24, width: 24 }} />
                        </Animated.View>
                        : <Animated.View entering={FadeIn} exiting={FadeOut}>
                            <FlashOff height={24} width={24} style={{ height: 24, width: 24 }} />
                        </Animated.View>
                    }

                </Pressable>
            </View>
            <ScreenHeader
                style={[
                    { position: 'absolute', left: 0, right: 0 },
                    Platform.select({
                        android: { top: imagePadding },
                        ios: { top: 0 },
                    })
                ]}
                onClosePressed={() => {
                    setActive(false);
                    setTimeout(() => {
                        navigation.goBack();
                    }, 10);
                }}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexGrow: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: 'rgba(30,30,30,0.9)'
    },
});