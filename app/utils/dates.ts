import { endOfDay, format, isThisYear, isToday, isYesterday } from "date-fns";
import { t } from "i18next";

export function formatDate(src: number, dateFormat?: string) {
    if (isToday(src * 1000)) {
        return t('Today');
    }
    if (isYesterday(src * 1000)) {
        return t('Yesterday');
    }
    if (isThisYear(src * 1000)) {
        return format(src * 1000, dateFormat || 'd MMMM')
    }
    return format(src * 1000, 'PPP')
}

export function formatTime(src: number) {
    return format(src * 1000, 'hh:mm aa');
}

export function getDateKey(src: number) {
    return endOfDay(src * 1000).toString();
}