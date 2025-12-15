import React from 'react';
import { Text, TextStyle } from 'react-native';
import Animated, {
    FadeIn,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { Typography } from './styles';

const NUMBERS = Array(10)
    .fill([])
    .map((_, i) => i);

type AnimatedDigitProps = {
    digit: number;
    width: number;
    duration?: number;
    numberHeight: number;
    typography: {
        fontSize: number;
        lineHeight: number;
        fontWeight?: TextStyle['fontWeight'];
    };
    color?: string;
};

const AnimatedDigit = ({
    digit,
    width,
    duration = 1000,
    numberHeight,
    typography,
    color = 'white',
}: AnimatedDigitProps): JSX.Element => {
    const translateYStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateY: withSpring(-numberHeight * digit, {
                        mass: 1.2,
                    }),
                },
            ],
        };
    });

    return (
        <Animated.View
            entering={FadeIn.duration(duration)}
            style={[
                {
                    height: numberHeight,
                    overflow: 'hidden',
                },
            ]}
        >
            <Animated.View style={translateYStyle}>
                {NUMBERS.map((_, index) => {
                    return (
                        <Text
                            key={index}
                            style={[
                                typography,
                                {
                                    color,
                                    width,
                                    height: numberHeight,
                                    textAlign: 'center',
                                },
                            ]}
                        >
                            {index}
                        </Text>
                    );
                })}
            </Animated.View>
        </Animated.View>
    );
};

type AnimatedNumberProps = {
    number: number;
    duration?: number;
    typography?: {
        fontSize: number;
        lineHeight: number;
        fontWeight?: TextStyle['fontWeight'];
    };
    color?: string;
    decimalPlaces?: number;
};

export const AnimatedNumber = ({
    number,
    duration = 1000,
    typography = Typography.medium17_24,
    color = 'white',
    decimalPlaces,
}: AnimatedNumberProps): JSX.Element => {
    const digits = React.useMemo(() => {
        // Round the number to specified decimal places if provided
        const roundedNumber = decimalPlaces !== undefined
            ? Number(number.toFixed(decimalPlaces))
            : number;

        const numberStr = roundedNumber.toString();
        const [integerPart, decimalPart] = numberStr.split('.');

        const result: (number | string)[] = [];
        const integerDigits = integerPart.split('');

        integerDigits.forEach((char, index) => {
            result.push(parseInt(char, 10));

            const remainingDigits = integerDigits.length - index - 1;
            if (remainingDigits > 0 && remainingDigits % 3 === 0) {
                result.push(',');
            }
        });

        if (decimalPart) {
            result.push('.');
            decimalPart.split('').forEach(char => {
                result.push(parseInt(char, 10));
            });
        }

        return result;
    }, [number, decimalPlaces]);

    return (
        <Animated.View
            style={{
                flexDirection: 'row',
            }}
        >
            {digits.map((digit, index) => {
                if (typeof digit === 'string') {
                    return (
                        <Text
                            key={index}
                            style={[
                                typography,
                                {
                                    color,
                                    width: digit === '.' ? typography.fontSize * 0.3 : typography.fontSize * 0.4,
                                    height: typography.lineHeight,
                                },
                            ]}
                        >
                            {digit}
                        </Text>
                    );
                }
                return (
                    <AnimatedDigit
                        duration={duration}
                        key={index}
                        digit={digit}
                        width={typography.fontSize * 0.6}
                        numberHeight={typography.lineHeight}
                        typography={typography}
                        color={color}
                    />
                );
            })}
        </Animated.View>
    );
};

