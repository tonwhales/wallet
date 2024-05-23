import { createContext, useContext } from 'react';
import { PriceState } from './api/fetchPrice';
import { usePriceQuery } from './hooks/currency/usePrice';

export const PriceContext = createContext<[PriceState, string]>([{ price: { usd: 0, rates: {} } }, 'USD']);

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