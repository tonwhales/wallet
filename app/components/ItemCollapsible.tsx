import React, { useEffect, useState } from 'react';
import { Pressable, View, Text, ViewStyle, StyleProp, TextStyle } from 'react-native';
import Collapsible from 'react-native-collapsible';
import Chevron from '../../assets/ic_chevron_down.svg'
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useAppConfig } from '../utils/AppConfigContext';

export const ItemCollapsible = React.memo((
    {
        title,
        children,
        hideDivider,
        style,
        titleStyle
    }: {
        title?: string,
        children?: any,
        hideDivider?: boolean,
        style?: StyleProp<ViewStyle>,
        titleStyle?: StyleProp<TextStyle>
    }) => {
    const { Theme } = useAppConfig();
    const [collapsed, setCollapsed] = useState(true);

    const rotation = useSharedValue(0);

    const animatedChevron = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${interpolate(rotation.value, [0, 1], [0, -180])}deg` }],
        }
    }, []);

    useEffect(() => {
        rotation.value = withTiming(collapsed ? 0 : 1, { duration: 150 });
    }, [collapsed])

    return (
        <View style={[
            { padding: 20, backgroundColor: Theme.border, borderRadius: 20 },
            style
        ]}>
            <Pressable
                style={({ pressed }) => {
                    return {
                        opacity: pressed ? 0.5 : 1,
                        flexDirection: 'row',
                        justifyContent: 'center'
                    }
                }}
                onPress={() => {
                    setCollapsed(!collapsed)
                }}
            >
                {!!title && (
                    <Text style={[{
                        fontWeight: '400',
                        fontSize: 16,
                        color: Theme.textColor,
                        alignSelf: 'center'
                    }, titleStyle]}>
                        {title}
                    </Text>
                )}
                <View style={{ flexGrow: 1 }} />
                <Animated.View style={[
                    {
                        height: 32, width: 32,
                        borderRadius: 16,
                        justifyContent: 'center', alignItems: 'center',
                        alignSelf: 'center',
                        backgroundColor: Theme.divider
                    },
                    animatedChevron
                ]}>
                    <Chevron style={{ height: 12, width: 12 }} height={12} width={12} />
                </Animated.View>
            </Pressable>
            <Collapsible collapsed={collapsed}>
                {!hideDivider && (<View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginVertical: 16 }} />)}
                {children}
            </Collapsible>
        </View>
    );
});