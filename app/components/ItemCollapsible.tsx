import React, { useEffect, useState } from 'react';
import { Pressable, View, Text } from 'react-native';
import Collapsible from 'react-native-collapsible';
import Chevron from '../../assets/ic_chevron_down.svg'
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../engine/hooks/theme/useTheme';

export const ItemCollapsible = React.memo(({ title, children, hideDivider }: { title?: string, children?: any, hideDivider?: boolean }) => {
    const theme = useTheme();
    const [collapsed, setCollapsed] = useState(true);

    const rotation = useSharedValue(0);

    const animatedChevron = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${interpolate(rotation.value, [0, 1], [0, 180])}deg` }],
        }
    }, []);

    useEffect(() => {
        rotation.value = withTiming(collapsed ? 0 : 1, { duration: 150 });
    }, [collapsed])

    return (
        <View>
            <Pressable
                style={({ pressed }) => {
                    return {
                        opacity: pressed ? 0.3 : 1,
                        flexDirection: 'row',
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        justifyContent: 'center'
                    }
                }}
                onPress={() => {
                    setCollapsed(!collapsed)
                }}
            >
                {!!title && (
                    <Text style={{
                        fontWeight: '400',
                        fontSize: 16,
                        color: theme.textColor,
                    }}>
                        {title}
                    </Text>
                )}
                <View style={{ flexGrow: 1 }} />
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
            <Collapsible collapsed={collapsed}>
                {!hideDivider && (<View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider }} />)}
                {children}
            </Collapsible>
        </View>
    );
});