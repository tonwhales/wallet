import { FlatList, Platform, Text, View } from "react-native";
import { fragment } from "../../fragment";
import { useCurrentAddress } from "../../engine/hooks/appstate/useCurrentAddress";
import { useHoldersAccounts } from "../../engine/hooks/holders/useHoldersAccounts";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useHoldersAccountStatus, useNetwork, useTheme } from "../../engine/hooks";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { StatusBar } from "expo-status-bar";
import { t } from "../../i18n/t";
import { HoldersAccountItem, HoldersItemContentType } from "../../components/products/HoldersAccountItem";
import { useCallback } from "react";
import { GeneralHoldersAccount } from "../../engine/api/holders/fetchAccounts";
import { useFavoriteHoldersAccount } from "../../engine/hooks/holders/useFavoriteHoldersAccount";

export const SelectHoldersMainAccountFragment = fragment(() => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const { tonAddress, solanaAddress } = useCurrentAddress();
    const { isTestnet } = useNetwork();
    const holdersAccounts = useHoldersAccounts(tonAddress, solanaAddress).data?.accounts ?? [];
    const holdersAccStatus = useHoldersAccountStatus(tonAddress).data;
    const [favoriteHoldersAccount, setFavoriteHoldersAccount] = useFavoriteHoldersAccount()

    const onHoldersSelected = useCallback((account: GeneralHoldersAccount) => {
        if (!!account.address && account.address !== favoriteHoldersAccount) {
            setFavoriteHoldersAccount(account.address);
        }
    }, [navigation, favoriteHoldersAccount]);

    const renderItem = useCallback(({ item }: { item: GeneralHoldersAccount }) => {
        return tonAddress ? <HoldersAccountItem
            owner={tonAddress}
            account={item}
            itemStyle={{ backgroundColor: theme.surfaceOnElevation }}
            style={{ paddingVertical: 0 }}
            isTestnet={isTestnet}
            hideCardsIfEmpty
            holdersAccStatus={holdersAccStatus}
            onOpen={() => onHoldersSelected(item)}
            content={{ type: HoldersItemContentType.SELECT, isSelected: item.address === favoriteHoldersAccount }}
        /> : null
    }, [favoriteHoldersAccount, tonAddress, isTestnet, holdersAccStatus])
    
    return (
        <View style={{ flexGrow: 1 }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                title={t('wallet.mainAccount')}
                style={[
                    { paddingLeft: 16 },
                    Platform.select({ android: { paddingTop: safeArea.top } })
                ]}
                onClosePressed={navigation.goBack}
            />
            <FlatList
                data={holdersAccounts}
                renderItem={renderItem}
                removeClippedSubviews={true}
                ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                style={{ flexGrow: 1, flexBasis: 0, marginTop: 16 }}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                contentInset={{ bottom: safeArea.bottom + 16 }}
                keyExtractor={(item, index) => `main-account-i-${index}`}
                ListFooterComponent={<View style={{ height: Platform.OS === 'android' ? safeArea.bottom + 16 : 0 }} />}
            />
        </View>
    )
})