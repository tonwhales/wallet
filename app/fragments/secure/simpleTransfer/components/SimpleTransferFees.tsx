import { memo } from "react";
import { Text, View } from "react-native";
import { t } from '../../../../i18n/t';
import { formatAmount } from '../../../../utils/formatCurrency';
import { useTheme } from '../../../../engine/hooks';
import { fromNano } from '@ton/core';
import { AboutIconButton } from '../../../../components/AboutIconButton';
import { Typography } from '../../../../components/styles';

type Props = {
    estimation: bigint | null;
    estimationPrice?: string;
}

export const SimpleTransferFees = memo(({
    estimation,
    estimationPrice,
}: Props) => {
    const theme = useTheme();
    return (
        <View style={{
            backgroundColor: theme.surfaceOnElevation,
            padding: 20, borderRadius: 20,
            flexDirection: 'row',
            justifyContent: 'space-between', alignItems: 'center',
        }}>
            <View>
                <Text
                    style={{
                        color: theme.textSecondary,
                        fontSize: 13, lineHeight: 18, fontWeight: '400',
                        marginBottom: 2
                    }}>
                    {t('txPreview.blockchainFee')}
                </Text>
                <Text style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                    {estimation
                        ? <>
                            {`${formatAmount(fromNano(estimation))} TON`}
                        </>
                        : '...'
                    }
                    {!!estimationPrice && (
                        <Text style={[{ color: theme.textSecondary }, Typography.regular17_24]}>
                            {` (${estimationPrice})`}
                        </Text>

                    )}
                </Text>
            </View>
            <AboutIconButton
                title={t('txPreview.blockchainFee')}
                description={t('txPreview.blockchainFeeDescription')}
                style={{ height: 24, width: 24, position: undefined }}
                size={24}
            />
        </View>
    )
})
