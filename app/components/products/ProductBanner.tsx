import React from "react";
import { TouchableHighlight, View, Text, ImageSourcePropType, Image } from "react-native";
import { useAppConfig } from "../../utils/AppConfigContext";

export const ProductBanner = React.memo((props: {
    onPress?: () => void,
    title: string,
    subtitle?: string,
    illustration?: ImageSourcePropType,
    reverse?: boolean
}) => {
    const { Theme } = useAppConfig();

    return (
        <TouchableHighlight
            onPress={props.onPress}
            underlayColor={Theme.selector}
            style={{
                height: 106,
                backgroundColor: '#F7F8F9',
                borderRadius: 20,
            }}
        >
            <View style={{ flexDirection: 'row', flexGrow: 1, alignItems: 'center' }}>
                {(!!props.illustration && props.reverse) && (
                    <View style={{ height: 70, width: 96, backgroundColor: 'white', borderRadius: 10, marginLeft: 19 }}>
                        <Image source={props.illustration} style={{ height: 70, width: 96 }} />
                    </View>
                )}
                <View style={{
                    justifyContent: 'space-between', padding: 20, paddingRight: 15,
                    flexGrow: 1, flexShrink: 1
                }}>
                    <Text style={{ color: Theme.textColor, fontWeight: '600', fontSize: 17, lineHeight: 24 }}
                        ellipsizeMode={'tail'}
                        numberOfLines={1}
                    >
                        {props.title}
                    </Text>
                    {!!props.subtitle && (
                        <Text
                            style={{
                                color: '#838D99',
                                fontSize: 15,
                                lineHeight: 20,
                                flex: 1, flexShrink: 1
                            }}
                            ellipsizeMode={'tail'}
                        >
                            {props.subtitle}
                        </Text>
                    )}
                </View>
                {(!!props.illustration && !props.reverse) && (
                    <View style={{ height: 106, width: 106 }}>
                        <Image source={props.illustration} style={{ height: 106, width: 106 }} />
                    </View>
                )}
            </View>
        </TouchableHighlight>
    );
});