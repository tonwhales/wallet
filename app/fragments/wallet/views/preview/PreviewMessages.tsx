import { Address, fromNano } from "@ton/core";
import { memo } from "react";
import { View, Text, Image, Platform } from "react-native";
import { ThemeType } from "../../../../engine/state/theme";
import { useBounceableWalletFormat, useNetwork, useServerConfig } from "../../../../engine/hooks";
import { KnownWallet, useKnownWallets } from "../../../../secure/KnownWallets";
import { AddressBook, AddressContact } from "../../../../engine/hooks/contacts/useAddressBook";
import { ServerConfig } from "../../../../engine/api/fetchConfig";
import { ItemCollapsible } from "../../../../components/ItemCollapsible";
import { t } from "../../../../i18n/t";
import { PriceComponent } from "../../../../components/PriceComponent";
import { Typography } from "../../../../components/styles";
import { useContractInfo } from "../../../../engine/hooks/metadata/useContractInfo";
import { WalletAddress } from "../../../../components/address/WalletAddress";
import { PreparedMessage } from "../../../../engine/hooks/transactions/usePeparedMessages";
import { useAddressFormatsHistory } from "../../../../engine/hooks";

const MessagePreview = memo(({
    index,
    message,
    theme,
    isTestnet,
    contacts,
    denyList,
    serverConfig
}: {
    index: number
    message: PreparedMessage,
    theme: ThemeType,
    isTestnet: boolean,
    contacts: { [key: string]: AddressContact },
    denyList: { [key: string]: { reason: string | null } },
    serverConfig?: ServerConfig
}) => {
    const gas = message.gas;
    const amountString = message.amountString;
    const operation = message.operation;
    const friendlyTarget = message.friendlyTarget;
    const knownWallets = useKnownWallets(isTestnet);

    let amount = message.amount;

    const targetContractInfo = useContractInfo(friendlyTarget);
    const [bounceableFormat] = useBounceableWalletFormat();
    const target = Address.parse(friendlyTarget);
    const { getAddressFormat } = useAddressFormatsHistory();

    const bounceable = getAddressFormat(Address.parse(friendlyTarget))
        ?? (targetContractInfo?.kind === 'wallet' ? bounceableFormat : true);

    const contact = contacts[friendlyTarget];

    let known: KnownWallet | undefined = knownWallets[friendlyTarget];
    if (!!contact && !known) { // Resolve contact known wallet
        known = { name: contact.name }
    }
    const isSpam = !!(denyList ?? {})[friendlyTarget];
    const spam = !!serverConfig?.wallets.spam.find((s) => s === friendlyTarget) || isSpam;

    if (!amount && operation.items[0].kind === 'ton') {
        amount = BigInt(operation.items[0].amount);
    } else if (!amount && operation.items[0].kind === 'token' && !message.jettonMaster && operation.items.length > 1 && operation.items[1].kind === 'ton') {
        // If items[0] is a token but jettonMaster is not found (swap on DEX), use TON from items[1]
        amount = BigInt(operation.items[1].amount);
    }

    return (
        <ItemCollapsible
            key={`internal-${index}`}
            titleStyle={[{ color: theme.textPrimary }, Typography.regular17_24]}
            title={t('common.message') + ` #${index + 1}`}
        >
            {!!amountString && (
                <>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                            {t('common.amount')}
                        </Text>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[{ color: theme.textPrimary }, Typography.medium17_24]}>
                                {amountString}
                            </Text>
                            {!!amount && (
                                <PriceComponent
                                    amount={amount}
                                    style={{
                                        backgroundColor: theme.transparent,
                                        paddingHorizontal: 0,
                                        alignSelf: 'flex-end'
                                    }}
                                    textStyle={[{ color: theme.textSecondary, flexShrink: 1 }, Typography.regular15_20]}
                                    theme={theme}
                                />
                            )}
                        </View>
                    </View>
                    <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16 }} />
                </>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                    {t('common.to')}
                </Text>
                <View style={{ alignItems: 'flex-end' }}>
                    <WalletAddress
                        address={target}
                        elipsise={{ start: 10, end: 4 }}
                        style={{
                            flexShrink: 1,
                            alignSelf: 'center',
                        }}
                        textStyle={[{ color: theme.textPrimary }, Typography.medium17_24]}
                        disableContextMenu
                        copyOnPress
                        copyToastProps={Platform.select({
                            android: { marginBottom: 16, }
                        })}
                        bounceable={bounceable}
                        theme={theme}
                    />
                    {known && (
                        <View style={{ flexDirection: 'row' }}>
                            <Text
                                style={[{ color: theme.textSecondary, flexShrink: 1 }, Typography.regular15_20]}
                                numberOfLines={1}
                                ellipsizeMode={'tail'}
                            >
                                {known?.name}
                            </Text>
                            <View style={{
                                justifyContent: 'center', alignItems: 'center',
                                height: 18, width: 18, borderRadius: 9,
                                marginLeft: 6,
                                backgroundColor: theme.surfaceOnBg
                            }}>
                                <Image
                                    source={require('@assets/ic-verified.png')}
                                    style={{ height: 18, width: 18 }}
                                />
                            </View>
                        </View>
                    )}
                    {spam && (
                        <View style={{ flexDirection: 'row' }}>
                            <Text
                                style={[{ color: theme.textSecondary, flexShrink: 1 }, Typography.regular15_20]}
                                numberOfLines={1}
                                ellipsizeMode={'tail'}
                            >
                                {'SPAM'}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
            {!!gas && (
                <>
                    <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16 }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                            {t('transfer.gasFee')}
                        </Text>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[{ color: theme.textPrimary }, Typography.medium17_24]}>
                                {fromNano(gas.amount) + ' TON'}
                            </Text>
                            <PriceComponent
                                amount={gas.amount}
                                style={{
                                    backgroundColor: theme.transparent,
                                    paddingHorizontal: 0,
                                    alignSelf: 'flex-end'
                                }}
                                textStyle={[{ color: theme.textSecondary, flexShrink: 1 }, Typography.regular15_20]}
                                theme={theme}
                            />
                        </View>
                    </View>
                </>
            )}
            {!!operation.op && (
                <>
                    <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16 }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                            {t('transfer.purpose')}
                        </Text>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[{ color: theme.textPrimary }, Typography.medium17_24]}>
                                {t(operation.op.res, operation.op.options)}
                            </Text>
                        </View>
                    </View>
                </>
            )}
            {!!operation.comment && (
                <>
                    <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16 }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                            {t('transfer.commentLabel')}
                        </Text>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[{ color: theme.textPrimary }, Typography.medium17_24]}>
                                {operation.comment}
                            </Text>
                        </View>
                    </View>
                </>
            )}
        </ItemCollapsible>
    );
});

export const PreviewMessages = memo(({
    outMessages,
    theme,
    addressBook
}: {
    outMessages: PreparedMessage[],
    theme: ThemeType,
    addressBook: AddressBook,
}) => {
    const { isTestnet } = useNetwork();
    const contacts = addressBook.contacts;
    const denyList = addressBook.denyList;
    const serverConfig = useServerConfig().data;

    return (
        <View style={{ gap: 16 }}>
            {outMessages.map((message, index) => (
                <MessagePreview
                    key={`internal-${index}`}
                    index={index}
                    message={message}
                    theme={theme}
                    isTestnet={isTestnet}
                    contacts={contacts}
                    denyList={denyList}
                    serverConfig={serverConfig}
                />
            ))}
        </View>
    );
});