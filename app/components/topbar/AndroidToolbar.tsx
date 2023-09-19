import { useNavigation } from "@react-navigation/native";
import React, { ReactNode, useMemo } from "react"
import { View, Text, Platform, StyleProp, ViewStyle, TouchableNativeFeedback } from "react-native"
import { Ionicons } from '@expo/vector-icons';
import { useAppConfig } from "../../utils/AppConfigContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const AndroidToolbar = React.memo((props: {
    style?: StyleProp<ViewStyle>,
    pageTitle?: string,
    onBack?: () => void,
    textColor?: string,
    tintColor?: string,
    titleComponent?: ReactNode,
    rightButton?: ReactNode,
    leftButton?: ReactNode,
}) => {
    const safeArea = useSafeAreaInsets();
    const { Theme } = useAppConfig();
    const navigation = useNavigation();

    const leftButton = useMemo(() => {
        return props.leftButton ? props.leftButton : (
            (navigation.canGoBack() || !!props.onBack) ? (
                <TouchableNativeFeedback
                    onPress={() => {
                        if (props.onBack) {
                            props.onBack();
                        } else {
                            navigation.goBack();
                        }
                    }}
                    background={TouchableNativeFeedback.Ripple(Theme.divider, true, 24)}
                    hitSlop={{ top: 8, left: 8, bottom: 0, right: 8 }}
                >
                    <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="arrow-back-outline" size={28} color={props.tintColor ?? Theme.accent} />
                    </View>
                </TouchableNativeFeedback>
            ) : null
        );
    }, [props.leftButton]);

    const rightButton = useMemo(() => {
        return props.rightButton ? props.rightButton : null;
    }, [props.rightButton]);

    if (Platform.OS === 'ios') {
        return null;
    }

    return (
        <View style={[
            {
                flexDirection: 'row',
                paddingHorizontal: 16,
                alignItems: 'center',
                width: '100%',
                marginTop: safeArea.top
            },
            props.style
        ]}>
            {leftButton}
            {props.titleComponent
                ? (
                    <View style={{ marginLeft: 32, maxWidth: '70%' }}>
                        {props.titleComponent}
                    </View>
                )
                : (!!props.pageTitle &&
                    <Text
                        style={{
                            alignItems: 'center',
                            fontSize: 22, color: props.textColor ?? Theme.textPrimary, fontWeight: '700',
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
                )
            }
            {rightButton}
        </View>
    );
});