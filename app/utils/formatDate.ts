import { format, isThisYear, isToday, isYesterday } from "date-fns";
import { t } from "i18next";

export function formatDate(src: number) {
    if (isToday(src * 1000)) {
        return t('Today');
    }
    if (isYesterday(src * 1000)) {
        return t('Yesterday');
    }
    if (isThisYear(src * 1000)) {
        return format(src * 1000, 'd MMMM')
    }
    return format(src * 1000, 'PPP')
}