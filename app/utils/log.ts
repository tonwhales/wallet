import chalk from 'chalk';
import { format } from 'date-fns';
const ctx = new chalk.Instance({ level: 3 });

export function createLogger(tag: string) {
    let ntag = tag;
    while (ntag.length < 10) {
        ntag = ntag + ' ';
    }
    if (ntag.length > 10) {
        ntag = ntag.slice(0, 10);
    }
    return {
        log: (src: any) => {
            console.log(ctx.gray(format(Date.now(), 'HH:mm:ss')), ctx.gray('| ' + ntag + ' |'), src);
        },
        warn: (src: any) => {
            console.warn(ctx.gray(format(Date.now(), 'HH:mm:ss')), ctx.gray('| ' + ntag + ' |'), src);
        }
    }
}

const def = createLogger('ui');

export function log(src: any) {
    def.log(src);
}

export function warn(src: any) {
    def.warn(src);
}
