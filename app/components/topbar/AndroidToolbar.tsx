import { useNavigation } from "@react-navigation/native";
import React from "react"
import { View, Text, Platform, StyleProp, ViewStyle, TouchableNativeFeedback } from "react-native"
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../engine/hooks';

export const AndroidToolbar = React.memo((props: { style?: StyleProp<ViewStyle>, pageTitle?: string, onBack?: () => void, accentColor?: string }) => {
    if (Platform.OS === 'ios') {
        return null;
    }

    const theme = useTheme();
    const navigation = useNavigation();

    return (
        <View style={[
            {
                height: 56,
                flexDirection: 'row',
                padding: 16,
                alignItems: 'center',
                width: '100%',
            },
            props.style
        ]}>
            {(navigation.canGoBack() || !!props.onBack) && (
                <TouchableNativeFeedback
                    onPress={() => {
                        if (props.onBack) {
                            props.onBack();
                        } else {
                            navigation.goBack();
                        }
                    }}
                    background={TouchableNativeFeedback.Ripple(theme.surfaceOnElevation, true, 24)} hitSlop={{ top: 8, left: 8, bottom: 0, right: 8 }}
                >
                    <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="arrow-back-outline" size={28} color={props.accentColor ?? theme.accent} />
                    </View>
                </TouchableNativeFeedback>
            )}
            {!!props.pageTitle && (
                <Text
                    style={{
                        alignItems: 'center',
                        fontSize: 22, color: theme.textPrimary, fontWeight: '700',
                        flexGrow: 1,
                        marginLeft: 32,
                        height: 56,
                        includeFontPadding: false,
                        textAlignVertical: 'center',
                    }}
                    numberOfLines={1}
                    ellipsizeMode={"tail"}
                >
                    {props.pageTitle}
                </Text>
            )}
        </View>
    );
});