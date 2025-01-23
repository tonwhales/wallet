import { memo } from "react";
import { TransactionView } from "./TransactionView";
import { SectionListRenderItemInfo } from "react-native";
import { TonTransaction } from "../../../engine/hooks/transactions/useAccountTransactionsV2";
import { Address } from "@ton/core";
import { ThemeType } from "../../../engine/state/theme";
import { TypedNavigation } from "../../../utils/useTypedNavigation";
import { AddressContact } from "../../../engine/hooks/contacts/useAddressBook";
import { AppState } from "../../../storage/appState";
import { WalletSettings } from "../../../engine/state/walletSettings";
import { KnownWallet } from "../../../secure/KnownWallets";

export type TransactionListItemProps = {
    address: Address,
    theme: ThemeType,
    onPress: (tx: TonTransaction) => void,
    onLongPress?: (tx: TonTransaction) => void,
    ledger?: boolean,
    navigation: TypedNavigation,
    addToDenyList: (address: string | Address, reason: string) => void,
    spamMinAmount: bigint,
    dontShowComments: boolean,
    denyList: { [key: string]: { reason: string | null } },
    contacts: { [key: string]: AddressContact },
    isTestnet: boolean,
    spamWallets: string[],
    appState: AppState,
    bounceableFormat: boolean,
    walletsSettings: { [key: string]: WalletSettings }
    knownWallets: { [key: string]: KnownWallet }
}

export const TransactionListItem = memo(({ item, section, index, theme, ...props }: SectionListRenderItemInfo<TonTransaction, { title: string }> & TransactionListItemProps) => {
    return (
        <TransactionView
            own={props.address}
            tx={item}
            theme={theme}
            ledger={props.ledger}
            {...props}
        />
    );
}, (prev, next) => {
    return prev.item.id === next.item.id
        && prev.isTestnet === next.isTestnet
        && prev.dontShowComments === next.dontShowComments
        && prev.spamMinAmount === next.spamMinAmount
        && prev.address === next.address
        && prev.theme === next.theme
        && prev.section === next.section
        && prev.index === next.index
        && prev.addToDenyList === next.addToDenyList
        && prev.denyList === next.denyList
        && prev.contacts === next.contacts
        && prev.spamWallets === next.spamWallets
        && prev.appState === next.appState
        && prev.onLongPress === next.onLongPress
        && prev.bounceableFormat === next.bounceableFormat
        && prev.walletsSettings === next.walletsSettings
        && prev.knownWallets === next.knownWallets
});
TransactionListItem.displayName = 'TransactionListItem';