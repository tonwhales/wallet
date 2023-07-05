import { useDimensions } from "@react-native-community/hooks";
import React from "react";
import { View, Text, Image, ImageSourcePropType } from "react-native";
import { useAppConfig } from "../../utils/AppConfigContext";

export const Slide = React.memo((
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
    const { Theme } = useAppConfig();
    const dimensions = useDimensions();
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
                    color: Theme.darkGrey,
                    marginBottom: 4
                }}>
                    {upperNote}
                </Text>
                <Text style={{
                    fontSize: 32, lineHeight: 38,
                    fontWeight: '600',
                    textAlign: 'center',
                    color: Theme.textColor,
                    marginBottom: 12
                }}>
                    {title}
                </Text>
                <Text style={{
                    textAlign: 'center',
                    fontSize: 17, lineHeight: 24,
                    fontWeight: '400',
                    marginTop: 14,
                    flexShrink: 1,
                    color: Theme.darkGrey,
                    marginBottom: 32
                }}>
                    {subtitle}
                </Text>
            </View>
            <View style={{
                width: dimensions.screen.width, height: 300,
                justifyContent: 'center', alignItems: 'center',
            }}>
                <Image source={illustration} />
            </View>
            <View style={{ flexGrow: 1 }} />
        </View>
    );
});