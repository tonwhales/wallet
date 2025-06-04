import React, { memo, useCallback, useMemo } from "react"
import { View, Pressable } from "react-native"
import { PasscodeKey, PasscodeKeyButton } from "./PasscodeKeyButton";
import { useTheme } from "../../engine/hooks";

export const PasscodeKeyboard = memo(({
    onKeyPress,
    leftIcon,
    isLoading
}: {
    onKeyPress: (key: PasscodeKey) => void,
    leftIcon?: any,
    isLoading?: boolean,
}) => {
    const theme = useTheme();

    const renderKey = useCallback((key: PasscodeKey) => {
        return (
            <PasscodeKeyButton
                key={key}
                passcodeKey={key}
                onPress={() => onKeyPress(key)}
                isLoading={isLoading}
            />
        )
    }, [isLoading, onKeyPress])

    const leftButton = useMemo(() => {
        if (!leftIcon) {
            return <View style={{ flexGrow: 1 }} />;
        }
        
        return (
            <Pressable
                onPress={() => onKeyPress(PasscodeKey.LeftActionKey)}
                disabled={isLoading}
                style={({ pressed }) => {
                    return {
                        height: 60, width: 60,
                        marginHorizontal: 30, borderRadius: 30,
                        justifyContent: 'center', alignItems: 'center',
                        backgroundColor: pressed ? theme.border : undefined,
                        opacity: isLoading ? 0.5 : 1,
                    }
                }}
            >
                {leftIcon}
            </Pressable>
        );
    }, [leftIcon, theme.border, onKeyPress, isLoading]);

    return (
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <View style={{ flexDirection: 'row' }}>
                {renderKey(PasscodeKey.One)}
                {renderKey(PasscodeKey.Two)}
                {renderKey(PasscodeKey.Three)}
            </View>
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
                {renderKey(PasscodeKey.Four)}
                {renderKey(PasscodeKey.Five)}
                {renderKey(PasscodeKey.Six)}
            </View>
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
                {renderKey(PasscodeKey.Seven)}
                {renderKey(PasscodeKey.Eight)}
                {renderKey(PasscodeKey.Nine)}
            </View>
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
                {leftButton}
                {renderKey(PasscodeKey.Zero)}
                {renderKey(PasscodeKey.Backspace)}
            </View>
        </View>
    );
})