import React, { memo } from "react";
import { Pressable } from "react-native";
import { useTheme } from "../../engine/hooks";

import ImgKey0 from '@assets/letter_0.svg';
import ImgKey1 from '@assets/letter_1.svg';
import ImgKey2 from '@assets/letter_2.svg';
import ImgKey3 from '@assets/letter_3.svg';
import ImgKey4 from '@assets/letter_4.svg';
import ImgKey5 from '@assets/letter_5.svg';
import ImgKey6 from '@assets/letter_6.svg';
import ImgKey7 from '@assets/letter_7.svg';
import ImgKey8 from '@assets/letter_8.svg';
import ImgKey9 from '@assets/letter_9.svg';
import ImgKeyBackspace from '@assets/letter_backspace.svg';

export enum PasscodeKey {
    One = '1',
    Two = '2',
    Three = '3',
    Four = '4',
    Five = '5',
    Six = '6',
    Seven = '7',
    Eight = '8',
    Nine = '9',
    Zero = '0',
    Backspace = 'backspace',
    LeftActionKey = 'leftActionKey',
}

const keyImages: { [key: string]: any } = {
    [PasscodeKey.One]: ImgKey1,
    [PasscodeKey.Two]: ImgKey2,
    [PasscodeKey.Three]: ImgKey3,
    [PasscodeKey.Four]: ImgKey4,
    [PasscodeKey.Five]: ImgKey5,
    [PasscodeKey.Six]: ImgKey6,
    [PasscodeKey.Seven]: ImgKey7,
    [PasscodeKey.Eight]: ImgKey8,
    [PasscodeKey.Nine]: ImgKey9,
    [PasscodeKey.Zero]: ImgKey0,
    [PasscodeKey.Backspace]: ImgKeyBackspace,
}

export const PasscodeKeyButton = memo((
    {
        passcodeKey,
        onPress,
        isLoading
    }: {
        passcodeKey: PasscodeKey,
        onPress: () => void,
        isLoading?: boolean,
    }) => {
    const  theme = useTheme();

    const Img = keyImages[passcodeKey];

    return (
        <Pressable
            disabled={isLoading}
            hitSlop={{ top: 6, bottom: 6, left: 30, right: 30 }}
            onPress={onPress}
            style={({ pressed }) => {
                return {
                    height: 60, width: 60,
                    justifyContent: 'center', alignItems: 'center',
                    marginHorizontal: 30, borderRadius: 30,
                    backgroundColor: pressed && !isLoading ? theme.border : undefined,
                    opacity: isLoading ? 0.5 : 1,
                }
            }}
        >
            <Img color={theme.textPrimary} style={{ height: 60, width: 60 }} />
        </Pressable>
    );
});