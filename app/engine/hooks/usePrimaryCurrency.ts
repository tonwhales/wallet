import { useCloudValue } from './basic/useCloudValue';

const version = 1;

export function usePrimaryCurrency(): string {
    return useCloudValue<{ currency: string }>(`primaryCurrency-v${version}`, (src) => {
        src.currency = 'USD';
    })[0].currency;
}