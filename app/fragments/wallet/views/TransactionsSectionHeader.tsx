import { memo } from "react";
import { ThemeType } from "../../../engine/state/theme";
import { Typography } from "../../../components/styles";
import { Text, View } from "react-native";

export const TransactionsSectionHeader = memo(({ theme, title }: { theme: ThemeType, title: string }) => {
    return (
        <View style={{ width: '100%', paddingVertical: 8, paddingHorizontal: 16, marginTop: 24 }}>
            <Text style={[{ color: theme.textPrimary }, Typography.semiBold20_28]}>
                {title}
            </Text>
        </View>
    )
});
TransactionsSectionHeader.displayName = 'TransactionsSectionHeader';