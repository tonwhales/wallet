import { log } from './log';

export const createTracer = (tag?: string) => {
    let start = Date.now();
    let last = Date.now();
    let report: { label: string, fromStart: string, elapsed: string }[] = [];
    return {
        label: (label: string) => {
            report.push({ label, fromStart: `${Date.now() - start} ms`, elapsed: `${Date.now() - last} ms` });
            last = Date.now();
        },
        report: () => {
            log('');
            log('> Tracer report:');
            for (let r of report) {
                log('\t' + (tag ?? '') + '\t' + r.label + '\t' + r.fromStart + '\t' + r.elapsed);
            }
            log('');
        }
    };
}