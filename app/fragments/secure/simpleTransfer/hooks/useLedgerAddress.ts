import { useMemo } from 'react';
import { useLedgerTransport } from '../../../ledger/components/TransportContext';
import { Address } from '@ton/core';

export const useLedgerAddress = ({ isLedger }: { isLedger: boolean }) => {
    const ledgerContext = useLedgerTransport();
    const addr = ledgerContext?.addr;

    return useMemo(() => {
        if (addr && isLedger) {
            try {
                return Address.parse(addr.address);
            } catch { }
        }
    }, [addr]);
}