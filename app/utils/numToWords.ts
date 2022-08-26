import BN from "bn.js";
import { fromNano } from "ton";
import { t } from "../i18n/t";
const writtenNumber = require('written-number');

export function numToWords(inp: number | BN): string {
    let input;
    if (typeof input !== 'number') {
        input = fromNano(inp);
    } else {
        input = inp;
    }

    const num = Number(input);
    if (isNaN(num)) return '';

    return writtenNumber(num, { lang: t('lang') as 'ru' | 'en' });
}