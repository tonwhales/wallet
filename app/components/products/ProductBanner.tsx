import React from "react";
import { TouchableHighlight, View, Text, ImageSourcePropType, Image } from "react-native";
import { useAppConfig } from "../../utils/AppConfigContext";

export const ProductBanner = React.memo((props: {
    onPress?: () => void,
    title: string,
    subtitle?: string,
    illustration?: ImageSourcePropType,
}) => {
    const { Theme } = useAppConfig();

    return (
        <TouchableHighlight
            onPress={props.onPress}
            underlayColor={Theme.selector}
            style={{
                height: 106,
                backgroundColor: '#F7F8F9',
                borderRadius: 20
            }}
        >
            <View style={{ flexDirection: 'row' }}>
                <View style={{
                    justifyContent: 'space-between', padding: 20, paddingRight: 12,
                    flexGrow: 1, flexShrink: 1
                }}>
                    <Text style={{ color: Theme.textColor, fontWeight: '600', fontSize: 17, lineHeight: 24 }}
                        ellipsizeMode={'tail'}
                        numberOfLines={1}
                    >
                        {props.title}
                    </Text>
                    {!!props.subtitle && (
                        <Text style={{ color: '#838D99', fontSize: 15, lineHeight: 20 }}
                            ellipsizeMode={'tail'}
                        >
                            {props.subtitle}
                        </Text>
                    )}
                </View>
                {(!!props.illustration) && (
                    <View style={{ height: 106, width: 106 }}>
                        <Image source={props.illustration} style={{ height: 106, width: 106 }} />
                    </View>
                )}
            </View>
        </TouchableHighlight>
    );
});