import { isLeft } from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import { createLogger } from '../../../../utils/log';

const logger = createLogger('inject');

const msgCodec = t.type({
    name: t.string,
    args: t.unknown
});

export class InjectEngine {
    #methods = new Map<string, { argCodec: t.Type<any>, responseCodec: t.Type<any>, handler: (src: any) => Promise<any> }>();
    name?: string

    constructor(name?: string) {
        this.name = name;
    }

    registerMethod<T, R>(name: string, argCodec: t.Type<T, any>, responseCodec: t.Type<R, any>, handler: (src: T) => Promise<R>) {
        if (this.#methods.has(name)) {
            throw Error('Method ' + name + ' already exist');
        }
        this.#methods.set(name, { argCodec, responseCodec, handler });
    }

    async execute(src: any): Promise<any> {
        try {

            // Check
            if (!msgCodec.is(src)) {
                throw Error('Invalid package');
            }
            let method = this.#methods.get(src.name);
            if (!method) {
                throw Error('Invalid method name');
            }
            let dargs = method.argCodec.decode(src.args);
            if (isLeft(dargs)) {
                throw Error('Invalid method arguments');
            }

            // Execute
            let res = await method.handler(dargs.right);

            // Verify
            if (!method.responseCodec.is(res)) {
                throw Error('Internal error');
            }
            let resEncoded = method.responseCodec.encode(res);

            return { type: 'ok', data: resEncoded };
        } catch (e) {
            logger.warn('Failed to execute method');
            if (e && ((typeof (e as any).message) === 'string')) {
                return { type: 'error', message: (e as any).message };
            } else {
                return { type: 'error', message: 'Unknown error' };
            }
        }
    }
}