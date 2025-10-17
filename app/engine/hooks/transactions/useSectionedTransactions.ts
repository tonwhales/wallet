import { useMemo } from 'react';
import { formatDate, getDateKey } from '../../../utils/dates';

type TransactionWithTime = {
    time: number;
    [key: string]: any;
};

type SectionedData<T> = {
    title: string;
    data: T[];
};

/**
 * Hook for sectioning transactions by dates
 * @param transactions - array of transactions with time field
 * @param filterFn - optional function to filter transactions
 * @returns array of sections with titles and data
 */
export function useSectionedTransactions<T extends TransactionWithTime>(
    transactions: T[],
    filterFn?: (tx: T) => boolean
): SectionedData<T>[] {
    return useMemo(() => {
        const sectioned = new Map<string, SectionedData<T>>();
        
        for (let i = 0; i < transactions.length; i++) {
            const tx = transactions[i];
            
            // Apply filter if provided
            if (filterFn && !filterFn(tx)) {
                continue;
            }
            
            if (!tx?.time) continue;
            
            const timeKey = getDateKey(tx.time);
            const section = sectioned.get(timeKey);
            
            if (section) {
                section.data.push(tx);
            } else {
                sectioned.set(timeKey, { 
                    title: formatDate(tx.time), 
                    data: [tx] 
                });
            }
        }
        
        return Array.from(sectioned.values());
    }, [transactions, filterFn]);
}

