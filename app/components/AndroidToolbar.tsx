import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect } from "react"
import { View, Text, Platform, StyleProp, ViewStyle, TouchableNativeFeedback, BackHandler } from "react-native"
import { Theme } from "../Theme";
import { Ionicons } from '@expo/vector-icons';
import { useTypedNavigation } from "../utils/useTypedNavigation";

export const AndroidToolbar = React.memo((props: { style?: StyleProp<ViewStyle>, pageTitle?: string, headerRight?: any, backRoute?: string }) => {
    const baseNavigation = useNavigation();
    const navigation = useTypedNavigation();

    const backAction = useCallback(
        () => {
            if (props.backRoute) {
                navigation.popToTop();
                setTimeout(() => navigation.navigate(props.backRoute!), 200);
            }
            return false;
        },
        [props.backRoute],
    );

    useEffect(() => {
        if (props.backRoute) BackHandler.addEventListener("hardwareBackPress", backAction);

        if (props.backRoute) {
            return () => BackHandler.removeEventListener("hardwareBackPress", backAction);
        }
    }, []);

    if (Platform.OS === 'ios') {
        return null;
    }


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
            {(baseNavigation.canGoBack() || props.backRoute) && (
                <TouchableNativeFeedback
                    onPress={() => {
                        if (props.backRoute) {
                            navigation.popToTop();
                            setTimeout(() => navigation.navigate(props.backRoute!), 200);
                            return;
                        }
                        baseNavigation.goBack();
                    }}
                    background={TouchableNativeFeedback.Ripple(Theme.selector, true, 24)} hitSlop={{ top: 8, left: 8, bottom: 0, right: 8 }}
                >
                    <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="arrow-back-outline" size={28} color={Theme.accent} />
                    </View>
                </TouchableNativeFeedback>
            )}
            {!!props.pageTitle && (
                <Text
                    style={{
                        alignItems: 'center',
                        fontSize: 17, color: Theme.textColor, fontWeight: '600',
                        flexGrow: 1,
                        marginLeft: 32,
                        height: 56,
                        includeFontPadding: false,
                        textAlignVertical: 'center',
                    }}
                    numberOfLines={1}
                    ellipsizeMode={"tail"}
                >
                    {`${props.pageTitle}`}
                </Text>
            )}
            {props.headerRight}
        </View>
    );
});