import { useCloudValue } from '../cloud/useCloudValue';

const version = 1;

export function usePrimaryCurrency(): [string, (currency: string) => void] {
    let [cloudValue, updater] = useCloudValue<{ currency: string }>(`primaryCurrency-v${version}`, (src) => {
        src.currency = 'USD';
    });

    return [cloudValue.currency, (currency: string) => {
        updater((value) => {
            value.currency = currency;
        })
    }];
}