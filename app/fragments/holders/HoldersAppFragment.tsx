import * as React from 'react';
import { fragment } from '../../fragment';
import { View } from 'react-native';
import { HoldersAppComponent } from './components/HoldersAppComponent';
import { useParams } from '../../utils/useParams';
import { t } from '../../i18n/t';
import { useEffect, useMemo } from 'react';
import { useHoldersAccountStatus, useHoldersAccounts, useNetwork, useSelectedAccount, useTheme } from '../../engine/hooks';
import { holdersUrl } from '../../engine/api/holders/fetchUserState';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import { onHoldersInvalidate } from '../../engine/effects/onHoldersInvalidate';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useLedgerTransport } from '../ledger/components/TransportContext';
import { Address } from '@ton/core';

export enum HoldersAppParamsType {
    Account = 'account',
    Accounts = 'accounts',
    Prepaid = 'prepaid',
    Create = 'create',
    Invite = 'invite',
    Transactions = 'transactions',
    Path = 'path',
    Topup = 'topup'
}

export type HoldersAppParams =
    | { type: HoldersAppParamsType.Account, id: string }
    | { type: HoldersAppParamsType.Accounts }
    | { type: HoldersAppParamsType.Prepaid, id: string }
    | { type: HoldersAppParamsType.Create }
    | { type: HoldersAppParamsType.Invite }
    | { type: HoldersAppParamsType.Path, path: string, query: { [key: string]: string | undefined } }
    | { type: HoldersAppParamsType.Transactions, query: { [key: string]: string | undefined } }
    | { type: HoldersAppParamsType.Topup, id: string };

export const HoldersAppFragment = fragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const params = useParams<HoldersAppParams>();
    const route = useRoute();
    const isLedger = route.name === 'LedgerHolders';
    const acc = useSelectedAccount();
    const ledgerContext = useLedgerTransport();
    const ledgerAddress = ledgerContext?.addr?.address ? Address.parse(ledgerContext?.addr?.address) : null;
    const address = isLedger ? ledgerAddress : acc?.address;
    const status = useHoldersAccountStatus(address!.toString({ testOnly: isTestnet })).data;
    const accounts = useHoldersAccounts(address!.toString({ testOnly: isTestnet })).data;
    const url = holdersUrl(isTestnet);

    useEffect(() => {
        return () => {
            if (!!acc) {
                onHoldersInvalidate(acc.addressString, isTestnet);
            }
        }
    }, [acc, isTestnet]);

    // to account for wierd statusbar bug with navigating withing the bottom bar stack
    useFocusEffect(() => setStatusBarStyle(theme.style === 'dark' ? 'light' : 'dark'));

    // Resolve accounts and status with memo to avoid re-renders
    const holders = useMemo(() => {
        return { accounts, status };
    }, []);

    return (
        <View style={{
            flexGrow: 1,
            backgroundColor: theme.backgroundPrimary
        }}>
            <StatusBar style={theme.style === 'dark' ? 'light' : 'dark'} />
            <HoldersAppComponent
                title={t('products.holders.title')}
                variant={params}
                endpoint={url}
                accounts={holders.accounts}
                status={holders.status}
                address={address!}
            />
        </View>
    );
});