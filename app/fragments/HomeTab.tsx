import React, { useCallback, useState } from "react";
import { useTypedNavigation } from "../utils/useTypedNavigation";

const HomeTabContext = React.createContext<{ tab: number, setTab: (value: number) => void } | undefined>(undefined);

export const HomeTabLoader = React.memo(({ children
}: { children: any }) => {
    const [tab, setT] = useState(0);
    const navigation = useTypedNavigation();

    const setTab = useCallback(
        (value: number) => {
            setT(value)
        },
        [],
    );

    return (
        <HomeTabContext.Provider value={{ tab, setTab }}>
            {children}
        </HomeTabContext.Provider>
    );
});

export function useNavigationReady(): { tab: number, setTab: (value: number) => void } | undefined {
    let v = React.useContext(HomeTabContext);
    return v;
}