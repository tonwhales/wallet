import { formatDuration } from "date-fns";
import React, { useEffect, useState } from "react"
import { StyleProp, Text, TextStyle } from "react-native"
import { t } from "../i18n/t";

export function getDuration(seconds: number, days?: boolean) {
    let left = seconds;
    if (days) {
        const days = Math.floor(left / (60 * 60 * 24));
        left = left - days * 60 * 60 * 24;
        const hours = Math.floor(left / (60 * 60));
        left = left - hours * 60 * 60
        const minutes = Math.floor(left / 60);
        left = left - minutes * 60;

        return {
            days,
            hours,
            minutes,
            seconds: left
        }
    }

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

function format({ duration, doneText, days }: { duration: number, doneText?: string, days?: boolean }) {
    if (duration <= 0) return doneText ?? t('common.soon');
    return t('common.in')
        + ' '
        + formatDuration(
            getDuration(duration, days),
            { locale: shortLocale(t('lang') as 'ru' | 'en'), delimiter: ':', zero: true }
        );
}

export const Countdown = React.memo(({
    left,
    textStyle,
    doneText,
    days
}: {
    left: number,
    textStyle?: StyleProp<TextStyle>,
    doneText?: string,
    days?: boolean
}) => {
    const [text, setText] = useState(format({ duration: left, doneText, days }));

    useEffect(() => {
        setText(format({ duration: left, doneText, days }));
    }, [left]);

    return (
        <Text style={[{
            color: '#8E979D',
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