import React from "react";
import { View, Platform, Text, Image } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { getAppState } from "../../storage/appState";
import { CloseButton } from "../../components/CloseButton";
import { Theme } from "../../Theme";
import { useNavigation } from "@react-navigation/native";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { useParams } from "../../utils/useParams";
import { RawTransaction } from "ton";
import { parseWalletTransaction } from "../../sync/parseWalletTransaction";
import { avatarHash } from "../../utils/avatarHash";

export const TransactionPreviewFragment = fragment(() => {
    const { t } = useTranslation();
    const safeArea = useSafeAreaInsets();
    const navigation = useNavigation();
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
            paddingTop: Platform.OS === 'android' ? safeArea.top + 24 : undefined
        }}>
            <AndroidToolbar style={{ position: 'absolute', top: safeArea.top }} pageTitle={t("Receive Toncoin")} />
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
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={navigation.goBack}
                />
            )}
        </View>
    );
});