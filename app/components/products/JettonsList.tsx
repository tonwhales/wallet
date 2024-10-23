import { Pressable, View, Text, Platform, useWindowDimensions } from "react-native";
import { ItemSwitch } from "../Item";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useNetwork, useSelectedAccount, useTheme } from "../../engine/hooks";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useLedgerTransport } from "../../fragments/ledger/components/TransportContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address } from "@ton/core";
import { useSortedHints } from "../../engine/hooks/jettons/useSortedHints";
import { ScreenHeader } from "../ScreenHeader";
import { t } from "../../i18n/t";
import { Image } from "expo-image";
import { FlashList } from "@shopify/flash-list";
import { JettonProductItem } from "./JettonProductItem";
import Modal from "react-native-modal";
import { RoundButton } from "../RoundButton";
import { Typography } from "../styles";
import { ItemDivider } from "../ItemDivider";
import Animated, { Easing, LinearTransition, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { PerfView } from "../basic/PerfView";
import { LoadingIndicator } from "../LoadingIndicator";
import { filterHint, getHint, HintsFilter } from "../../utils/jettons/hintSortFilter";
import { queryClient } from "../../engine/clients";

const EmptyListItem = memo(() => {
    const theme = useTheme();

    return (
        <PerfView
            style={{
                flexDirection: 'row',
                borderRadius: 20,
                overflow: 'hidden',
                padding: 20,
                alignItems: 'center',
                height: 86,
                backgroundColor: theme.surfaceOnBg
            }}
        >
            <View style={{
                height: 46,
                width: 46,
                borderRadius: 23,
                backgroundColor: theme.divider,
                overflow: 'hidden',
                justifyContent: 'center',
                alignItems: 'center'
            }} >
                <LoadingIndicator simple color={theme.textPrimary} />
            </View>
            <View style={{ marginLeft: 12, flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                <PerfView>
                    <PerfView style={{
                        height: 20, width: 100,
                        backgroundColor: theme.textSecondary,
                        borderRadius: 8,
                        marginBottom: 4,
                        opacity: 0.5
                    }} />
                    <PerfView style={{
                        height: 20, width: 150,
                        backgroundColor: theme.textSecondary,
                        borderRadius: 8,
                        marginBottom: 4,
                        opacity: 0.3
                    }} />
                </PerfView>
                <PerfView style={{ alignItems: 'flex-end' }}>
                    <PerfView style={{
                        height: 20, width: 86,
                        backgroundColor: theme.textSecondary,
                        borderRadius: 8,
                        marginBottom: 8,
                        opacity: 0.5
                    }} />
                    <PerfView style={{
                        height: 20, width: 30,
                        backgroundColor: theme.textSecondary,
                        borderRadius: 8,
                        marginBottom: 4,
                        opacity: 0.5
                    }} />
                </PerfView>
            </View>
        </PerfView>
    )
});

export const JettonsList = memo(({ isLedger }: { isLedger: boolean }) => {
    const theme = useTheme();
    const { isTestnet: testOnly } = useNetwork();
    const dimentions = useWindowDimensions();
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

    const [filter, setFilter] = useState<HintsFilter[]>([]);
    const jettons = useSortedHints(addressStr);
    const [filteredJettons, setFilteredJettons] = useState(jettons);

    useEffect(() => {
        const cache = queryClient.getQueryCache();
        setFilteredJettons(
            jettons
                .map((h) => getHint(cache, h, testOnly))
                .filter(filterHint(filter)).map((x) => x.address)
        );

    }, [jettons, filter]);

    return (
        <Animated.View
            style={{ flexGrow: 1 }}
            layout={LinearTransition.duration(300).easing(Easing.bezierFn(0.25, 0.1, 0.25, 1))}
        >
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
                data={filteredJettons}
                renderItem={({ item }: { item: string }) => {
                    try {
                        const wallet = Address.parse(item);
                        return (
                            <JettonProductItem
                                card
                                last
                                wallet={wallet}
                                itemStyle={{ backgroundColor: theme.surfaceOnElevation, height: 86 }}
                                ledger={isLedger}
                                owner={selected!.address}
                            />
                        )
                    } catch (error) {
                        return null;
                    }
                }}
                // to see less blank space
                estimatedItemSize={80}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                contentInset={{ bottom: safeArea.bottom + 16, top: 16 }}
                keyExtractor={(item, index) => `jetton-i-${index}`}
                ListEmptyComponent={(
                    (filter?.length === 1 && filter?.includes('scam')) ? (
                        <View style={{
                            alignItems: 'center',
                            height: dimentions.height - (safeArea.bottom + safeArea.top + 44 + 32 + 32),
                            width: '100%',
                            gap: 8
                        }}>
                            <EmptyListItem />
                            <EmptyListItem />
                            <EmptyListItem />
                            <EmptyListItem />
                            <EmptyListItem />
                        </View>
                    ) : (
                        <View style={{
                            justifyContent: 'center', alignItems: 'center',
                            height: dimentions.height - (safeArea.bottom + safeArea.top + 44 + 32 + 32),
                            width: '100%',
                        }}>
                            <Text style={[Typography.semiBold27_32, { color: theme.textSecondary }]}>
                                {t('jetton.jettonsNotFound')}
                            </Text>
                        </View>
                    )
                )}
                ListFooterComponent={<View style={{ height: Platform.OS === 'android' ? safeArea.bottom + 16 : 0 }} />}
            />
            <JettonsFilterModal
                isModalVisible={isModalVisible}
                setFilter={setFilter}
                filter={filter}
                setModalVisible={setModalVisible}
            />
        </Animated.View>
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
    filter: HintsFilter[] | undefined,
    setModalVisible: (visible: boolean) => void
}) => {
    const safeArea = useSafeAreaInsets();
    const theme = useTheme();

    const [value, setValue] = useState<HintsFilter[]>([]);

    useEffect(() => {
        setValue(filter ?? []);
    }, [filter]);

    const scamHeight = useSharedValue(0);

    const scamStyle = useAnimatedStyle(() => {
        return {
            height: withTiming(scamHeight.value, { duration: 300 }),
            overflow: 'hidden'
        };
    })

    useEffect(() => {
        scamHeight.value = value.includes('verified') ? 0 : 72;
    }, [value]);

    const onUpdateValue = useCallback((key: HintsFilter) => {
        if (value.includes(key)) {
            setValue(value.filter((v) => v !== key));
        } else {
            setValue([...value, key]);
        }
    }, [value]);

    return (
        <Modal
            isVisible={isModalVisible}
            avoidKeyboard
            onBackdropPress={() => setModalVisible(false)}
        >
            <View
                style={{
                    marginTop: safeArea.top + 16,
                    paddingTop: 16,
                    backgroundColor: theme.elevation,
                    borderRadius: 20,
                    overflow: 'hidden',
                    justifyContent: 'center',
                    flexShrink: 1
                }}
            >
                <Text style={[Typography.semiBold24_30, { color: theme.textPrimary, textAlign: 'center' }]}>
                    {t('common.show')}
                </Text>
                <ItemDivider />
                <ItemSwitch
                    title={t('common.unverified')}
                    value={!value.includes('verified')}
                    onChange={() => onUpdateValue('verified')}
                />
                <Animated.View style={scamStyle}>
                    <ItemSwitch
                        title={'SCAM'}
                        value={!value.includes('scam')}
                        onChange={() => onUpdateValue('scam')}
                    />
                </Animated.View>
                <ItemSwitch
                    title={t('jetton.emptyBalance')}
                    value={!value.includes('balance')}
                    onChange={() => onUpdateValue('balance')}
                />
                <RoundButton
                    title={t('common.apply')}
                    style={{ marginHorizontal: 16, marginBottom: 16 }}
                    onPress={() => {
                        setModalVisible(false);
                        setFilter(value);
                    }}
                />
            </View>
        </Modal>
    );
});

JettonsList.displayName = 'JettonsList';