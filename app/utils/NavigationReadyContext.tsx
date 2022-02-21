import React, { useState } from "react";

const NavigationReadyContext = React.createContext<{ ready: boolean, setReady: (value: boolean) => void } | undefined>(undefined);

export const NavigationReadyLoader = React.memo(({ children
}: { children: any }) => {
    const [ready, setReady] = useState(false);
    return (
        <NavigationReadyContext.Provider value={{ ready, setReady }}>
            {children}
        </NavigationReadyContext.Provider>
    );
});

export function useNavigationReady(): { ready: boolean, setReady: (value: boolean) => void } | undefined {
    let v = React.useContext(NavigationReadyContext);
    return v;
}