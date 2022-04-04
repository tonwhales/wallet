import { t } from "../i18n/t";

export function secToFormatTime(seconds: number) {
    const hLabel = t('lang') === 'ru' ? 'ч' : 'h'
    const minLabel = t('lang') === 'ru' ? 'мин' : 'min'

    seconds = Number(seconds);
    var h = Math.floor(seconds / 3600);
    var m = Math.floor(seconds % 3600 / 60);

    var hDisplay = h > 0 ? `${h}${hLabel}` : '';
    var mDisplay = m > 0 ? `${m}${minLabel}` : '';
    return `${hDisplay} ${mDisplay}`;
}