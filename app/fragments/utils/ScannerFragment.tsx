import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, StyleSheet, Pressable, Platform, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Application from 'expo-application';
import * as IntentLauncher from 'expo-intent-launcher';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import { t } from '../../i18n/t';
import { systemFragment } from '../../systemFragment';
import { RoundButton } from '../../components/RoundButton';
import { useAppConfig } from '../../utils/AppConfigContext';
import { useDimensions } from '@react-native-community/hooks';
import { ScreenHeader } from '../../components/ScreenHeader';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Canvas, rrect, rect, DiffRect } from '@shopify/react-native-skia';
import * as RNImagePicker from 'expo-image-picker';
import { BarCodeScanner, BarCodeScannerResult } from 'expo-barcode-scanner';
import { Camera, FlashMode } from 'expo-camera';

import FlashOn from '../../../assets/ic-flash-on.svg';
import FlashOff from '../../../assets/ic-flash-off.svg';
import Photo from '../../../assets/ic-photo.svg';

export const ScannerFragment = systemFragment(() => {
    const { Theme } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const route = useRoute().params;
    const dimentions = useDimensions();
    const navigation = useNavigation();

    const [hasPermission, setHasPermission] = useState<null | boolean>(null);
    const [isActive, setActive] = useState(true);
    const [flashOn, setFlashOn] = useState(false);

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

    if (hasPermission === null) {
        return (
            <View style={styles.container}>
                <View style={{
                    alignSelf: 'center',
                    width: 170,
                    backgroundColor: 'rgba(30,30,30,1)',
                    borderRadius: 16,
                    justifyContent: 'center', alignItems: 'center',
                    paddingHorizontal: 17,
                    paddingVertical: 16
                }}>
                    <Text style={{
                        fontWeight: '500',
                        fontSize: 17,
                        color: 'white',
                        textAlign: 'center'
                    }}
                    >
                        {t('qr.requestingPermission')}
                    </Text>
                </View>
                <ScreenHeader
                    tintColor={'white'}
                    style={{ position: 'absolute', top: safeArea.top, left: 0, right: 0 }}
                    onBackPressed={() => {
                        setActive(false);
                        setTimeout(() => {
                            navigation.goBack();
                        }, 10);
                    }}
                />
            </View>
        );
    }

    if (hasPermission === false) {
        return (
            <View style={[styles.container, { backgroundColor: 'white', alignItems: 'center' }]}>
                <View style={{ flexGrow: 1 }} />
                <View style={{
                    width: dimentions.window.width - 32,
                    aspectRatio: 1,
                    borderColor: Theme.accent, borderWidth: 1, borderStyle: 'dashed',
                    marginBottom: 32
                }}>

                </View>
                <Text style={{
                    fontWeight: '600',
                    fontSize: 32, lineHeight: 38,
                    color: Theme.textColor,
                    textAlign: 'center'
                }}
                >
                    {t('qr.noPermission')}
                </Text>
                <View style={{
                    flexGrow: 1
                }} />
                <View style={{
                    height: 64,
                    marginTop: 16, marginHorizontal: 16, marginBottom: safeArea.bottom === 0 ? 16 : safeArea.bottom,
                    alignSelf: 'stretch'
                }}>
                    <RoundButton
                        title={t('qr.requestPermission')}
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
                <ScreenHeader
                    tintColor={Theme.accent}
                    style={{ position: 'absolute', top: safeArea.top, left: 0, right: 0 }}
                    onBackPressed={() => {
                        setActive(false);
                        setTimeout(() => {
                            navigation.goBack();
                        }, 10);
                    }}
                />
            </View>
        );
    }

    const rectSize = dimentions.screen.width - (45 * 2);
    const topLeftOuter0 = rrect(rect(0, 0, dimentions.screen.height, dimentions.screen.height), 10, 10);
    const topLeftInner0 = rrect(rect(
        (dimentions.screen.width - rectSize) / 2,
        (dimentions.screen.height - rectSize) / 2 - safeArea.top - safeArea.bottom,
        rectSize,
        rectSize
    ), 16, 16);

    return (
        <View style={styles.container}>
            <StatusBar style='light' />

            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                <Camera
                    onBarCodeScanned={!isActive ? undefined : onScanned}
                    style={StyleSheet.absoluteFill}
                    flashMode={flashOn ? FlashMode.torch : FlashMode.off}
                />
            </View>

            <Canvas style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                justifyContent: 'center', alignItems: 'center',
                paddingHorizontal: 17,

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
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between', alignItems: 'center',
                paddingHorizontal: 16,
                marginBottom: safeArea.bottom === 0 ? 24 : safeArea.bottom + 24,
            }}>
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
                tintColor={'white'}
                style={{ position: 'absolute', top: safeArea.top, left: 0, right: 0 }}
                onBackPressed={() => {
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
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: 'rgba(30,30,30,0.9)'
    },
});