import React, { useEffect, useState } from "react"
import { View, Text, StyleProp, ViewStyle } from "react-native"
import { Theme } from "../../Theme";
import { Countdown } from "../Countdown";
import { ProgressBar } from "../StakingCycleProgress";

export const LockupTimer = React.memo(({
    until,
    style,
    title,
    description,
    readyText
}: {
    until: number,
    style?: StyleProp<ViewStyle>
    title: string,
    description: string,
    readyText: string
}) => {
    const [left, setLeft] = useState(Math.floor(until - (Date.now() / 1000)));

    useEffect(() => {
        const timerId = setInterval(() => {
            setLeft(Math.floor((until) - (Date.now() / 1000)));
        }, 1000);
        return () => {
            clearInterval(timerId);
        };
    }, [until]);

    return (
        <View style={[{
            backgroundColor: Theme.item,
            minHeight: 70,
            borderRadius: 14,
            marginHorizontal: 16,
            overflow: 'hidden',
        }, style]}>
            <ProgressBar left={left} full={60 * 60 * 24 * 365} />
            <View style={{
                flex: 1,
                paddingHorizontal: 16,
                paddingTop: 15,
                paddingBottom: 8
            }}>
                <View style={{ justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row' }}>
                    <Text style={{
                        color: Theme.textColor,
                        fontWeight: '400',
                        fontSize: 14
                    }}>
                        {left > 0 ? title : readyText}
                    </Text>
                    {left > 0 && (
                        <Countdown
                            left={left}
                            textStyle={{
                                fontWeight: '400',
                                color: Theme.textColor,
                                fontSize: 16
                            }}
                            days
                        />
                    )}
                </View>
                <Text style={{
                    color: Theme.textColor,
                    fontWeight: '600',
                    fontSize: 16,
                    marginTop: 8
                }}>
                    {description}
                </Text>
            </View>
        </View>
    );
})