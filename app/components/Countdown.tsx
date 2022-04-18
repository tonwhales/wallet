import { formatDuration } from "date-fns";
import { ru } from 'date-fns/locale';
import React, { useEffect, useState } from "react"
import { StyleProp, Text, TextStyle } from "react-native"
import { useTranslation } from "react-i18next";
import { t } from "../i18n/t";

function getDuration(seconds: number) {
    let left = seconds;
    const days = Math.floor(left / (24 * 60 * 60));
    left = left - days * (24 * 60 * 60);
    const hours = Math.floor(left / (60 * 60));
    left = left - hours * 60 * 60
    const minutes = Math.floor(left / 60);
    left = left - minutes * 60;
    let secs;

    if (days === 0 && hours === 0) {
        secs = left
    }

    return {
        days,
        hours,
        minutes,
        seconds: secs
    }
}

function format(duration: number) {
    if (duration <= 0) return t('common.soon');
    return t('common.in')
        + ' '
        + formatDuration(getDuration(duration), { locale: t('lang') === 'ru' ? ru : undefined });
}

export const Countdown = React.memo(({ until, textStyle }: { until: number, textStyle?: StyleProp<TextStyle> }) => {
    const { t } = useTranslation()
    const [text, setText] = useState(format(Math.floor(until - (Date.now() / 1000))));

    useEffect(() => {
        const timerId = setInterval(() => {
            setText(format(Math.floor(until - (Date.now() / 1000))));
        }, 1000);
        return () => {
            clearInterval(timerId);
        };
    }, [until]);

    if (!until) {
        return (
            <Text style={[{
                color: '#8E979D',
                fontSize: 13,
            }, textStyle]}
                ellipsizeMode="tail"
                numberOfLines={1}
            >
                {t('common.soon')}
            </Text>
        );
    }

    return (
        <Text style={[{
            color: '#8E979D',
            fontSize: 13,
        }, textStyle]}
            ellipsizeMode="tail"
            numberOfLines={1}
        >
            {text}
        </Text>
    )
})