import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button, Image, Pressable, Platform, useWindowDimensions } from 'react-native';
import { BarCodeScanner, BarCodeEvent } from 'expo-barcode-scanner';
import { ModalHeader } from '../../components/ModalHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fragment } from '../../fragment';
import { StatusBar } from 'expo-status-bar';
import { useRoute } from '@react-navigation/native';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { Deferred } from '../../components/Deferred';
import { useTranslation } from 'react-i18next';
import { Camera } from 'react-native-vision-camera';
import { useScanBarcodes, BarcodeFormat, BarcodeValueType } from 'vision-camera-code-scanner';
import { useCameraDevices } from 'react-native-vision-camera';


export const ScannerFragment = fragment(() => {
    const { t } = useTranslation();
    const window = useWindowDimensions();
    const [hasPermission, setHasPermission] = useState<null | boolean>(null);
    const [scanned, setScanned] = useState(false);
    const [flashOn, setFlashOn] = useState(false);
    const safeArea = useSafeAreaInsets();
    const route = useRoute().params;
    const navigation = useTypedNavigation();
    const devices = useCameraDevices();
    const device = devices.back;

    const [frameProcessor, barcodes] = useScanBarcodes([BarcodeFormat.QR_CODE]);

    useEffect(() => {
        (async () => {
            const { status } = await BarCodeScanner.requestPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    useEffect(() => {
        if (barcodes && barcodes.length > 0 && barcodes[0]) {
            setScanned(true);
            if (route && (route as any).callback) {
                navigation.goBack();
                if (barcodes[0].content.type === BarcodeValueType.URL) {
                    (route as any).callback(barcodes[0].content.data.url);
                } else if (barcodes[0].content.type === BarcodeValueType.UNKNOWN) {
                    (route as any).callback(barcodes[0].content.data);
                }
            }
        }
    }, [barcodes]);

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
                        {t("Requesting for camera permission...")}
                    </Text>
                </View>
            </View>
        );
    }
    if (hasPermission === false) {
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
                        {t("No access to camera")}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="auto" />
            <Deferred>
                {device && (
                    <Camera
                        style={StyleSheet.absoluteFill}
                        device={device}
                        isActive={!scanned}
                        frameProcessor={frameProcessor}
                        frameProcessorFps={5}
                        torch={flashOn ? 'on' : 'off'}
                    />
                )}
            </Deferred>
            <View style={{ flexDirection: 'column', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                <View style={{ alignSelf: 'stretch', flexGrow: 1 }} />
                <View style={{ flexDirection: 'row', alignSelf: 'stretch' }}>
                    <View style={{ alignSelf: 'stretch', flexGrow: 1 }} />
                    <Image height={232} width={232} source={require('../../../assets/frame.png')} />
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
                <Image height={61} width={61} source={flashOn ? require('../../../assets/ic_flash_on.png') : require('../../../assets/ic_flash.png')} />
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
                    color: 'white'
                }}>
                    {'Scan QR code'}
                </Text>
            </View>
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