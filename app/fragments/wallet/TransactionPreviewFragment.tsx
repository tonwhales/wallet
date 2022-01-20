import React from "react";
import { View, Platform, Text, Image, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { getAppState } from "../../storage/appState";
import { CloseButton } from "../../components/CloseButton";
import { Theme } from "../../Theme";
import { useNavigation } from "@react-navigation/native";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { useParams } from "../../utils/useParams";
import { fromNano, RawTransaction } from "ton";
import { parseWalletTransaction } from "../../sync/parse/parseWalletTransaction";
import { avatarHash } from "../../utils/avatarHash";
import BN from "bn.js";
import { ValueComponent } from "../../components/ValueComponent";
import { formatTime } from "../../utils/formatTime";
import { formatDate } from "../../utils/formatDate";
import { useTypedNavigation } from "../../utils/useTypedNavigation";

export const TransactionPreviewFragment = fragment(() => {
    const { t } = useTranslation();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const { transaction } = useParams<{ transaction?: RawTransaction | null }>();
    const address = React.useMemo(() => getAppState()!.address, []);
    const parsed = transaction ? parseWalletTransaction(transaction) : undefined;

    if (!parsed) {
        return <Text>{t('Error parsing transaction')}</Text>
    }

    // Avatar
    let avatarImage = require('../../../assets/avatar_own.png');
    if (parsed.address && !parsed.address.equals(address)) {
        const avatars = [
            require('../../../assets/avatar_1.png'),
            require('../../../assets/avatar_2.png'),
            require('../../../assets/avatar_3.png'),
            require('../../../assets/avatar_4.png'),
            require('../../../assets/avatar_5.png'),
            require('../../../assets/avatar_6.png'),
            require('../../../assets/avatar_7.png'),
            require('../../../assets/avatar_8.png')
        ];
        avatarImage = avatars[avatarHash(parsed.address.toFriendly(), avatars.length)];
    }

    // Transaction type
    let transactionType = 'Transfer';
    if (parsed.kind === 'out') {
        transactionType = 'Sent #' + parsed.seqno!;
    }
    if (parsed.kind === 'in') {
        transactionType = 'Received';
    }

    console.log('[TransactionPreviewFragment] transaction', transaction);

    return (
        <View style={{
            alignSelf: 'stretch', flexGrow: 1, flexBasis: 0,
            alignItems: 'center',
            backgroundColor: Theme.background,
            paddingTop: Platform.OS === 'android' ? safeArea.top + 24 : undefined,
            paddingHorizontal: 16
        }}>
            <AndroidToolbar style={{ position: 'absolute', top: safeArea.top, left: 0 }} pageTitle={t(transactionType)} />
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                {Platform.OS === 'ios' && (
                    <Text style={{ color: Theme.textColor, fontWeight: '600', fontSize: 17, marginTop: 12 }}>
                        {t(transactionType)}
                    </Text>
                )}
            </View>
            <View style={{ width: 84, height: 84, borderRadius: 100, borderWidth: 0, marginTop: 24 }}>
                <Image source={avatarImage} style={{ width: 84, height: 84, borderRadius: 100 }} />
            </View>
            <View style={{ marginTop: 34 }}>
                {parsed.status === 'failed' ? (
                    <Text style={{ color: 'orange', fontWeight: '600', fontSize: 16, marginRight: 2 }}>failed</Text>
                ) : (
                    <Text style={{ color: parsed.amount.gte(new BN(0)) ? '#4FAE42' : '#000000', fontWeight: '800', fontSize: 36, marginRight: 2 }}>
                        <ValueComponent value={parsed.amount} />
                        {' TON'}
                    </Text>
                )}
            </View>
            <Text style={{ color: Theme.textSecondary, fontSize: 12, marginTop: 10 }}>
                {`${formatDate(parsed.time, 'dd.MM.yyyy')} ${formatTime(parsed.time)}`}
            </Text>
            <View style={{ flexDirection: 'row', marginTop: 39 }} collapsable={false}>
                {parsed.kind === 'out' && (
                    <Pressable
                        style={(p) => ({ flexGrow: 1, flexBasis: 0, marginRight: 7, justifyContent: 'center', alignItems: 'center', height: 66, backgroundColor: p.pressed ? Theme.selector : 'white', borderRadius: 14 })}
                        onPress={() => navigation.navigate('Transfer', {
                            target: parsed?.address?.toFriendly(),
                            comment: parsed?.body?.comment,
                            amount: parsed.amount.neg()
                        })}
                    >
                        <Image source={require('../../../assets/ic_repeat.png')} />
                        <Text style={{ fontSize: 13, color: '#1C8FE3', marginTop: 4 }}>{t("send again")}</Text>
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
                <View style={{ paddingVertical: 16, paddingHorizontal: 16 }}>
                    <Text style={{
                        fontWeight: '600',
                        fontSize: 16,
                        lineHeight: 20
                    }}>
                        {parsed.address?.toFriendly()}
                    </Text>
                    <Text style={{ marginTop: 5, fontWeight: '400', color: '#8E979D' }}>
                        {t('Wallet address')}
                    </Text>
                </View>
                <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 15 }} />
                <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 16 }}>
                    <Text style={{
                        fontWeight: '600',
                        fontSize: 16,
                        lineHeight: 20,
                    }}>
                        {t('Blockchain fee')}
                    </Text>
                    <Text style={{
                        fontWeight: '600',
                        fontSize: 16,
                        lineHeight: 20,
                    }}>
                        {/* TODO calculated fee */}
                        {fromNano(parsed.fees)}
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