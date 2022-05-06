import React from "react";
import { EngineContext } from "./Engine";
import { PriceState } from "./products/PriceProduct";

// Price context
export const PriceContext = React.createContext<PriceState | null | undefined>(null);

// Price loader
export const PriceLoader = React.memo((props: { children?: any }) => {
    const engine = React.useContext(EngineContext)!
    const price = engine.products.price.useState();

    return (
        <PriceContext.Provider value={price}>
            {props.children}
        </PriceContext.Provider>
    );
})

// Price
export function usePrice(): PriceState {
    return React.useContext(PriceContext)!;
}