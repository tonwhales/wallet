import { formatDuration } from "date-fns";
import React, { useEffect, useState } from "react"
import { StyleProp, Text, TextStyle } from "react-native"
import { t } from "../i18n/t";
import { Theme } from "../Theme";

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
    ru: {
        xSeconds: '{{count}}',
        xMinutes: '{{count}}',
        xHours: '{{count}}',
        xDays: '{{count}}'
    },
    en: {
        xSeconds: '{{count}}',
        xMinutes: '{{count}}',
        xHours: '{{count}}',
        xDays: '{{count}}'
    }
}

export function shortLocale(code: 'ru' | 'en') {
    const formatDistance = (key: DurationKey, count: number) => {
        return formatDurationLocales[code][key].replace('{{count}}', String(count || '').padStart(2, '0'))
    }
    return { formatDistance };
}

function format(duration: number) {
    if (duration <= 0) return t('common.soon');
    return t('common.in')
        + ' '
        + formatDuration(
            getDuration(duration),
            { locale: shortLocale(t('lang') as 'ru' | 'en'), delimiter: ':', zero: true }
        );
}

export const Countdown = React.memo(({ left, textStyle }: { left: number, textStyle?: StyleProp<TextStyle> }) => {
    const [text, setText] = useState(format(left));

    useEffect(() => {
        setText(format(left));
    }, [left]);

    return (
        <Text style={[{
            color: Theme.textSubtitle,
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