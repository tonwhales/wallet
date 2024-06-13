import React, { memo } from "react";
import { Pressable, View, Text, StyleProp, ViewStyle } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useTheme } from "../engine/hooks";

import IcCheck from "@assets/ic-check.svg";

export const SelectableButton = memo((
    {
        title,
        subtitle,
        selected,
        onSelect,
        icon,
        hideSelection,
        style
    }: {
        title: string,
        subtitle: string,
        selected?: boolean,
        onSelect?: () => void,
        icon?: any,
        hideSelection?: boolean,
        style?: StyleProp<ViewStyle>
    }
) => {
    const theme = useTheme();

    return (
        <Animated.View style={style} entering={FadeIn} exiting={FadeOut}>
            <Pressable
                style={{
                    backgroundColor: theme.surfaceOnElevation,
                    padding: 20,
                    marginBottom: 16,
                    borderRadius: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
                onPress={onSelect}
            >
                {!!icon && (
                    <View style={{ height: 46, width: 46, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                        {icon}
                    </View>
                )}
                <View style={{ justifyContent: 'center', flexGrow: 1, flex: 1 }}>
                    <Text style={{
                        flexShrink: 1,
                        fontSize: 17, lineHeight: 24, fontWeight: '600',
                        color: theme.textPrimary,
                        marginBottom: 2
                    }}>
                        {title}
                    </Text>
                    <Text
                        numberOfLines={1}
                        style={{
                            flexShrink: 1,
                            fontSize: 15, lineHeight: 20, fontWeight: '400',
                            color: theme.textSecondary,
                        }}
                    >
                        {subtitle}
                    </Text>
                </View>
                {!hideSelection && (
                    <View style={{
                        justifyContent: 'center', alignItems: 'center',
                        height: 24, width: 24,
                        backgroundColor: selected ? theme.accent : theme.divider,
                        borderRadius: 12
                    }}>
                        {selected && (
                            <IcCheck color={theme.white} height={16} width={16} style={{ height: 16, width: 16 }} />
                        )}
                    </View>
                )}
            </Pressable>
        </Animated.View>
    );
});