import { memo, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { TxElement } from "../../../engine/ai/markup-types";
import { Typography } from "../../styles";
import { useNetwork, useTheme } from "../../../engine/hooks";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { HoldersAppParams, HoldersAppParamsType } from "../../../fragments/holders/HoldersAppFragment";

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
    const { type, hash, lt, address, id, details, title } = element.attributes;

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
                case 'holders':
                    const holdersNavParams: HoldersAppParams = {
                        type: HoldersAppParamsType.Transactions,
                        query: { transactionId: id }
                    }
                    navigation.navigateHolders(holdersNavParams, isTestnet);
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
        if (title) return title;

        if (type === 'holders' && parsedDetails?.merchant) {
            return parsedDetails.merchant;
        }

        return `${getTypeLabel()} Transaction`;
    }, [title, type, parsedDetails]);

    const displayDescription = useMemo(() => {
        if (type === 'holders' && parsedDetails) {
            const parts: string[] = [];

            if (parsedDetails.amount && parsedDetails.currency) {
                parts.push(`${parsedDetails.amount} ${parsedDetails.currency}`);
            }

            if (parsedDetails.category) {
                parts.push(parsedDetails.category);
            }

            return parts.join(' • ');
        }

        return `${getTypeLabel()} Transaction`;
    }, [type, parsedDetails]);

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
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                    <Text style={[Typography.semiBold15_20, { color: theme.textPrimary, marginBottom: 4 }]}>
                        {displayTitle}
                    </Text>

                    <Text style={[Typography.regular13_18, { color: theme.textSecondary }]}>
                        {displayDescription}
                    </Text>

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

