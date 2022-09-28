import * as React from 'react';
import { Platform, ScrollView, View, Image, useWindowDimensions } from "react-native";
import { ItemButton } from "../../components/ItemButton";
import { Theme } from "../../Theme";
import { Item } from '../../components/Item';
import { AppConfig } from '../../AppConfig';
import { useReboot } from '../../utils/RebootContext';
import { fragment } from '../../fragment';
import { storagePersistence } from '../../storage/storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { StatusBar } from 'expo-status-bar';
import { AndroidToolbar } from '../../components/AndroidToolbar';
import { useEngine } from '../../engine/Engine';
import Animated, { interpolate, SensorType, useAnimatedSensor, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { AnimatedSensorImage } from '../../components/Animated/AnimatedSensorImage';

export const DeveloperToolsFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const reboot = useReboot();
    const restart = React.useCallback(() => {
        // TODO: Implement
    }, [])
    const resetCache = React.useCallback(() => {
        storagePersistence.clearAll();
        reboot();
    }, []);

    const engine = useEngine();
    const counter = React.useMemo(() => engine.cloud.counter('counter.sample'), []);
    const counterValue = counter.use().counter;

    const window = useWindowDimensions();
    const cardHeight = Math.floor((window.width / (358 + 32)) * 196);
    const diamondHeight = Math.floor((window.width / (250 + 32)) * 254);

    const DISTANCE = 100;
    const animatedSensor = useAnimatedSensor(SensorType.ROTATION, {
        interval: 10,
    });

    const animatedDiamondStyle = useAnimatedStyle(() => {
        const { qw, qx } = animatedSensor.sensor.value;

        const y = interpolate(qx, [0, 0.5, 1], [1, 0, -1]);

        return {
            transform: [
                { translateX: withSpring((qw * DISTANCE) / 1) },
                { translateY: withSpring((y * DISTANCE) / 1) },
            ],
        };
    });

    // const isTestNet = useTestnet();
    // const switchNetwork = React.useCallback(() => {
    //     let state = (getAppState())!;
    //     setAppState({ ...state, testnet: !state.testnet });
    //     reboot();
    // }, []);
    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={'dark'} />
            <AndroidToolbar pageTitle={'Dev Tools'} />
            <ScrollView>
                <View style={{ backgroundColor: Theme.background, flexGrow: 1, flexBasis: 0, paddingHorizontal: 16, marginTop: 0 }}>
                    <View style={{
                        marginBottom: 16, marginTop: 17,
                        backgroundColor: "white",
                        borderRadius: 14,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexShrink: 1,
                    }}>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton leftIcon={require('../../../assets/ic_sign_out.png')} dangerZone title={'Clean cache and reset'} onPress={resetCache} />
                        </View>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton leftIcon={require('../../../assets/ic_sign_out.png')} dangerZone title={"Restart app"} onPress={restart} />
                        </View>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton title={"Storage Status"} onPress={() => navigation.navigate('DeveloperToolsStorage')} />
                        </View>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton title={"Test Whales"} onPress={() => navigation.navigate('Install', { url: AppConfig.isTestnet ? 'https://sandbox.tonwhales.com/tools/x' : 'https://tonwhales.com/tools/x' })} />
                        </View>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton title={"Test Scaleton"} onPress={() => navigation.navigate('Install', { url: AppConfig.isTestnet ? 'https://sandbox.scaleton.io' : 'https://scaleton.io' })} />
                        </View>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton title={"Test Gems"} onPress={() => navigation.navigate('Install', { url: AppConfig.isTestnet ? 'https://getgems.io' : 'https://getgems.io' })} />
                        </View>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton title={"Cloud Counter"} hint={counterValue.toString()} onPress={() => counter.update((src) => src.counter.increment())} />
                        </View>
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <Item title={"Version"} hint={AppConfig.isTestnet ? 'Testnet' : 'Mainnet'} />
                        </View>
                    </View>
                </View>

                <View
                    style={[
                        {
                            marginHorizontal: 16, marginVertical: 16,
                            height: cardHeight,
                            backgroundColor: Theme.cardBackground,
                            borderRadius: 16,
                            overflow: 'hidden'
                        },
                    ]}
                    collapsable={false}
                >
                    <AnimatedSensorImage
                        source={require('../../../assets/diamond.png')}
                        height={Math.floor(cardHeight * 1.3)}
                        width={Math.floor(cardHeight * 1.3)}
                        layer={10}
                        // x={-105}
                        // y={30}
                        xInput={[-1, -0.5, 0, 0.5, 1]}
                        xOutput={[1.5, 1.5, 0, -0.5, -0.5]}

                        yInput={[-1, -0.5, 0, 0.5, 1]}
                        yOutput={[1.5, 1.5, 0, -0.5, -0.5]}
                        
                        zIndexOutput={[-1, 1]}
                        bottom={-4}
                        right={-Math.floor(cardHeight * 1.3 / 2)}
                    // xDistanceScale={0.01}
                    // yDistanceScale={0.01}
                    />
                    <AnimatedSensorImage
                        height={30}
                        width={30}
                        source={require('../../../assets/card_flare.png')}
                        layer={10}
                        xInput={[-1, -0.5, 0, 0.5, 1]}
                        xOutput={[1.5, 1.5, 0, -0.5, -0.5]}
                        yInput={[-1, -0.5, 0, 0.5, 1]}
                        yOutput={[1.5, 1.5, 0, -0.5, -0.5]}
                        zIndexOutput={[-1, 1]}
                        top={Math.floor(cardHeight * 1.3 * 0.15)}
                        right={Math.floor(cardHeight * 1.3 * 0.12)}
                        xDistanceScale={0.12}
                        yDistanceScale={0.12}
                    />
                    {/* <Animated.Image
                        source={require('../../../assets/diamond.png')}
                        style={[
                            {
                                position: 'absolute',
                                bottom: -4,
                                right: -(window.width - 32 - 232),
                                height: diamondHeight,
                                width: window.width - 32
                            },
                            animatedDiamondStyle
                        ]}
                        resizeMode="stretch"
                        resizeMethod="resize"
                    />
                    <Animated.Image
                        source={require('../../../assets/card_flare.png')}
                        style={[
                            {
                                position: 'absolute',
                                top: 74,
                                right: -4,
                                height: 54,
                                width: 47
                            },
                            animatedDiamondStyle
                        ]}
                        resizeMode="stretch"
                        resizeMethod="resize"
                    /> */}
                </View>
            </ScrollView>
        </View>
    );
});