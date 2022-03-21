import { formatDistanceToNow, formatDistanceToNowStrict } from "date-fns";
import React, { useEffect, useState } from "react"
import { Text } from "react-native"
import { t } from "../i18n/t";
import { ru } from 'date-fns/locale';

let locale: Locale | undefined = undefined;
if (t('lang') === 'ru') {
    locale = ru;
}

export const Countdown = React.memo(({ until }: { until: number }) => {
    const [text, setText] = useState(formatDistanceToNow(
        new Date(until * 1000),
        { addSuffix: true, locale: locale, includeSeconds: true }
    ));

    useEffect(() => {
        const timerId = setInterval(() => {
            setText(formatDistanceToNow(
                new Date(until * 1000),
                { addSuffix: true, locale: locale, includeSeconds: true }
            ))
        }, 1000);
        return () => {
            clearInterval(timerId);
        };
    }, [until]);

    return (
        <Text style={{
            color: '#8E979D',
            fontSize: 13,
        }}
            ellipsizeMode="tail"
            numberOfLines={1}
        >
            {text}
        </Text>
    )
})