import { t } from "../i18n/t";
import { ru } from 'date-fns/locale';
import { enUS } from 'date-fns/locale'

let locale: Locale = enUS;
if (t('lang') === 'ru') {
    locale = ru;
}

export function formatNum(num: string) {
    return num.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}