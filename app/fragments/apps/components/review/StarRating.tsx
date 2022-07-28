import React, { useCallback, useEffect, useState } from "react"
import { Pressable, StyleProp, View, ViewStyle } from "react-native";
import FilledStar from '../../../../../assets/ic_star_filled.svg';
import Star from '../../../../../assets/ic_star_outline.svg';
import { Theme } from "../../../../Theme";

export type Rating = 0 | 1 | 2 | 3 | 4 | 5;

const StarView = React.memo(({
    rate,
    rating,
    setRating
}: {
    rate: Rating,
    rating: Rating,
    setRating: (value: Rating) => void
}) => {
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
            {rating > rate - 1 ? <FilledStar color={Theme.accent} width={54} height={54} /> : <Star color={Theme.secondaryButtonText} width={54} height={54} />}
        </Pressable>
    )
})

export const StarRating = React.memo(({
    initial,
    onSet,
    style
}: {
    initial?: Rating,
    onSet: (rating: 0| 1 | 2 | 3 | 4 | 5) => void,
    style?: StyleProp<ViewStyle>
}) => {
    const [rating, setRating] = useState<Rating>(initial || 0);

    const set = useCallback(
        (value: Rating) => {
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