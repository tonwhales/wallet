import { memo } from "react";
import { TouchableHighlight, View, Text, Image, Platform } from "react-native";
import { usePendingTransactions } from "../../../engine/hooks/usePendingTransactions";
import { PendingTransaction } from "../../../engine/state/pending";
import { useTheme } from "../../../engine/hooks/useTheme";
import { PendingTransactionAvatar } from "../../../components/PendingTransactionAvatar";
import { useNetwork } from "../../../engine/hooks/useNetwork";
import { KnownWallet, KnownWallets } from "../../../secure/KnownWallets";
import { t } from "../../../i18n/t";
import { ValueComponent } from "../../../components/ValueComponent";
import { useJettonContent } from "../../../engine/hooks/basic/useJettonContent";
import { knownAddressLabel } from "./TransactionView";
import { AddressComponent } from "../../../components/AddressComponent";
import { formatTime } from "../../../utils/dates";
import { useContactAddress } from "../../../engine/hooks/contacts/useContactAddress";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PendingTransactionView = memo(({ tx }: { tx: PendingTransaction }) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const targetFriendly = tx.address?.toString({ testOnly: isTestnet });
    const jettonMaster = useJettonContent(tx.body?.type === 'token' ? tx.body?.master.toString({ testOnly: isTestnet }) : null);
    const contact = useContactAddress(targetFriendly);

    // Resolve built-in known wallets
    let known: KnownWallet | undefined = undefined;
    if (targetFriendly && KnownWallets(isTestnet)[targetFriendly]) {
        known = KnownWallets(isTestnet)[targetFriendly];
    } else if (!!contact) { // Resolve contact known wallet
        known = { name: contact.name }
    }

    return (
        <Animated.View
            entering={FadeInDown}
            exiting={FadeOutUp}
            style={{ backgroundColor: theme.item }}
        >
            <View style={{ alignSelf: 'stretch', flexDirection: 'row', height: 62 }}>
                <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 0, marginVertical: 10, marginLeft: 10, marginRight: 10 }}>
                    <PendingTransactionAvatar
                        address={targetFriendly}
                        avatarId={targetFriendly || ''}
                    />
                </View>
                <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0 }}>
                    <View style={{ flexDirection: 'row', marginTop: 10, marginRight: 10 }}>
                        <View style={{
                            flexDirection: 'row',
                            flexGrow: 1, flexBasis: 0, marginRight: 16,
                        }}>
                            <Text
                                style={{ color: theme.textColor, fontSize: 16, fontWeight: '600', flexShrink: 1 }}
                                ellipsizeMode="tail"
                                numberOfLines={1}>
                                {t('tx.sending')}
                            </Text>
                        </View>
                        <Text
                            style={{
                                color: theme.priceNegative,
                                fontWeight: '400',
                                fontSize: 16,
                                marginRight: 2,
                            }}>
                            <ValueComponent
                                value={tx.amount}
                                decimals={jettonMaster ? jettonMaster.decimals : undefined}
                            />
                            {jettonMaster ? ' ' + jettonMaster.symbol : ''}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginRight: 10 }}>
                        {targetFriendly
                            ? (
                                <Text
                                    style={{ color: theme.textSecondary, fontSize: 13, flexGrow: 1, flexBasis: 0, marginRight: 16 }}
                                    ellipsizeMode="middle"
                                    numberOfLines={1}
                                >
                                    {known ?
                                        knownAddressLabel(known, isTestnet, targetFriendly)
                                        : <AddressComponent address={targetFriendly} />
                                    }
                                </Text>
                            )
                            : (
                                <Text
                                    style={{ color: theme.textSecondary, fontSize: 13, flexGrow: 1, flexBasis: 0, marginRight: 16 }}
                                    ellipsizeMode="middle"
                                    numberOfLines={1}
                                >
                                    {t('tx.batch')}
                                </Text>
                            )}
                        {tx.body?.type === 'comment'
                            ? <Image source={require('../../../../assets/comment.png')} style={{ marginRight: 4, transform: [{ translateY: 1.5 }] }} />
                            : null
                        }
                        <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>{formatTime(tx.time)}</Text>
                    </View>
                    <View style={{ flexGrow: 1 }} />
                    <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider }} />
                </View>
            </View>
        </Animated.View>
    )
});

export const PendingTransactions = memo(() => {
    const pending = usePendingTransactions();
    const safeArea = useSafeAreaInsets();
    return (
        <View style={{ paddingTop: (pending.length === 0 && Platform.OS === 'ios') ? safeArea.top : undefined }}>
            {pending.map((tx, i) => <PendingTransactionView key={tx.id} tx={tx} />)}
        </View>
    );
});