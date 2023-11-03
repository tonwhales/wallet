import React, { useCallback, useEffect, useState } from "react"
import { Pressable, StyleProp, View, ViewStyle } from "react-native";
import FilledStar from '../../../../../assets/ic_star_filled.svg';
import Star from '../../../../../assets/ic_star_outline.svg';
import { useTheme } from '../../../../engine/hooks';
import { useNetwork } from '../../../../engine/hooks';

const StarView = React.memo(({
    rate,
    rating,
    setRating
}: {
    rate: number,
    rating: number,
    setRating: (value: number) => void
}) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    return (
        <Pressable
            style={({ pressed }) => {
                return {
                    height: 54, width: 54,
                    margin: 4,
                    opacity: pressed ? 0.3 : 1
                }
            }}
            onPress={() => {
                if (rating === rate && rate === 1) {
                    setRating(0);
                }
                setRating(rate);
            }}
        >
            {rating > rate - 1 ? <FilledStar color={theme.accent} width={54} height={54} /> : <Star color={theme.secondaryButtonText} width={54} height={54} />}
        </Pressable>
    )
})

export const StarRating = React.memo(({
    initial,
    onSet,
    style
}: {
    initial?: number,
    onSet: (rating: number) => void,
    style?: StyleProp<ViewStyle>
}) => {
    const [rating, setRating] = useState<number>(initial || 0);

    const set = useCallback(
        (value: number) => {
            if (value !== rating) {
                setRating(value);
            }
        },
        [rating, onSet],
    );

    useEffect(() => {
        if (initial) setRating(initial);
    }, [initial]);

    useEffect(() => {
        if (rating !== initial) {
            onSet(rating);
        }
    }, [rating, onSet]);

    return (
        <View style={[{
            flexDirection: 'row',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center'
        }, style]}>
            <StarView rate={1} rating={rating} setRating={set} />
            <StarView rate={2} rating={rating} setRating={set} />
            <StarView rate={3} rating={rating} setRating={set} />
            <StarView rate={4} rating={rating} setRating={set} />
            <StarView rate={5} rating={rating} setRating={set} />
        </View>
    )
})