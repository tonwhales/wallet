import chalk from 'chalk';
import { format } from 'date-fns';
const ctx = new chalk.Instance({level: 3});

export function log(src: any) {
    console.log(ctx.gray(format(Date.now(), 'yyyy-MM-dd HH:mm:ss')), src);
}

export function warn(src: any) {
    console.warn(ctx.gray(format(Date.now(), 'yyyy-MM-dd HH:mm:ss')), src);
}