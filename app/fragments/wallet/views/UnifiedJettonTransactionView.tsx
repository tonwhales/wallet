import React, { memo } from 'react';
import { Address } from '@ton/core';
import { ThemeType } from '../../../engine/state/theme';
import { TypedNavigation } from '../../../utils/useTypedNavigation';
import { AddressContact } from '../../../engine/hooks/contacts/useAddressBook';
import { AppState } from '../../../storage/appState';
import { WalletSettings } from '../../../engine/state/walletSettings';
import { KnownWallet } from '../../../secure/KnownWallets';
import { UnifiedJettonTransaction, isPendingJettonTransaction, isBlockchainJettonTransaction } from '../../../engine/types/unifiedTransaction';
import { JettonTransactionView } from './JettonTransactionView';
import { PendingTransactionView } from './PendingTransactionView';
import { SectionListRenderItemInfo, View } from 'react-native';
import { JettonTransfer } from '../../../engine/hooks/transactions/useJettonTransactions';
import { Jetton } from '../../../engine/types/jettons';

export const UnifiedJettonTransactionView = memo((props: SectionListRenderItemInfo<UnifiedJettonTransaction, { title: string }> & {
    address: Address,
    theme: ThemeType,
    navigation: TypedNavigation,
    onPress: (src: JettonTransfer) => void,
    onLongPress?: (src: JettonTransfer) => void,
    ledger?: boolean,
    contacts: { [key: string]: AddressContact },
    isTestnet: boolean,
    appState: AppState,
    bounceableFormat: boolean,
    walletsSettings: { [key: string]: WalletSettings },
    knownWallets: { [key: string]: KnownWallet },
    dontShowComments: boolean,
    denyList: { [key: string]: { reason: string | null } },
    spamWallets: string[],
    spamMinAmount: bigint,
    jetton: Jetton,
    addToDenyList: (address: string) => void,
    markAsSent?: (id: string) => void,
    markAsTimedOut?: (id: string) => void
}) => {
    const { item } = props;

    if (isPendingJettonTransaction(item)) {
        return (
            <View style={{ paddingHorizontal: 16 }}>
                <PendingTransactionView
                    tx={item.data}
                    last={true}
                    viewType="jetton-history"
                    owner={props.address.toString({ testOnly: props.isTestnet })}
                    isLedger={props.ledger}
                    markAsSent={props.markAsSent}
                    markAsTimedOut={props.markAsTimedOut}
                />
            </View>
        );
    }

    if (isBlockchainJettonTransaction(item)) {
        return (
            <JettonTransactionView
                own={props.address}
                tx={item.data}
                jetton={props.jetton}
                separator={false}
                theme={props.theme}
                navigation={props.navigation}
                onPress={props.onPress}
                onLongPress={props.onLongPress}
                ledger={props.ledger}
                spamMinAmount={props.spamMinAmount}
                dontShowComments={props.dontShowComments}
                denyList={props.denyList}
                contacts={props.contacts}
                isTestnet={props.isTestnet}
                spamWallets={props.spamWallets}
                appState={props.appState}
                bounceableFormat={props.bounceableFormat}
                walletsSettings={props.walletsSettings}
                knownWallets={props.knownWallets}
            />
        );
    }

    return null;
});

UnifiedJettonTransactionView.displayName = 'UnifiedJettonTransactionView';

