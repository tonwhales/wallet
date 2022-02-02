import * as React from 'react';

export const RebootContext = React.createContext<() => void>(() => { });

export function useReboot() {
    return React.useContext(RebootContext);
}