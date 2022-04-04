import { formatDistanceToNow, formatDistanceToNowStrict, formatDuration } from "date-fns";
import React, { useEffect, useState } from "react"
import { StyleProp, Text, TextStyle } from "react-native"
import { t } from "../i18n/t";
import { ru } from 'date-fns/locale';
import { secToFormatTime } from "../utils/secToFormatTime";
import { useTranslation } from "react-i18next";

let locale: Locale | undefined = undefined;
if (t('lang') === 'ru') {
    locale = ru;
}

export const Countdown = React.memo(({ until, textStyle, strict }: { until: number, textStyle?: StyleProp<TextStyle>, strict?: boolean }) => {
    const { t } = useTranslation()
    const [text, setText] = useState(
        !until
            ? t('common.soon')
            : strict
                ? secToFormatTime(until - (Date.now() / 1000)) + ' ' + t('common.left')
                : formatDistanceToNow(
                    new Date(until * 1000),
                    { addSuffix: true, locale: locale, includeSeconds: true }
                )
    );

    useEffect(() => {
        const timerId = setInterval(() => {
            setText(
                !until
                    ? t('common.soon')
                    : strict
                        ? secToFormatTime(until - (Date.now() / 1000)) + ' ' + t('common.left')
                        : formatDistanceToNow(
                            new Date(until * 1000),
                            { addSuffix: true, locale: locale, includeSeconds: true }
                        )
            )
        }, 1000);
        return () => {
            clearInterval(timerId);
        };
    }, [until]);

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