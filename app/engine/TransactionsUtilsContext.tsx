import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useCurrentAddress } from './hooks/appstate/useCurrentAddress';
import { useHoldersAccounts } from './hooks/holders/useHoldersAccounts';

interface TransactionsUtilsContextValue {
    checkIsHoldersTarget: (address: string) => boolean;
}

const TransactionsUtilsContext = createContext<TransactionsUtilsContextValue | undefined>(undefined);

export function TransactionsUtilsProvider({ children }: { children: ReactNode }) {
    const { tonAddress, solanaAddress } = useCurrentAddress();
    const holdersAccounts = useHoldersAccounts(tonAddress, solanaAddress).data?.accounts ?? [];

    const checkIsHoldersTarget = useMemo(() => {
        return (address: string) => {
            return !!holdersAccounts.find((acc) => acc.address === address);
        };
    }, [holdersAccounts]);

    const value = useMemo(() => ({
        checkIsHoldersTarget
    }), [checkIsHoldersTarget]);

    return (
        <TransactionsUtilsContext.Provider value={value}>
            {children}
        </TransactionsUtilsContext.Provider>
    );
}

export function useTransactionsUtilsContext() {
    const context = useContext(TransactionsUtilsContext);
    if (!context) {
        throw new Error('useTransactionsUtilsContext must be used within TransactionsUtilsProvider');
    }
    return context;
}

