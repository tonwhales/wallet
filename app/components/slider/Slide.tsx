import { useDimensions } from "@react-native-community/hooks";
import React, { memo } from "react";
import { View, Text, Image, ImageSourcePropType } from "react-native";
import { useTheme } from "../../engine/hooks";

export const Slide = memo((
    {
        upperNote,
        title,
        subtitle,
        illustration
    }: {
        upperNote: string,
        title: string,
        subtitle: string,
        illustration: ImageSourcePropType
    }
) => {
    const theme = useTheme();
    const dimensions = useDimensions();
    const imgWidth = dimensions.screen.height > 800 ? dimensions.screen.width - 64 : 248;

    return (
        <View style={{
            width: dimensions.screen.width,
            justifyContent: 'center', alignItems: 'center',
        }}>
            <View style={{ justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
                <Text style={{
                    fontSize: 17, lineHeight: 24,
                    fontWeight: '600',
                    textAlign: 'center',
                    color: theme.textSecondary,
                    marginBottom: 4
                }}>
                    {upperNote}
                </Text>
                <Text style={{
                    fontSize: 32, lineHeight: 38,
                    fontWeight: '600',
                    textAlign: 'center',
                    color: theme.textPrimary,
                    marginBottom: 12
                }}>
                    {title}
                </Text>
                <Text
                    style={{
                        textAlign: 'center',
                        fontSize: 17, lineHeight: 24,
                        fontWeight: '400',
                        flexShrink: 1,
                        color: theme.textSecondary,
                        marginBottom: 0,
                        minHeight: 72
                    }}
                    numberOfLines={3}
                    lineBreakMode={'tail'}
                >
                    {subtitle}
                </Text>
            </View>
            <View style={{
                justifyContent: 'center', alignItems: 'center',
                aspectRatio: 0.92,
                width: imgWidth,
            }}>
                <Image
                    resizeMode={'contain'}
                    style={{ width: imgWidth }}
                    source={illustration}
                />
            </View>
        </View>
    );
});