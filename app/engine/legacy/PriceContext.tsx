import React from "react";
import { PriceState } from "./products/PriceProduct";

// Price context
export const PriceContext = React.createContext<[PriceState | null | undefined, string] | null>(null);

// Price loader
export const PriceLoader = React.memo((props: { children?: any }) => {
    usePrice();

    return (
        <>{props.children}</>
    );
})

// Price
export function usePrice(): [PriceState | null | undefined, string] {
    return React.useContext(PriceContext)!;
}