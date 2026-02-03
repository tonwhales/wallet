import * as React from 'react';
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { getCurrentAddress } from '../../../storage/appState';
import { WalletKeys } from '../../../storage/walletKeys';
import { fragment } from '../../../fragment';
import { warn } from '../../../utils/log';
import { Base64, SessionCrypto, SIGN_DATA_ERROR_CODES, WalletResponse, WalletResponseError } from '@tonconnect/protocol';
import { useParams } from '../../../utils/useParams';
import { sendTonConnectResponse } from '../../../engine/api/sendTonConnectResponse';
import { useKeysAuth } from '../../../components/secure/AuthWalletKeys';
import { useDeleteActiveRemoteRequests, useSelectedAccount, useTheme } from '../../../engine/hooks';
import { memo, useCallback, useEffect, useRef } from 'react';
import { createCellHash, createTextBinaryHash } from '../../../engine/tonconnect/utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToaster } from '../../../components/toast/ToastProvider';
import { t } from '../../../i18n/t';
import { PreparedConnectSignRequest } from '../../../engine/hooks/dapps/usePrepareConnectSignRequest';
import { extractDomain } from '../../../engine/utils/extractDomain';
import nacl from 'tweetnacl';
import { Platform, ScrollView, View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { WImage } from '../../../components/WImage';
import { RoundButton } from '../../../components/RoundButton';
import { Image } from 'expo-image';

import { Typography } from '../../../components/styles';

export type TonConnectSignProps = { data: PreparedConnectSignRequest, callback?: (response: WalletResponse<'signData'>) => void }

export const TonConnectSignFragment = fragment(() => {
    const { callback, data } = useParams<TonConnectSignProps>();

    return (<SignStateLoader callback={callback} data={data} />);
});

const SignStateLoader = memo(({ data, callback }: { callback?: (response: WalletResponse<'signData'>) => void, data: PreparedConnectSignRequest }) => {
    const selectedAccount = useSelectedAccount();
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const authContext = useKeysAuth();
    const toaster = useToaster();
    const toastMargin = safeArea.bottom + 56 + 48;
    const { request, sessionCrypto, app } = data;
    const { id, from: clientSessionId, params: [payload] } = request;
    const deleteActiveRemoteRequest = useDeleteActiveRemoteRequests();

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Approve
    const active = useRef(true);
    const success = useRef(false);

    const navigate = useRef(() => {
        active.current = false;
        navigation.goBack();
    });

    useEffect(() => {
        navigate.current = () => {
            if (!active.current) {
                return;
            }
            active.current = false;

            // close modal
            navigation.goBack();
        };
    }, []);

    const approve = useCallback(async () => {
        try {
            const acc = selectedAccount ?? getCurrentAddress();
            const parsedAddr = acc.address;
            const domain = extractDomain(app.url);
            const timestamp = Math.floor(Date.now() / 1000);

            // Sign
            let walletKeys: WalletKeys;
            try {
                walletKeys = await authContext.authenticate({
                    cancelable: true,
                    backgroundColor: theme.elevation,
                    containerStyle: { paddingBottom: safeArea.bottom + 56 },
                    selectedAccount: acc
                });
            } catch {
                warn('Failed to load wallet keys');
                return;
            }

            const finalHash = (payload.type === 'cell')
                ? createCellHash(payload, parsedAddr, domain, timestamp)
                : createTextBinaryHash(payload, parsedAddr, domain, timestamp);

            const signed = nacl.sign.detached(
                new Uint8Array(finalHash),
                new Uint8Array(walletKeys.keyPair.secretKey),
            );

            const response = {
                id,
                result: {
                    signature: Base64.encode(signed),
                    timestamp,
                    address: parsedAddr.toRawString(),
                    domain,
                    payload
                },
            }

            if (callback) {
                callback(response as unknown as WalletResponse<'signData'>);
            } else {
                // Send sign response
                await sendTonConnectResponse({ response, sessionCrypto, clientSessionId });
            }

            success.current = true;

            timerRef.current = setTimeout(() => {
                navigate.current();
            }, 50);
        } catch {
            // Show user error toast
            toaster.show({
                type: 'error',
                message: t('products.tonConnect.errors.unknown'),
                marginBottom: toastMargin
            });

            warn('Failed to approve');
        }
    }, [toaster, theme, authContext, callback, selectedAccount, request, id]);

    const onCancel = useCallback(() => {
        navigate.current();
    }, []);

    useEffect(() => {
        return () => {
            // If user rejected the connection, we need to call the callback
            deleteActiveRemoteRequest(clientSessionId);

            if (success.current !== false) {
                return;
            }

            if (callback) {
                callback({
                    id: request.id,
                    error: {
                        code: SIGN_DATA_ERROR_CODES.USER_REJECTS_ERROR,
                        message: 'Canceled by the user'
                    }
                });
            } else {
                const response: WalletResponseError<'signData'> = {
                    error: {
                        code: SIGN_DATA_ERROR_CODES.USER_REJECTS_ERROR,
                        message: 'Canceled by the user'
                    },
                    id
                };
                sendTonConnectResponse({ response, sessionCrypto: new SessionCrypto(), clientSessionId });
            }
        }
    }, []);

    const renderPayloadData = useCallback((title: string, body?: string) => {
        if (!body) return null
        return (
            <>
                <Text style={[{ color: theme.textPrimary }, Typography.semiBold15_20]}>
                    {title}:
                </Text>
                <Text style={[{ color: theme.textPrimary, opacity: 0.7 }, Typography.medium15_20]}>
                    {body}
                </Text>
            </>
        )
    }, [theme])

    return (
        <View style={[
            { flexGrow: 1 },
            Platform.select({
                android: {
                    backgroundColor: theme.backgroundPrimary,
                    paddingTop: safeArea.top
                },
                ios: { backgroundColor: theme.elevation }
            })
        ]}>
            <StatusBar style={Platform.select({ android: theme.style === 'dark' ? 'light' : 'dark', ios: 'light' })} />
            <ScreenHeader
                onClosePressed={onCancel}
                onBackPressed={!onCancel ? navigation.goBack : undefined}
                title={t('sign.title')}
            />
            <View style={[
                {
                    flexGrow: 1,
                    paddingHorizontal: 16,
                    paddingBottom: safeArea.bottom + 16
                },
                Platform.select({
                    ios: { backgroundColor: theme.elevation },
                    android: { backgroundColor: theme.backgroundPrimary }
                })
            ]}>
                <View style={{ marginTop: 16, gap: 16, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                        borderRadius: 20,
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'row'
                    }}>
                        <WImage
                            height={56}
                            width={56}
                            src={app.iconUrl}
                            borderRadius={16}
                        />
                    </View>
                    <View style={{ gap: 8 }}>
                        <Text style={[
                            { color: theme.textPrimary },
                            Typography.semiBold20_28
                        ]}>
                            {app.name}
                        </Text>
                        <Text style={[
                            { color: theme.textPrimary },
                            Typography.regular15_20
                        ]}>
                            {t('sign.message')}
                        </Text>
                    </View>
                </View>
                {payload.type === 'text' ? (
                    <ScrollView
                        style={{ flexBasis: 0, marginVertical: 16, borderRadius: 20, backgroundColor: theme.surfaceOnElevation, padding: 16 }}
                        showsVerticalScrollIndicator={true}
                        contentContainerStyle={{ gap: 16 }}
                    >
                        <Text style={[{ color: theme.textPrimary }, Typography.medium15_20]}>
                            {payload.text}
                        </Text>
                    </ScrollView>
                ) : (
                    <ScrollView
                        style={{ flexBasis: 0, marginVertical: 16, borderRadius: 20, backgroundColor: theme.surfaceOnElevation, padding: 16 }}
                        showsVerticalScrollIndicator={true}
                        contentContainerStyle={{ gap: 16 }}
                    >
                        {payload.type === 'binary' ? renderPayloadData(t('sign.binaryData'), payload?.bytes) :
                            <>
                                {renderPayloadData(t('sign.cellSchema'), payload?.schema)}
                                {renderPayloadData(t('sign.cellData'), payload?.cell)}
                            </>
                        }
                    </ScrollView>
                )}
                <View>
                    <View style={{ flexDirection: 'row', width: '100%', gap: 16, marginBottom: 16 }}>
                        <RoundButton
                            style={{ flex: 1 }}
                            display={'secondary'}
                            disabled={!onCancel}
                            title={t('common.cancel')}
                            onPress={onCancel}
                        />
                        <RoundButton
                            style={{ flex: 1 }}
                            title={t('sign.action')}
                            action={approve}
                        />
                    </View>
                </View>
            </View>
        </View >
    )
});