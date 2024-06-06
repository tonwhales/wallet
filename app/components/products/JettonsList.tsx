import { Pressable, View, Text, RefreshControlProps, RefreshControl, Platform } from "react-native";
import { ItemSwitch } from "../Item";
import { memo, useEffect, useMemo, useState } from "react";
import { useNetwork, useSelectedAccount, useTheme } from "../../engine/hooks";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useLedgerTransport } from "../../fragments/ledger/components/TransportContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address } from "@ton/core";
import { HintsFilter, useSortedHints } from "../../engine/hooks/jettons/useSortedHints";
import { ScreenHeader } from "../ScreenHeader";
import { t } from "../../i18n/t";
import { Image } from "expo-image";
import { FlashList } from "@shopify/flash-list";
import { JettonProductItem } from "./JettonProductItem";
import Modal from "react-native-modal";
import { RoundButton } from "../RoundButton";
import { Typography } from "../styles";
import { ItemDivider } from "../ItemDivider";

export const JettonsList = memo(({ isLedger }: { isLedger: boolean }) => {
    const theme = useTheme();
    const { isTestnet: testOnly } = useNetwork();
    const navigation = useTypedNavigation();
    const selected = useSelectedAccount();
    const ledgerContext = useLedgerTransport();
    const safeArea = useSafeAreaInsets();
    const [isModalVisible, setModalVisible] = useState(false);

    const addressStr = useMemo(() => {
        if (isLedger && ledgerContext?.addr?.address) {
            try {
                return Address.parse(ledgerContext.addr.address).toString({ testOnly });
            } catch {
                return '';
            }
        }
        return selected!.address.toString({ testOnly });
    }, [selected, ledgerContext, testOnly]);

    const [filter, setFilter] = useState<HintsFilter[]>(['scam']);
    const { hints: jettons, refreshAllHintsWeights } = useSortedHints(addressStr, filter);

    return (
        <View style={{ flexGrow: 1 }}>
            <ScreenHeader
                style={{ paddingHorizontal: 16, marginTop: Platform.OS === 'android' ? safeArea.top : 0 }}
                onBackPressed={navigation.goBack}
                title={t('jetton.productButtonTitle')}
                rightButton={
                    <Pressable
                        onPress={() => setModalVisible(true)}
                        style={({ pressed }) => ({
                            opacity: pressed ? 0.5 : 1,
                            backgroundColor: theme.surfaceOnElevation,
                            borderRadius: 32,
                            height: 32, width: 32,
                            justifyContent: 'center', alignItems: 'center',
                        })}
                    >
                        <Image
                            source={require('@assets/ic-filter.png')}
                            style={{ height: 16, width: 16, tintColor: theme.iconNav }}
                        />
                    </Pressable>
                }
            />
            <FlashList
                data={jettons}
                renderItem={({ item, index }: { item: string, index: number }) => {
                    try {
                        const wallet = Address.parse(item);
                        return (
                            <JettonProductItem
                                key={`${item}-${index}`}
                                card
                                last
                                wallet={wallet}
                                itemStyle={{ backgroundColor: theme.surfaceOnElevation }}
                                ledger={isLedger}
                                owner={selected!.address}
                            />
                        )
                    } catch (error) {
                        return null;
                    }
                }}
                refreshControl={<RefreshControl refreshing={false} onRefresh={refreshAllHintsWeights} />}
                estimatedItemSize={102}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                contentInset={{ bottom: safeArea.bottom + 16, top: 16 }}
                keyExtractor={(item, index) => `jetton-i-${index}`}
                ListEmptyComponent={(
                    <View style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        justifyContent: 'center', alignItems: 'center'
                    }}>
                        <Text style={[Typography.semiBold27_32, { color: theme.textPrimary }]}>
                            {'No jettons found'}
                        </Text>
                    </View>
                )}
                ListFooterComponent={<View style={{ height: Platform.OS === 'android' ? safeArea.bottom + 16 : 0 }} />}
            />
            <JettonsFilterModal
                isModalVisible={isModalVisible}
                setFilter={setFilter}
                filter={filter}
                setModalVisible={setModalVisible}
            />
        </View>
    );
});


const JettonsFilterModal = memo(({
    isModalVisible,
    setFilter,
    filter,
    setModalVisible
}: {
    isModalVisible: boolean,
    setFilter: (filter: HintsFilter[]) => void,
    filter: HintsFilter[],
    setModalVisible: (visible: boolean) => void
}) => {
    const safeArea = useSafeAreaInsets();
    const theme = useTheme();

    const [showScam, setShowScam] = useState(!filter.includes('scam'));
    const [showUnverified, setShowUnverified] = useState(!filter.includes('verified'));
    const [showZeroBalance, setShowZeroBalance] = useState(!filter.includes('balance'));
    const [showNotReady, setShowNotReady] = useState(!filter.includes('ready'));

    useEffect(() => {
        setShowScam(!filter.includes('scam'));
        setShowUnverified(!filter.includes('verified'));
        setShowZeroBalance(!filter.includes('balance'));
        setShowNotReady(!filter.includes('ready'));
    }, [filter]);

    return (
        <Modal
            isVisible={isModalVisible}
            avoidKeyboard
            onBackdropPress={() => setModalVisible(false)}
        >
            <View style={{
                marginTop: safeArea.top + 16,
                paddingTop: 16,
                backgroundColor: theme.elevation,
                borderRadius: 20,
                overflow: 'hidden',
                justifyContent: 'center',
                flexShrink: 1
            }}>
                <Text style={[Typography.semiBold24_30, { color: theme.textPrimary, textAlign: 'center' }]}>
                    {t('common.show')}
                </Text>
                <ItemDivider />
                <ItemSwitch
                    title={'SCAM'}
                    value={showScam}
                    onChange={setShowScam}
                />
                <ItemSwitch
                    title={t('common.unverified')}
                    value={showUnverified}
                    onChange={setShowUnverified}
                />
                <ItemSwitch
                    title={t('jetton.emptyBalance')}
                    value={showZeroBalance}
                    onChange={setShowZeroBalance}
                />
                <ItemSwitch
                    title={t('common.notFound')}
                    value={showNotReady}
                    onChange={setShowNotReady}
                />
                <RoundButton
                    title={t('common.apply')}
                    style={{ marginHorizontal: 16, marginBottom: 16 }}
                    onPress={() => {
                        setModalVisible(false);
                        setFilter(
                            [
                                ...(showScam ? [] : ['scam']),
                                ...(showUnverified ? [] : ['verified']),
                                ...(showZeroBalance ? [] : ['balance']),
                                ...(showNotReady ? [] : ['ready'])
                            ] as HintsFilter[]
                        );
                    }}
                />
            </View>
        </Modal>
    );
});

JettonsList.displayName = 'JettonsList';