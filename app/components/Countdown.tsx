import { formatDuration } from "date-fns";
import React, { memo, useEffect, useState } from "react"
import { StyleProp, Text, TextStyle } from "react-native"
import { t } from "../i18n/t";
import { useTheme } from "../engine/hooks";

export function getDuration(seconds: number) {
    let left = seconds;
    const hours = Math.floor(left / (60 * 60));
    left = left - hours * 60 * 60
    const minutes = Math.floor(left / 60);
    left = left - minutes * 60;

    return {
        hours,
        minutes,
        seconds: left
    }
}

type DurationKey = 'xSeconds' | 'xMinutes' | 'xHours' | 'xDays';

const formatDurationLocales = {
    xSeconds: '{{count}}',
    xMinutes: '{{count}}',
    xHours: '{{count}}',
    xDays: '{{count}}'
}

export function shortLocale() {
    const formatDistance = (key: DurationKey, count: number) => {
        return formatDurationLocales[key].replace('{{count}}', String(count || '').padStart(2, '0'))
    }
    return { formatDistance };
}

function format(duration: number, hidePrefix?: boolean) {
    if (duration <= 0) return t('common.soon');
    return (hidePrefix ? '' : t('common.in') + ' ')
        + formatDuration(
            getDuration(duration),
            { locale: shortLocale(), delimiter: ':', zero: true }
        );
}

export const Countdown = memo(({ left, textStyle, hidePrefix }: { left: number, textStyle?: StyleProp<TextStyle>, hidePrefix?: boolean }) => {
    const [text, setText] = useState(format(left));
    const theme = useTheme();

    useEffect(() => {
        setText(format(left, hidePrefix));
    }, [left]);

    return (
        <Text style={[{
            color: theme.textSecondary,
            fontSize: 13,
            fontVariant: ['tabular-nums']
        }, textStyle]}
            ellipsizeMode="tail"
            numberOfLines={1}
        >
            {text}
        </Text>
    )
})