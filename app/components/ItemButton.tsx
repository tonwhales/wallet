import * as React from 'react';
import { Pressable, View, Text, Image, ImageSourcePropType } from 'react-native';
import Animated from 'react-native-reanimated';
import { useAnimatedPressedInOut } from '../utils/useAnimatedPressedInOut';
import { useTheme } from '../engine/hooks';
import { memo } from 'react';

import Chevron from '@assets/ic-chevron-down.svg';

export const ItemButton = memo((props: {
    title?: string,
    hint?: string,
    onPress?: () => void,
    dangerZone?: boolean,
    leftIcon?: ImageSourcePropType,
    leftIconComponent?: any,
}) => {
    const theme = useTheme();
    const { onPressIn, onPressOut, animatedStyle } = useAnimatedPressedInOut();

    return (
        <Pressable
            style={{ width: '100%' }}
            onPress={props.onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
        >
            <Animated.View style={[
                {
                    flexDirection: 'row',
                    alignItems: 'center',
                    flexShrink: 1
                },
                animatedStyle
            ]}>
                <View style={{
                    alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'row', flexGrow: 1, flexBasis: 0,
                    padding: 20
                }}>
                    <View style={{ flexGrow: 1, flexShrink: 1, flexDirection: 'row', alignItems: 'center' }}>
                        {props.leftIcon && (<Image style={{ height: 24, width: 24 }} source={props.leftIcon} />)}
                        {!!props.leftIconComponent && (
                            <View style={{ height: 24, width: 24, justifyContent: 'center', alignItems: 'center' }}>
                                {props.leftIconComponent}
                            </View>
                        )}
                        <Text
                            style={{
                                fontSize: 17, lineHeight: 24,
                                fontWeight: props.dangerZone ? '500' : '600',
                                textAlignVertical: 'center',
                                color: props.dangerZone ? theme.accentRed : theme.textPrimary,
                                marginLeft: (props.leftIcon || props.leftIconComponent) ? 13 : 0,
                                paddingRight: 8,
                            }}
                            numberOfLines={1}
                            ellipsizeMode={'tail'}
                        >
                            {props.title}
                        </Text>
                    </View>
                    {props.hint && (
                        <View style={{ flexGrow: 0, flexShrink: 0, paddingLeft: 8 }}>
                            <Text style={{ height: 24, fontSize: 17, textAlignVertical: 'center', color: theme.textSecondary }}>
                                {props.hint}
                            </Text>
                        </View>
                    )}
                </View>
                <Chevron
                    height={16} width={16}
                    style={{
                        height: 16, width: 16,
                        marginRight: 20,
                        transform: [{ rotate: '-90deg' }]
                    }}
                />
            </Animated.View>
        </Pressable>
    )
});