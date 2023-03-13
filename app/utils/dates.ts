import { endOfDay, format, isThisYear, isToday, isYesterday, Locale } from "date-fns";
import { t } from "../i18n/t";
import { ru } from 'date-fns/locale';
import { enUS } from 'date-fns/locale'
import * as RNLocalize from 'react-native-localize';

const is24Hour = RNLocalize.uses24HourClock();
let locale: Locale | undefined = undefined;
if (t('lang') === 'ru') {
    locale = ru;
}

export function formatDate(src: number, dateFormat?: string) {
    if (isToday(src * 1000)) {
        return t('common.today');
    }
    if (isYesterday(src * 1000)) {
        return t('common.yesterday');
    }
    if (isThisYear(src * 1000)) {
        return format(src * 1000, dateFormat || 'd MMMM', { locale })
    }
    return format(src * 1000, dateFormat || 'PPP', { locale })
}

export function formatTime(src: number) {
    if (is24Hour) {
        return format(src * 1000, 'HH:mm', { locale });
    }
    return format(src * 1000, 'hh:mm aa', { locale: enUS });
}

export function getDateKey(src: number) {
    return endOfDay(src * 1000).toString();
}