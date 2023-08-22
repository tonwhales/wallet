import { PriceState } from '../legacy/products/PriceProduct';

export function usePrice(): [PriceState, string] {
    return [{
        price: {
            usd: 5,
            rates: {}
        }
     }, 'usd'];
}