import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react"
import { Pressable, View, Image, Text, Platform, StyleProp, ViewStyle } from "react-native"
import { Theme } from "../Theme";

export const AndroidToolbar = React.memo((props: { style?: StyleProp<ViewStyle>, pageTitle?: string }) => {
    if (Platform.OS === 'ios') {
        return null;
    }

    const navigation = useNavigation();
    const [backPressedIn, setBackPressedIn] = useState(false);

    return (
        <View style={[
            {
                height: 56,
                flexDirection: 'row',
                padding: 16,
                alignItems: 'center',
                width: '100%'
            },
            props.style
        ]}>
            {navigation.canGoBack() && (
                <Pressable
                    onPressIn={() => setBackPressedIn(true)}
                    onPressOut={() => setBackPressedIn(false)}
                    style={{ height: 28, width: 28, alignItems: 'center', justifyContent: 'center', }}
                    onPress={() => navigation.goBack()}
                >
                    <Image source={
                        backPressedIn
                            ? require('../../assets/ic_back_and_selected.png')
                            : require('../../assets/ic_back_and.png')
                    } />
                </Pressable>
            )}
            {props.pageTitle && (
                <Text
                    style={{
                        fontSize: 22, color: Theme.textColor, fontWeight: '700',
                        flexGrow: 1,
                        marginLeft: 32
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