import React, { memo } from 'react';
import { Address } from '@ton/core';
import { ThemeType } from '../../../engine/state/theme';
import { AddressContact } from '../../../engine/hooks/contacts/useAddressBook';
import { AppState } from '../../../storage/appState';
import { WalletSettings } from '../../../engine/state/walletSettings';
import { KnownWallet } from '../../../secure/KnownWallets';
import { UnifiedTonTransaction, isPendingTonTransaction, isBlockchainTonTransaction } from '../../../engine/types/unifiedTransaction';
import { PendingTransactionView } from './PendingTransactionView';
import { SectionListData, SectionListRenderItemInfo, View } from 'react-native';
import { TransactionListItem } from './TransactionListItem';
import { TonTransaction, TransactionType } from '../../../engine/types';

export const UnifiedTransactionView = memo((props: SectionListRenderItemInfo<UnifiedTonTransaction, { title: string }> & {
    address: Address,
    theme: ThemeType,
    onPress: (src: TonTransaction) => void,
    onLongPress: (src: TonTransaction, formattedAddressString?: string) => void,
    ledger?: boolean,
    contacts: { [key: string]: AddressContact },
    isTestnet: boolean,
    appState: AppState,
    bounceableFormat: boolean,
    walletsSettings: { [key: string]: WalletSettings },
    knownWallets: { [key: string]: KnownWallet },
    getAddressFormat: (address: Address) => boolean | undefined,
    dontShowComments: boolean,
    denyList: { [key: string]: { reason: string | null } },
    spamWallets: string[],
    spamMinAmount: bigint,
    markAsSent?: (id: string, txType: TransactionType) => void
    markAsTimedOut?: (id: string, txType: TransactionType) => void
}) => {
    const { item } = props;

    if (isPendingTonTransaction(item)) {
        return (
            <View style={{ paddingHorizontal: 16 }}>
                <PendingTransactionView
                    tx={item.data}
                    last={true}
                    viewType="history"
                    owner={props.address.toString({ testOnly: props.isTestnet })}
                    isLedger={props.ledger}
                    markAsSent={props.markAsSent}
                    markAsTimedOut={props.markAsTimedOut}
                />
            </View>
        );
    }

    if (isBlockchainTonTransaction(item)) {
        return (
            <TransactionListItem
                section={props.section as unknown as SectionListData<TonTransaction, { title: string }>}
                index={props.index}
                separators={props.separators}
                address={props.address}
                theme={props.theme}
                onPress={props.onPress}
                onLongPress={props.onLongPress}
                ledger={props.ledger}
                contacts={props.contacts}
                isTestnet={props.isTestnet}
                appState={props.appState}
                bounceableFormat={props.bounceableFormat}
                walletsSettings={props.walletsSettings}
                knownWallets={props.knownWallets}
                getAddressFormat={props.getAddressFormat}
                item={item.data}
                dontShowComments={props.dontShowComments}
                denyList={props.denyList}
                spamWallets={props.spamWallets}
                spamMinAmount={props.spamMinAmount}
            />
        );
    }

    return null;
});

UnifiedTransactionView.displayName = 'UnifiedTransactionView';
