import React from "react";
import { View } from "react-native";
import { PriceState } from "../storage/cache";
import { Engine } from "./Engine";

// Price context
export const PriceContext = React.createContext<PriceState | null | undefined>(null);

// Price loader
export const PriceLoader = React.memo((props: { children?: any, engine: Engine | null }) => {
    const price = props.engine?.products.price.useState();

    return (
        <PriceContext.Provider value={price}>
            {props.children}
        </PriceContext.Provider>
    );
})

// Price
export function usePrice(): PriceState | null {
    const price = React.useContext(PriceContext);
    if (!price) {
        return null;
    }
    return price;
}