import { View, Text } from "react-native";
import { useTheme } from "../../../engine/hooks";
import { SolanaOrderApp } from "../ops/Order";
import { ItemGroup } from "../../../components/ItemGroup";
import { WImage } from "../../../components/WImage";
import { Typography } from "../../../components/styles";
import { t } from "../../../i18n/t";

const solAPIDomains = [
    'solapi.holders.io',
    'devnet-solapi.holders.io'
];

export const SolanaTransactionAppHeader = ({ order }: { order: SolanaOrderApp }) => {
    const theme = useTheme();
    const showDomain = order.domain && !solAPIDomains.includes(order.domain);
    return (
        <ItemGroup style={{ marginTop: 16, paddingHorizontal: 16 }}>
            <View style={{ flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {order.image && <WImage src={order.image} width={24} height={24} borderRadius={12} />}
                {order.label && <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>{order.label}</Text>}
            </View>
            {showDomain && <Text style={[{ color: theme.textPrimary }, Typography.semiBold15_20]}>{t('transfer.requestsToSign', { app: order.domain })}</Text>}
            {order.message && <Text style={[{ color: theme.textSecondary }, Typography.regular17_24]}>{order.message}</Text>}
        </ItemGroup>
    );
}