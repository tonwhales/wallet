import React, { createContext } from "react";

export const BootContext = createContext<(() => void) | undefined>(undefined);

export function useBootMounted() {
    const context = React.useContext(BootContext);
    if (context) {
        React.useEffect(context, []);
    }
}