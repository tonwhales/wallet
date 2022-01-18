import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button, Image } from 'react-native';
import { BarCodeScanner, BarCodeEvent } from 'expo-barcode-scanner';
import { ModalHeader } from '../../components/ModalHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fragment } from '../../fragment';
import { StatusBar } from 'expo-status-bar';
import { useRoute } from '@react-navigation/native';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { Deferred } from '../../components/Deferred';

export const ScannerFragment = fragment(() => {
    const [hasPermission, setHasPermission] = useState<null | boolean>(null);
    const [scanned, setScanned] = useState(false);
    const safeArea = useSafeAreaInsets();
    const route = useRoute().params;
    const navigation = useTypedNavigation();

    useEffect(() => {
        (async () => {
            const { status } = await BarCodeScanner.requestPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const handleBarCodeScanned = (params: BarCodeEvent) => {
        setScanned(true);
        navigation.goBack();
        if (route && (route as any).callback) {
            (route as any).callback(params.data);
        }
    };

    if (hasPermission === null) {
        return <Text>Requesting for camera permission</Text>;
    }
    if (hasPermission === false) {
        return <Text>No access to camera</Text>;
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <Deferred>
                <BarCodeScanner
                    barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
                    onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                    style={StyleSheet.absoluteFillObject}
                />
            </Deferred>
            <View style={{ flexDirection: 'column', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                <View style={{ alignSelf: 'stretch', flexGrow: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} />
                <View style={{ flexDirection: 'row', alignSelf: 'stretch' }}>
                    <View style={{ alignSelf: 'stretch', flexGrow: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} />
                    <Image source={require('../../../assets/frame.png')} />
                    <View style={{ alignSelf: 'stretch', flexGrow: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} />
                </View>
                <View style={{ alignSelf: 'stretch', flexGrow: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} />
            </View>
            <View style={{ position: 'absolute', top: safeArea.top, left: 0, right: 0 }}>
                <ModalHeader />
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
    },
});