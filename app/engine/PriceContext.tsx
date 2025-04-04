import { createContext, useContext } from 'react';
import { Price, usePriceQuery } from './hooks/currency/usePriceQuery';

export const PriceContext = createContext<[Price, string, Price]>([{ price: { usd: 0, rates: {} } }, 'USD', { price: { usd: 0, rates: {} } }]);

export const PriceLoader = (props: React.PropsWithChildren) => {
    const price = usePriceQuery();

    return (
        <PriceContext.Provider value={price}>
            {props.children}
        </PriceContext.Provider>
    );
};
PriceLoader.displayName = 'PriceLoader';

export function usePrice() {
    let res = useContext(PriceContext);
    if (!res) {
        throw Error('No price loader found');
    }
    return res;
}