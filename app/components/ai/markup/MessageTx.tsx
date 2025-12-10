import { memo, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { TxElement } from "../../../engine/ai/markup-types";
import { Typography } from "../../styles";
import { useNetwork, useTheme } from "../../../engine/hooks";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { HoldersAppParams, HoldersAppParamsType } from "../../../fragments/holders/HoldersAppFragment";
import { formatTxAmount } from "../../../engine/ai";
import { MessageTxIcon } from ".";
import { t } from "../../../i18n/t";
import { formatDate } from "../../../utils/dates";

interface ParsedDetails {
    merchant?: string;
    amount?: string;
    currency?: string;
    category?: string;
    status?: string;
    [key: string]: any;
}

export const MessageTx = memo(({ element }: { element: TxElement }) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const { type, hash, id, details, title, merchant, merchantCountry, merchantCategory, date } = element.attributes;

    const { isNeg, text: amountText } = formatTxAmount(element);
    const amountTextColor = isNeg ? theme.textPrimary : theme.accentGreen;

    const parsedDetails = useMemo<ParsedDetails | null>(() => {
        if (!details) return null;

        try {
            return JSON.parse(details);
        } catch (error) {
            console.warn('Failed to parse transaction details:', error);
            return null;
        }
    }, [details]);

    const handlePress = () => {
        try {
            switch (type) {
                case 'ton':
                    // TODO: добавить навигацию для TON транзакций
                    break;
                case 'solana':
                    // TODO: добавить навигацию для Solana транзакций
                    break;
                case 'holders': {
                    if (!id) return;
                    const holdersNavParams: HoldersAppParams = {
                        type: HoldersAppParamsType.Transaction,
                        id: id
                    }
                    navigation.navigateHolders(holdersNavParams, isTestnet);
                    break;
                }
                default:
                    break;
            }
        } catch (error) {
            console.warn('Failed to navigate to transaction:', error);
        }
    };

    const getTypeLabel = () => {
        switch (type) {
            case 'ton':
                return 'TON';
            case 'solana':
                return 'Solana';
            case 'holders':
                return 'Holders';
            default:
                return '';
        }
    };

    const displayTitle = useMemo(() => {
        if (type === 'holders' && merchant) {
            return merchant;
        }

        if (title) {
            return title;
        }

        return `${getTypeLabel()} Transaction`;
    }, [title, type, parsedDetails]);

    const displayDescription = useMemo(() => {
        if (type === 'holders' && merchantCategory) {
            return t(`aiChat.tx.categories.${merchantCategory}`);
        }

        return `${getTypeLabel()} Transaction`;
    }, [type, merchantCategory]);

    return (
        <Pressable
            onPress={handlePress}
            style={({ pressed }) => ({
                backgroundColor: theme.surfaceOnBg,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginVertical: 2,
                opacity: pressed ? 0.7 : 1,
                borderWidth: 1,
                borderColor: theme.divider,
            })}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <MessageTxIcon element={element} />
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text
                            style={[Typography.semiBold17_24, { color: theme.textPrimary, marginBottom: 4, flexShrink: 1 }]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {displayTitle}
                        </Text>
                        <Text
                            style={[Typography.semiBold17_24, { color: amountTextColor, marginBottom: 4 }]}
                            numberOfLines={1}
                        >
                            {amountText}
                        </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={[Typography.regular15_20, { color: theme.textSecondary }]}>
                            {displayDescription}
                        </Text>
                        {date && (
                            <Text style={[Typography.regular15_20, { color: theme.textSecondary }]}>
                                {formatDate(date)}
                            </Text>
                        )}
                    </View>

                    {hash && (
                        <Text
                            style={[Typography.regular13_18, { color: theme.textSecondary, marginTop: 2 }]}
                            numberOfLines={1}
                        >
                            {hash.slice(0, 8)}...{hash.slice(-6)}
                        </Text>
                    )}
                </View>
            </View>
        </Pressable>
    );
});

