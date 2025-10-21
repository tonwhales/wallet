import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useCurrentAddress } from './hooks/appstate/useCurrentAddress';
import { useHoldersAccounts } from './hooks/holders/useHoldersAccounts';

interface TransactionsHistoryContextValue {
    checkIsHoldersTarget: (address: string) => boolean;
}

const TransactionsHistoryContext = createContext<TransactionsHistoryContextValue | undefined>(undefined);

export function TransactionsHistoryProvider({ children }: { children: ReactNode }) {
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
        <TransactionsHistoryContext.Provider value={value}>
            {children}
        </TransactionsHistoryContext.Provider>
    );
}

export function useTransactionsHistoryContext() {
    const context = useContext(TransactionsHistoryContext);
    if (!context) {
        throw new Error('useTransactionsHistoryContext must be used within TransactionsHistoryProvider');
    }
    return context;
}

