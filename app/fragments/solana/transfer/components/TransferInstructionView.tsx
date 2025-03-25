import { useSolanaTransferInstruction, useTheme } from "../../../../engine/hooks";
import { InstructionName, ParsedTransactionInstruction } from "../../../../utils/solana/parseInstructions";
import { View, Text } from "react-native";
import { Typography } from "../../../../components/styles";
import { ItemGroup } from "../../../../components/ItemGroup";
import { ItemDivider } from "../../../../components/ItemDivider";
import { t } from "../../../../i18n/t";
import { HoldersSolanaLimitsView } from "../../../../components/transfer/HoldersSolanaOpView";
import { AddressInputAvatar } from "../../../../components/address/AddressInputAvatar";
import { avatarHash } from "../../../../utils/avatarHash";
import { avatarColors } from "../../../../components/avatar/Avatar";
import { SolanaWalletAddress } from "../../../../components/address/SolanaWalletAddress";
import { PriceComponent } from "../../../../components/PriceComponent";

export const TransferInstructionView = (params: { instruction: ParsedTransactionInstruction, owner: string }) => {
    const { instruction, owner } = params;
    const theme = useTheme();
    const op = instruction?.name as InstructionName;

    const {
        from,
        to,
        mint,
        amount,
        isHoldersOp,
        limits,
        validAmount
    } = useSolanaTransferInstruction(instruction, owner);

    if (!instruction) {
        return null;
    }

    const avatarColorHash = avatarHash(to ?? '', avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];

    return (
        <View style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', flexDirection: 'column', gap: 16 }}>
            <ItemGroup style={{ paddingTop: 27 }}>
                <View style={{
                    backgroundColor: theme.divider,
                    height: 54,
                    position: 'absolute', left: 0, right: 0
                }} />
                <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ width: 68, flexDirection: 'row', height: 68 }}>
                        <AddressInputAvatar
                            size={68}
                            theme={theme}
                            isOwn={false}
                            markContact={false}
                            friendly={to ?? ''}
                            avatarColor={avatarColor}
                            forceAvatar={isHoldersOp ? 'holders' : undefined}
                        />
                    </View>
                </View>
                <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={[{ color: theme.textPrimary, marginTop: 8 }, Typography.semiBold17_24]}>
                        {t(`solana.instructions.${op}`)}
                    </Text>
                    <Text style={[{ color: theme.textPrimary, marginTop: 2 }, Typography.regular17_24]}>
                        <SolanaWalletAddress
                            address={to ?? ''}
                            elipsise={{ start: 4, end: 4 }}
                            copyOnPress
                            disableContextMenu
                            copyToastProps={{ marginBottom: 70 }}
                        />
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', paddingHorizontal: 26, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                    <Text
                        minimumFontScale={0.4}
                        adjustsFontSizeToFit={true}
                        numberOfLines={1}
                        style={[{ color: theme.textPrimary, marginTop: 12 }, Typography.semiBold27_32]}
                    >
                        {amount}
                    </Text>
                </View>
                {validAmount && (
                    <PriceComponent
                        amount={validAmount}
                        style={{
                            backgroundColor: theme.transparent,
                            paddingHorizontal: 0, marginTop: 2,
                            alignSelf: 'center',
                            paddingLeft: 0
                        }}
                        prefix={'-'}
                        textStyle={[{ color: theme.textSecondary }, Typography.semiBold17_24]}
                        priceUSD={1}
                        theme={theme}
                    />
                )}
            </ItemGroup>

            {(from && to) && (
                <ItemGroup>
                    <View style={{ gap: 16 }}>
                        <View style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
                            <Text style={[{ color: theme.textSecondary }, Typography.regular13_18]}>
                                {t('common.from')}
                            </Text>
                            <View style={{ alignItems: 'center', flexDirection: 'row', }}>
                                <Text style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                                    {from}
                                </Text>
                            </View>
                        </View>
                        <ItemDivider marginHorizontal={10} marginVertical={0} />
                        <View style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
                            <Text style={[{ color: theme.textSecondary }, Typography.regular13_18]}>
                                {t('common.to')}
                            </Text>
                            <View style={{ alignItems: 'center', flexDirection: 'row', }}>
                                <Text style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                                    {to}
                                </Text>
                            </View>
                        </View>
                    </View>
                </ItemGroup>
            )}

            {!!limits && (<HoldersSolanaLimitsView {...limits} />)}
        </View>
    );
}