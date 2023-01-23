import React from "react"
import { Image, ImageRequireSource, StyleProp, ViewStyle, Pressable, View, Text } from "react-native"
import { SvgProps } from "react-native-svg";
import { Theme } from "../Theme";

export const WalletActionButton = React.memo(({
    icon,
    source,
    style,
    action,
    title,
    disablePressed
}: {
    icon?: React.FC<SvgProps>,
    source?: ImageRequireSource,
    style?: StyleProp<ViewStyle>,
    title?: string
    action?: () => void,
    disablePressed?: boolean
}) => {
    const Icon = icon;
    return (
        <Pressable
            pointerEvents={!!action ? 'box-none' : 'none'}
            style={({ pressed }) => {
                return [{
                    opacity: (pressed && !disablePressed) ? 0.3 : 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: 58
                }, style]
            }}
            onPress={action}
        >
            <View style={{
                height: 56,
                width: 56,
                backgroundColor: Theme.accent,
                borderRadius: 28,
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                {!!source && <Image source={source} />}
                {!!Icon && (<Icon color={'white'} height={56} width={56} />)}
            </View>
            {(!!title && title.length > 0) && (
                <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    textAlign: 'center',
                    color: Theme.accent,
                    marginTop: 6,
                }}>
                    {title}
                </Text>
            )}
        </Pressable>
    );
});