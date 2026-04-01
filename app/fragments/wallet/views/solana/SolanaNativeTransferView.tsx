import { memo } from "react";
import { View, Text, Pressable } from "react-native";
import { useTypedNavigation } from "../../../../utils/useTypedNavigation";
import { SolanaTransaction, SolanaNativeTransfer } from "../../../../engine/api/solana/fetchSolanaTransactions";
import { t } from "../../../../i18n/t";
import { avatarHash } from "../../../../utils/avatarHash";
import { useTheme } from "../../../../engine/hooks/theme";
import { avatarColors } from "../../../../components/avatar/Avatar";
import { formatTime } from "../../../../utils/dates";
import { ValueComponent } from "../../../../components/ValueComponent";
import { AddressInputAvatar } from "../../../../components/address/AddressInputAvatar";
import { Typography } from "../../../../components/styles";
import { TRANSACTION_AVATAR_SIZE } from "../../../../utils/constants";
import { useForcedAvatarType } from "../../../../engine/hooks";

export const SolanaNativeTransferView = memo(({ transfer, owner, item }: { transfer: SolanaNativeTransfer, owner: string, item: SolanaTransaction }) => {
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const { fromUserAccount, toUserAccount, amount } = transfer;
    const kind: 'in' | 'out' = fromUserAccount === owner ? 'out' : 'in';
    const op = kind === 'in' ? t('tx.received') : t('tx.sent');
    const address = kind === 'in' ? fromUserAccount : toUserAccount;
    const amountColor = (kind === 'in') ? theme.accentGreen : theme.textPrimary;
    const avatarColor = avatarColors[avatarHash(address, avatarColors.length)];
    const forceAvatar = useForcedAvatarType({ address });

    const navigate = () => {
        navigation.navigateSolanaTransaction({
            owner,
            transaction: item,
            transfer: { data: transfer, type: 'native' }
        });
    }

    return (
        <Pressable
            onPress={navigate}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, flexDirection: 'row', alignItems: 'center', gap: 8 })}
        >
            <View style={{
                width: TRANSACTION_AVATAR_SIZE, height: TRANSACTION_AVATAR_SIZE, borderRadius: 24,
                backgroundColor: theme.surfaceOnBg,
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <AddressInputAvatar
                    size={TRANSACTION_AVATAR_SIZE}
                    theme={theme}
                    isOwn={false}
                    markContact={false}
                    friendly={address}
                    avatarColor={avatarColor}
                    knownWallets={{}}
                    hash={null}
                    disableFade
                    forceAvatar={forceAvatar}
                />
            </View>
            <View style={{ flex: 1, marginRight: 4 }}>
                <Text
                    style={[
                        { color: theme.textPrimary, flexShrink: 1 },
                        Typography.semiBold17_24
                    ]}
                    ellipsizeMode={'tail'}
                    numberOfLines={1}
                >
                    {op}
                </Text>
                <Text style={[
                    { color: theme.textSecondary, marginRight: 8, marginTop: 2 },
                    Typography.regular15_20
                ]}>
                    {address.slice(0, 4)}...{address.slice(-4)}
                    {' • '}
                    {formatTime(item.timestamp)}
                </Text>
            </View>
            <View>
                <Text style={[{ color: amountColor, marginRight: 2 }, Typography.semiBold17_24]}
                    numberOfLines={1}>
                    {kind === 'in' ? '+' : '-'}
                    <ValueComponent
                        value={BigInt(amount)}
                        precision={2}
                        suffix=" SOL"
                        centFontStyle={{ fontSize: 15 }}
                    />
                </Text>
            </View>
        </Pressable>
    )
});

SolanaNativeTransferView.displayName = 'SolanaNativeTransferView';