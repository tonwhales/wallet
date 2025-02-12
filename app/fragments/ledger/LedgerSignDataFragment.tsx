import { Address, Cell } from "@ton/core";
import { fragment } from "../../fragment";
import { useLedgerTransport } from "./components/TransportContext";
import { View, Text, Alert, Pressable } from "react-native";
import { HeaderSyncStatus } from "../wallet/views/HeaderSyncStatus";
import { useNetwork, useTheme } from "../../engine/hooks";
import { Typography } from "../../components/styles";
import React, { useRef, useState } from "react";
import { RoundButton } from "../../components/RoundButton";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ScrollView } from "react-native-gesture-handler";
import { ATextInput } from "../../components/ATextInput";
import { pathFromAccountNumber } from "../../utils/pathFromAccountNumber";
import { copyText } from "../../utils/copyText";
import { ItemDivider } from "../../components/ItemDivider";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CopyIcon from '@assets/ic-copy.svg';

export const LedgerSignDataFragment = fragment(() => {
    const ledgerContext = useLedgerTransport();
    const safeArea = useSafeAreaInsets();
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const { isTestnet } = useNetwork();
    const address = ledgerContext?.addr?.address ? Address.parse(ledgerContext.addr?.address) : null;
    const addr = (address && !!ledgerContext.tonTransport) ? address.toString({ testOnly: isTestnet }) : undefined;
    const status = `${addr ? addr.slice(0, 6) + '...' + addr.slice(-6) : 'Not connected'}`;
    const showConnect = status === 'Not connected';
    const path = ledgerContext.addr ? pathFromAccountNumber(ledgerContext.addr.acc, isTestnet) : null;

    const [data, setData] = useState('');
    const [domain, setDomain] = useState('');
    const [extString, setExt] = useState('');
    const [res, setRes] = useState<{
        signature: Buffer;
        cell: Cell;
        timestamp: number;
    }>();

    const finished = useRef(true);

    const onSign = async () => {
        if (!finished.current) {
            return;
        }

        if (!ledgerContext.tonTransport) {
            ledgerContext.onShowLedgerConnectionError();
            return;
        }

        if (!path || !address) {
            return;
        }

        const ext = extString ? Cell.fromBoc(Buffer.from(extString, 'base64'))[0] : undefined;

        finished.current = false;
        setRes(undefined);
        try {
            const res = await ledgerContext.tonTransport.signData(
                path,
                {
                    type: 'app-data',
                    data: Cell.fromBoc(Buffer.from(data, 'base64'))[0],
                    address,
                    domain,
                    ext
                }
            );

            setRes(res);
        } catch (error) {
            Alert.alert(
                'Error',
                (error as Error)?.message
            );
        } finally {
            finished.current = true;
        }
    }

    return (
        <View style={{ flexGrow: 1, alignItems: 'center' }}>
            <ScreenHeader
                onClosePressed={navigation.goBack}
                title={'Ledger Sign app-data'}
            />
            <ScrollView
                style={{ flexBasis: 0, width: '100%' }}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 16, width: '100%' }}
                contentInset={{
                    bottom: safeArea.bottom + 16,
                    top: 16
                }}
            >
                <View style={{ alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surfaceOnDark, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexShrink: 1 }}>
                    <Text
                        style={[{ color: theme.textPrimary, flexShrink: 1, marginRight: 8 }, Typography.medium17_24]}
                        ellipsizeMode='tail'
                        numberOfLines={1}
                    >
                        {status}
                    </Text>
                    <HeaderSyncStatus isLedger={true} />
                </View>
                {showConnect ? (
                    <RoundButton
                        display={'text'}
                        title="Connect ledger"
                        onPress={ledgerContext.onShowLedgerConnectionError}
                    />
                ) : (
                    <View>
                        <View style={{
                            backgroundColor: theme.surfaceOnElevation,
                            marginTop: 20,
                            paddingVertical: 20,
                            width: '100%', borderRadius: 20
                        }}>
                            <ATextInput
                                value={data}
                                onValueChange={(newValue) => setData(newValue.trimStart().trimEnd())}
                                label={'Base64 data Cell'}
                                style={{ paddingHorizontal: 16 }}
                                blurOnSubmit={true}
                                editable={true}
                                cursorColor={theme.accent}
                                multiline
                                autoCapitalize={'none'}
                                autoComplete={'off'}
                            />
                            <ItemDivider />
                            <ATextInput
                                value={domain}
                                onValueChange={(newValue) => setDomain(newValue.trimStart().trimEnd())}
                                label={'Domain'}
                                style={{ paddingHorizontal: 16 }}
                                blurOnSubmit={true}
                                editable={true}
                                cursorColor={theme.accent}
                                autoCapitalize={'none'}
                                autoComplete={'off'}
                            />
                            <ItemDivider />
                            <ATextInput
                                value={extString}
                                onValueChange={(newValue) => setExt(newValue.trimStart().trimEnd())}
                                label={'Base64 ext Cell'}
                                style={{ paddingHorizontal: 16 }}
                                blurOnSubmit={true}
                                editable={true}
                                cursorColor={theme.accent}
                                multiline
                                autoCapitalize={'none'}
                                autoComplete={'off'}
                            />
                            <ItemDivider />
                            <View style={{ paddingHorizontal: 16 }}>
                                <RoundButton
                                    title="Request"
                                    disabled={!data || !address}
                                    action={onSign}
                                />
                            </View>
                        </View>
                        {!!res && (
                            <View style={{
                                backgroundColor: theme.surfaceOnElevation,
                                marginTop: 20,
                                paddingVertical: 20,
                                width: '100%', borderRadius: 20
                            }}>
                                <Pressable
                                    hitSlop={10}
                                    onPress={() => {
                                        copyText(res.signature.toString('base64'));
                                    }}
                                    style={({ pressed }) => ({
                                        backgroundColor: theme.surfaceOnElevation,
                                        borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10,
                                        opacity: pressed ? 0.8 : 1
                                    })}
                                >
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                                        <View style={{ flexShrink: 1 }}>
                                            <Text style={[
                                                { color: theme.textSecondary },
                                                Typography.regular15_20
                                            ]}>
                                                {'Signature'}
                                            </Text>
                                            <Text style={[
                                                { color: theme.textPrimary, flexShrink: 1 },
                                                Typography.regular17_24
                                            ]}>
                                                {res.signature.toString('base64')}
                                            </Text>
                                        </View>
                                        <CopyIcon style={{ height: 24, width: 24 }} height={24} width={24} color={theme.iconPrimary} />
                                    </View>
                                </Pressable>
                                <ItemDivider />
                                <Pressable
                                    hitSlop={10}
                                    onPress={() => {
                                        copyText(res.cell.toBoc().toString('base64'));
                                    }}
                                    style={({ pressed }) => ({
                                        backgroundColor: theme.surfaceOnElevation,
                                        borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10,
                                        opacity: pressed ? 0.8 : 1
                                    })}
                                >
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                                        <View style={{ flexShrink: 1 }}>
                                            <Text style={[
                                                { color: theme.textSecondary },
                                                Typography.regular15_20
                                            ]}>
                                                {'Cell'}
                                            </Text>
                                            <Text style={[
                                                { color: theme.textPrimary, flexShrink: 1 },
                                                Typography.regular17_24
                                            ]}>
                                                {res.cell.toBoc().toString('base64')}
                                            </Text>
                                        </View>
                                        <CopyIcon style={{ height: 24, width: 24 }} height={24} width={24} color={theme.iconPrimary} />
                                    </View>
                                </Pressable>
                                <ItemDivider />

                                <Pressable
                                    hitSlop={10}
                                    onPress={() => {
                                        copyText(res.timestamp.toString());
                                    }}
                                    style={({ pressed }) => ({
                                        backgroundColor: theme.surfaceOnElevation,
                                        borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10,
                                        opacity: pressed ? 0.8 : 1
                                    })}
                                >
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                                        <View style={{ flexShrink: 1 }}>
                                            <Text style={[
                                                { color: theme.textSecondary },
                                                Typography.regular15_20
                                            ]}>
                                                {'Timestamp'}
                                            </Text>
                                            <Text style={[
                                                { color: theme.textPrimary, flexShrink: 1 },
                                                Typography.regular17_24
                                            ]}>
                                                {res.timestamp.toString()}
                                            </Text>
                                        </View>
                                        <CopyIcon style={{ height: 24, width: 24 }} height={24} width={24} color={theme.iconPrimary} />
                                    </View>
                                </Pressable>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
});