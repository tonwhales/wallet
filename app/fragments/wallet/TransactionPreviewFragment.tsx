import React from "react";
import { View, Platform, Text, Image, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { getCurrentAddress } from "../../storage/appState";
import { CloseButton } from "../../components/CloseButton";
import { Theme } from "../../Theme";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { useParams } from "../../utils/useParams";
import { Address, fromNano } from "ton";
import BN from "bn.js";
import { ValueComponent } from "../../components/ValueComponent";
import { formatDate, formatTime } from "../../utils/dates";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { Transaction } from "../../engine/Transaction";
import { AppConfig } from "../../AppConfig";
import { WalletAddress } from "../../components/WalletAddress";
import { Avatar } from "../../components/Avatar";
import { useEngine } from "../../engine/Engine";
import { t } from "../../i18n/t";
import { ActionsMenuView } from "../../components/ActionsMenuView";
import { StatusBar } from "expo-status-bar";
import { ContractMetadata } from "../../engine/metadata/Metadata";
import { JettonMasterState } from "../../engine/jettons/JettonMasterSync";
import { resolveOperation } from "../../operations/resolveOperation";
import { useOptItem } from "../../engine/persistence/PersistedItem";

const ZERO_ADDRESS = new Address(-1, Buffer.alloc(32, 0));

export const TransactionPreviewFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const { transaction } = useParams<{ transaction?: Transaction | null }>();
    const address = React.useMemo(() => getCurrentAddress().address, []);
    const engine = useEngine();

    if (!transaction) {
        throw Error('Unable to load transaction');
    }

    // Metadata
    let metadata: ContractMetadata | null;
    if (transaction.address) {
        metadata = useOptItem(engine.storage.metadata(transaction.address));
    } else {
        metadata = useOptItem(engine.storage.metadata(ZERO_ADDRESS));
    }

    // Master metadata
    let masterMetadata: JettonMasterState | null;
    if (metadata && metadata.jettonWallet) {
        masterMetadata = useOptItem(engine.storage.jettonMaster(metadata.jettonWallet.master));
    } else if (metadata && metadata.jettonMaster && transaction.address) {
        masterMetadata = useOptItem(engine.storage.jettonMaster(transaction.address));
    } else {
        masterMetadata = useOptItem(engine.storage.jettonMaster(ZERO_ADDRESS));
    }

    // Operation
    let operation = resolveOperation({ tx: transaction, metadata, jettonMaster: masterMetadata, account: engine.address });
    let avatarId = operation.address.toFriendly({ testOnly: AppConfig.isTestnet });
    let item = operation.items[0];

    // // Payload ovewrite
    // if (transaction.body && transaction.body.type === 'payload' && transaction.address && metadata) {
    //     let parsedBody = parseMessageBody(transaction.body.cell, metadata.interfaces);
    //     if (parsedBody) {
    //         let f = formatSupportedBody(parsedBody);
    //         if (f) {
    //             transactionType = f.text;
    //         }
    //     }
    // }

    // Avatar
    let downloaded: string | null = null;
    if (operation.image) {
        downloaded = engine.downloads.use(operation.image);
    } else {
        downloaded = engine.downloads.use('');
    }

    return (
        <View style={{
            alignSelf: 'stretch', flexGrow: 1, flexBasis: 0,
            alignItems: 'center',
            backgroundColor: Theme.background,
            paddingTop: Platform.OS === 'android' ? safeArea.top + 24 : undefined,
            paddingHorizontal: 16
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar style={{ position: 'absolute', top: safeArea.top, left: 0 }} pageTitle={operation.name} />
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                {Platform.OS === 'ios' && (
                    <Text style={{ color: Theme.textColor, fontWeight: '600', fontSize: 17, marginTop: 12, marginHorizontal: 32 }} numberOfLines={1} ellipsizeMode="tail">
                        {operation.name}
                    </Text>
                )}
            </View>
            <View style={{ width: 84, height: 84, borderRadius: 42, borderWidth: 0, marginTop: 24, backgroundColor: '#5fbed5', alignItems: 'center', justifyContent: 'center' }}>
                <Avatar address={operation.address.toFriendly({ testOnly: AppConfig.isTestnet })} id={avatarId} size={84} image={downloaded ? downloaded : undefined} />
            </View>
            <View style={{ marginTop: 34 }}>
                {transaction.status === 'failed' ? (
                    <Text style={{ color: 'orange', fontWeight: '600', fontSize: 16, marginRight: 2 }}>failed</Text>
                ) : (
                    <Text style={{ color: item.amount.gte(new BN(0)) ? '#4FAE42' : '#000000', fontWeight: '800', fontSize: 36, marginRight: 2 }} numberOfLines={1}>
                        <ValueComponent value={item.amount} centFontStyle={{ fontSize: 30, fontWeight: '400' }} />
                        {item.kind === 'token' ? ' ' + item.symbol : ''}
                    </Text>
                )}
            </View>
            <Text style={{ color: Theme.textSecondary, fontSize: 12, marginTop: 10 }}>
                {`${formatDate(transaction.time, 'dd.MM.yyyy')} ${formatTime(transaction.time)}`}
            </Text>
            <View style={{ flexDirection: 'row', marginTop: 39 }} collapsable={false}>
                {transaction.kind === 'out' && (transaction.body === null || transaction.body.type !== 'payload') && (
                    <Pressable
                        style={(p) => ({ flexGrow: 1, flexBasis: 0, marginRight: 7, justifyContent: 'center', alignItems: 'center', height: 66, backgroundColor: p.pressed ? Theme.selector : 'white', borderRadius: 14 })}
                        onPress={() => navigation.navigateSimpleTransfer({
                            target: transaction.address!.toFriendly({ testOnly: AppConfig.isTestnet }),
                            comment: transaction.body && transaction.body.type === 'comment' ? transaction.body.comment : null,
                            amount: transaction.amount.neg(),
                            job: null,
                            stateInit: null,
                            jetton: null
                        })}
                    >
                        <View style={{ backgroundColor: Theme.accent, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                            <Image source={require('../../../assets/ic_change.png')} />
                        </View>
                        <Text style={{ fontSize: 13, color: Theme.accentText, marginTop: 4 }}>{t('txPreview.sendAgain')}</Text>
                    </Pressable>
                    // TODO: add transaction to favorites
                    // {/* <Pressable
                    //     style={(p) => ({ flexGrow: 1, flexBasis: 0, marginLeft: 7, justifyContent: 'center', alignItems: 'center', height: 66, backgroundColor: p.pressed ? Theme.selector : 'white', borderRadius: 14 })}
                    //     onPress={() => addToFav()}
                    // >
                    //     <Image source={require('../../../assets/send.png')} />
                    //     <Text style={{ fontSize: 13, color: '#1C8FE3', marginTop: 4 }}>{t("add to favorites")}</Text>
                    // </Pressable> */}
                )}
            </View>
            <View style={{
                marginBottom: 16, marginTop: 14,
                backgroundColor: "white",
                borderRadius: 14,
                justifyContent: 'center',
                width: '100%'
            }}>
                {operation.comment && (
                    <>
                        <ActionsMenuView content={operation.comment}>
                            <View style={{ paddingVertical: 16, paddingHorizontal: 16 }}>
                                <Text
                                    style={{
                                        textAlign: 'left',
                                        fontWeight: '600',
                                        fontSize: 16,
                                        lineHeight: 20
                                    }}
                                >
                                    {operation.comment}
                                </Text>
                                <Text style={{ marginTop: 5, fontWeight: '400', color: '#8E979D' }}>
                                    {t('common.comment')}
                                </Text>
                            </View>
                        </ActionsMenuView>
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 15 }} />
                    </>
                )}
                <View style={{ paddingVertical: 16, paddingHorizontal: 16 }}>
                    <WalletAddress
                        address={operation.address.toFriendly({ testOnly: AppConfig.isTestnet }) || address.toFriendly({ testOnly: AppConfig.isTestnet })}
                        textProps={{ numberOfLines: undefined }}
                        textStyle={{
                            textAlign: 'left',
                            fontWeight: '600',
                            fontSize: 16,
                            lineHeight: 20
                        }}
                        style={{
                            width: undefined,
                            marginTop: undefined
                        }}
                    />
                    <Text style={{ marginTop: 5, fontWeight: '400', color: '#8E979D' }}>
                        {t('common.walletAddress')}
                    </Text>
                </View>
                <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 15 }} />
                <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 16 }}>
                    <Text style={{
                        fontWeight: '600',
                        fontSize: 16,
                        lineHeight: 20,
                    }}>
                        {t('txPreview.blockchainFee')}
                    </Text>
                    <Text style={{
                        fontWeight: '600',
                        fontSize: 16,
                        lineHeight: 20,
                    }}>
                        {fromNano(transaction.fees)}
                    </Text>
                </View>
            </View>
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={navigation.goBack}
                />
            )}
        </View>
    );
});