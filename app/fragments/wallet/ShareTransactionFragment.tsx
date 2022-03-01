import React from "react";
import { useTranslation } from "react-i18next";
import { Platform, View, Text, ScrollView, Share } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fromNano } from "ton";
import { AppConfig } from "../../AppConfig";
import { CloseButton } from "../../components/CloseButton";
import { RoundButton } from "../../components/RoundButton";
import { WalletAddress } from "../../components/WalletAddress";
import { fragment } from "../../fragment";
import { Transaction } from "../../sync/Transaction";
import { Theme } from "../../Theme";
import { formatDate, formatTime } from "../../utils/dates";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import Clipboard from '@react-native-clipboard/clipboard';

export const ShareTransactionFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const { t } = useTranslation();
    const { transaction } = useParams<{ transaction?: Transaction | null }>();
    const safeArea = useSafeAreaInsets();

    if (!transaction || !transaction.address) {
        return (<></>);
    }

    const query = {
        amount: transaction.amount.neg(),
        text: transaction.body?.type === 'comment' ? transaction.body.comment : null
    }
    const queryObj: {} = Object.fromEntries(Object.entries(query).filter(([_, v]) => v != null));
    const queryString = new URLSearchParams(queryObj).toString();
    console.log('queryString', queryString);
    console.log('address', transaction.address.toFriendly({ testOnly: AppConfig.isTestnet }));
    const link = `${AppConfig.isTestnet
        ? 'https://test.tonhub.com/transfer/'
        : 'https://tonhub.com/transfer/'
        }${transaction.address.toFriendly({ testOnly: AppConfig.isTestnet })
        }${queryString ? '?' + queryString : ''}`;

    const onCopy = React.useCallback(() => {
        Clipboard.setString(link);
    }, []);

    console.log('link', link);

    const onShare = React.useCallback(() => {
        if (Platform.OS === 'ios') {
            Share.share({ title: t('txShare.title'), url: link });
        } else {
            Share.share({ title: t('txShare.title'), message: link });
        }
    }, []);

    return (
        <View style={{ paddingTop: 42 }}>
            {/* Header */}
            <View style={{
                position: 'absolute',
                top: 12,
                width: '100%',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                <Text
                    style={{
                        fontWeight: '600',
                        fontSize: 17,
                        lineHeight: 32,
                        letterSpacing: -0.5,
                    }}
                >
                    {t('txShare.title')}
                </Text>
                {Platform.OS === 'ios' && (
                    <CloseButton
                        style={{ position: 'absolute', right: 10 }}
                        onPress={navigation.goBack}
                    />
                )}
            </View>
            {/* Content */}
            <ScrollView
                style={{
                    paddingHorizontal: 16,
                }}
                contentContainerStyle={{
                    alignItems: 'center',
                }}
            >
                {transaction && (
                    <>
                        <Text style={{ color: Theme.textSecondary, fontSize: 16, marginTop: 10 }}>
                            {`${formatDate(transaction.time, 'dd.MM.yyyy')} ${formatTime(transaction.time)}`}
                        </Text>
                        <View style={{
                            marginBottom: 16, marginTop: 20,
                            backgroundColor: "white",
                            borderRadius: 14,
                            justifyContent: 'center',
                            width: '100%'
                        }}>
                            {transaction.address && (
                                <>
                                    <View style={{ paddingVertical: 16, paddingHorizontal: 16 }}>
                                        <WalletAddress
                                            address={transaction.address.toFriendly({ testOnly: AppConfig.isTestnet })}
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
                                </>
                            )}
                            {transaction.amount && (
                                <>
                                    <View style={{ paddingVertical: 16, paddingHorizontal: 16 }}>
                                        <Text
                                            style={{
                                                textAlign: 'left',
                                                fontWeight: '600',
                                                fontSize: 16,
                                                lineHeight: 20
                                            }}
                                        >
                                            {fromNano(transaction.amount.neg())}
                                        </Text>
                                        <Text style={{ marginTop: 5, fontWeight: '400', color: '#8E979D' }}>
                                            {t('common.amount')}
                                        </Text>
                                    </View>
                                    <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 15 }} />
                                </>
                            )}
                            {transaction.body && transaction.body.type === 'comment' && (
                                <>
                                    <View style={{ paddingVertical: 16, paddingHorizontal: 16 }}>
                                        <Text
                                            style={{
                                                textAlign: 'left',
                                                fontWeight: '600',
                                                fontSize: 16,
                                                lineHeight: 20
                                            }}
                                        >
                                            {transaction.body.comment}
                                        </Text>
                                        <Text style={{ marginTop: 5, fontWeight: '400', color: '#8E979D' }}>
                                            {t('common.comment')}
                                        </Text>
                                    </View>
                                    <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 15 }} />
                                </>
                            )}
                            {transaction.fees && (
                                <>
                                    <View style={{ paddingVertical: 16, paddingHorizontal: 16 }}>
                                        <Text
                                            style={{
                                                textAlign: 'left',
                                                fontWeight: '600',
                                                fontSize: 16,
                                                lineHeight: 20
                                            }}
                                        >
                                            {fromNano(transaction.fees)}
                                        </Text>
                                        <Text style={{ marginTop: 5, fontWeight: '400', color: '#8E979D' }}>
                                            {t('txPreview.blockchainFee')}
                                        </Text>
                                    </View>
                                    <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 15 }} />
                                </>
                            )}
                            <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 16 }}>
                                <Text style={{
                                    fontWeight: '600',
                                    fontSize: 16,
                                    lineHeight: 20,
                                }}>
                                    {t('txShare.total')}
                                </Text>
                                <Text style={{
                                    fontWeight: '600',
                                    fontSize: 16,
                                    lineHeight: 20,
                                }}>
                                    {fromNano(transaction.amount.sub(transaction.fees).neg())}
                                </Text>
                            </View>
                        </View>
                        <View style={{
                            flexDirection: 'row',
                            marginBottom: safeArea.bottom + 16,
                            marginTop: 28,
                            justifyContent: 'space-evenly',
                            alignContent: 'stretch'
                        }}>
                            <RoundButton
                                title={t('common.copy')}
                                onPress={onCopy}
                                style={{ flex: 2, marginRight: 16, alignSelf: 'stretch' }}
                                display={'secondary'}
                            />
                            <RoundButton
                                title={t('common.share')}
                                onPress={onShare}
                                style={{ flex: 2, alignSelf: 'stretch' }}
                            />
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
});