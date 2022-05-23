import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Image, Pressable, Platform, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fragment } from '../../fragment';
import { StatusBar } from 'expo-status-bar';
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { Camera } from 'react-native-vision-camera';
import { useScanBarcodes, BarcodeFormat, BarcodeValueType } from 'vision-camera-code-scanner';
import { useCameraDevices } from 'react-native-vision-camera';
import { CloseButton } from '../../components/CloseButton';
import { t } from '../../i18n/t';
import { systemFragment } from '../../systemFragment';
import { RoundButton } from '../../components/RoundButton';

export const ScannerFragment = systemFragment(() => {
    const safeArea = useSafeAreaInsets();
    const route = useRoute().params;
    const navigation = useNavigation();

    const [hasPermission, setHasPermission] = useState<null | boolean>(null);
    const [isActive, setActive] = useState(true);
    const [flashOn, setFlashOn] = useState(false);

    const isFocused = useIsFocused();
    const devices = useCameraDevices('wide-angle-camera');
    const device = devices.back;

    const [frameProcessor, barcodes] = useScanBarcodes([BarcodeFormat.QR_CODE]);

    useEffect(() => {
        (async () => {
            const status = await Camera.requestCameraPermission();
            setHasPermission(status === 'authorized');
        })();
    }, []);

    useEffect(() => {
        if (barcodes && barcodes.length > 0 && barcodes[0]) {
            if (route && (route as any).callback) {
                setActive(false);

                setTimeout(() => {
                    navigation.goBack();
                    if (barcodes[0].content.type === BarcodeValueType.URL) {
                        (route as any).callback(barcodes[0].content.data.url);
                    } else if (barcodes[0].content.type === BarcodeValueType.TEXT) {
                        (route as any).callback(barcodes[0].content.data);
                    } else if (barcodes[0].content.type === BarcodeValueType.UNKNOWN) {
                        (route as any).callback(barcodes[0].content.data);
                    }
                }, 10);
            }
        }
    }, [barcodes, route]);

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
                <CloseButton
                    style={{ position: 'absolute', top: Platform.OS === 'android' ? 12 + safeArea.top : 12, right: 10 }}
                    onPress={() => {
                        setActive(false);
                        setTimeout(navigation.goBack, 10);
                    }}
                    dark
                />
            </View>
        );
    }

    if (hasPermission === false) {
        return (
            <View style={styles.container}>
                <View style={{
                    flexGrow: 1
                }} />
                <View style={{
                    alignSelf: 'center',
                    width: 170,
                    backgroundColor: 'rgba(30,30,30,1)',
                    borderRadius: 16,
                    justifyContent: 'center', alignItems: 'center',
                    paddingHorizontal: 17,
                    paddingVertical: 16,
                }}>
                    <Text style={{
                        fontWeight: '500',
                        fontSize: 17,
                        color: 'white',
                        textAlign: 'center'
                    }}
                    >
                        {t('qr.noPermission')}
                    </Text>
                </View>
                <View style={{
                    flexGrow: 1
                }} />
                <View style={{ height: 64, marginTop: 16, marginHorizontal: 16, marginBottom: safeArea.bottom, alignSelf: 'stretch' }}>
                    <RoundButton
                        title={t('qr.requestPermission')}
                        onPress={(async () => {
                            const status = await Camera.requestCameraPermission();
                            if (status === 'authorized') {
                                setHasPermission(status === 'authorized');
                            } else {
                                Alert.alert(
                                    t('qr.denied'),
                                    t('qr.privacySettingsMessage'),
                                    [{ text: t('common.back') }]
                                );
                            }
                        })}
                    />
                </View>
                <CloseButton
                    style={{ position: 'absolute', top: Platform.OS === 'android' ? 12 + safeArea.top : 12, right: 10 }}
                    onPress={() => {
                        setActive(false);
                        setTimeout(navigation.goBack, 10);
                    }}
                    dark
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style='light' />
            {(!device || !isActive) && (
                <ActivityIndicator color={'white'} />
            )}
            {device && isActive && (
                <Camera
                    style={StyleSheet.absoluteFill}
                    device={device}
                    isActive={isActive && isFocused}
                    frameProcessor={frameProcessor}
                    frameProcessorFps={2}
                    torch={flashOn ? 'on' : 'off'}
                />
            )}
            <View style={{ flexDirection: 'column', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                <View style={{ alignSelf: 'stretch', flexGrow: 1 }} />
                <View style={{ flexDirection: 'row', alignSelf: 'stretch' }}>
                    <View style={{ alignSelf: 'stretch', flexGrow: 1 }} />
                    <Image style={{ height: 232, width: 232 }} source={require('../../../assets/frame.png')} />
                    <View style={{ alignSelf: 'stretch', flexGrow: 1 }} />
                </View>
                <View style={{ alignSelf: 'stretch', flexGrow: 1 }} />
            </View>
            <Pressable style={(props) => {
                return {
                    position: 'absolute', bottom: safeArea.bottom + 86,
                    alignSelf: 'center',
                    height: 61, width: 61,
                    opacity: props.pressed ? 0.5 : 1,
                }
            }}
                onPress={() => { setFlashOn(!flashOn); }}
            >
                <Image style={{ height: 61, width: 61 }} source={flashOn ? require('../../../assets/ic_flash_on.png') : require('../../../assets/ic_flash.png')} />
            </Pressable>
            <View style={{
                position: 'absolute', top: safeArea.top + 77,
                alignSelf: 'center',
                height: 50, width: 170,
                backgroundColor: 'rgba(30,30,30,1)',
                borderRadius: 16,
                justifyContent: 'center', alignItems: 'center',
                paddingHorizontal: 17
            }}>
                <Text style={{
                    fontWeight: '500',
                    fontSize: 17,
                    color: 'white',
                    textAlign: 'center'
                }}>
                    {t('qr.title')}
                </Text>
            </View>
            <CloseButton
                style={{ position: 'absolute', top: Platform.OS === 'android' ? 12 + safeArea.top : 12, right: 10 }}
                onPress={() => {
                    setActive(false);
                    setTimeout(navigation.goBack, 10);
                }}
                dark
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