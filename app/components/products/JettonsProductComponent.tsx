import React, { useEffect, useState } from "react";
import { Pressable, View, Text } from "react-native";
import { useEngine } from "../../engine/Engine";
import { JettonProductItem } from "./JettonProductItem";
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useAppConfig } from "../../utils/AppConfigContext";
import Chevron from '../../../assets/ic_chevron_down.svg';
import Tokens from '../../../assets/ic-one.svg';
import Collapsible from "react-native-collapsible";
import { t } from "../../i18n/t";

export const JettonsProductComponent = React.memo(() => {
    const engine = useEngine();
    const { Theme } = useAppConfig();

    const jettons = engine.products.main.useJettons().filter((j) => !j.disabled);
    const [collapsed, setCollapsed] = useState(true);

    const rotation = useSharedValue(0);
    const animatedChevron = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${interpolate(rotation.value, [0, 1], [0, 180])}deg` }],
        }
    }, []);
    useEffect(() => {
        rotation.value = withTiming(collapsed ? 0 : 1, { duration: 150 });
    }, [collapsed]);

    if (jettons.length === 0) {
        return null;
    }

    if (jettons.length <= 2) {
        return (
            <View style={{
                borderRadius: 20,
                backgroundColor: '#F7F8F9',
            }}>
                {jettons.map((j, index) => {
                    return (
                        <JettonProductItem
                            key={'jt' + j.wallet.toFriendly()}
                            jetton={j}
                            engine={engine}
                            last={index === jettons.length - 1}
                        />
                    );
                })}
            </View>
        );
    }

    return (
        <View style={{
            borderRadius: 20,
            backgroundColor: '#F7F8F9',
        }}>
            <Pressable
                style={({ pressed }) => {
                    return {
                        opacity: pressed ? 0.3 : 1,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        padding: 20,
                    }
                }}
                onPress={() => {
                    setCollapsed(!collapsed)
                }}
            >
                <View style={{
                    height: 46, width: 46,
                    borderRadius: 23,
                    marginRight: 12,
                    justifyContent: 'center', alignItems: 'center',
                    backgroundColor: Theme.accent
                }}>
                    <View style={{ height: 32, width: 32 }}>
                        <View style={{ justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                            <View style={{
                                height: 17, width: 17,
                                position: 'absolute',
                                top: 3, right: 3,
                                backgroundColor: 'white',
                                borderRadius: 9
                            }} />
                            <View style={{
                                height: 24, width: 24,
                                position: 'absolute',
                                bottom: 3, left: 3,
                                backgroundColor: Theme.accent,
                                borderRadius: 12
                            }} />
                            <Tokens
                                height={20} width={20}
                                style={{ height: 20, width: 20, position: 'absolute', bottom: 3, left: 3 }}
                                color={'white'}
                            />
                        </View>
                    </View>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{
                        fontWeight: '600',
                        fontSize: 17,
                        lineHeight: 24,
                        color: Theme.textColor,
                    }}>
                        {t('jetton.productButtonTitle', { count: jettons.length })}
                    </Text>
                    <Text style={{
                        fontWeight: '400',
                        fontSize: 15,
                        lineHeight: 20,
                        color: '#838D99'
                    }}>
                        {t('jetton.productButtonSubtitle', { count: jettons.length - 1, jettonName: jettons[0].name })}
                    </Text>
                </View>
                <Animated.View style={[
                    {
                        height: 12, width: 12,
                        justifyContent: 'center', alignItems: 'center',
                        alignSelf: 'center'
                    },
                    animatedChevron
                ]}>
                    <Chevron />
                </Animated.View>
            </Pressable>
            <Collapsible renderChildrenCollapsed={true} collapsed={collapsed}>
                {jettons.map((j, index) => {
                    return (
                        <JettonProductItem
                            key={'jt' + j.wallet.toFriendly()}
                            jetton={j}
                            engine={engine}
                            last={index === jettons.length - 1}
                        />
                    );
                })}
            </Collapsible>
        </View>
    );
});