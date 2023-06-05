import React from "react";
import { EngineContext } from "./Engine";
import { PriceState } from "./products/PriceProduct";

// Price context
export const PriceContext = React.createContext<[PriceState | null | undefined, string] | null>(null);

// Price loader
export const PriceLoader = React.memo((props: { children?: any }) => {
    const engine = React.useContext(EngineContext)!
    const price = engine.products.syncable.price.useState();
    const currency = engine.products.syncable.price.usePrimaryCurrency();

    return (
        <PriceContext.Provider value={[price, currency]}>
            {props.children}
        </PriceContext.Provider>
    );
})

// Price
export function usePrice(): [PriceState | null | undefined, string] {
    return React.useContext(PriceContext)!;
}