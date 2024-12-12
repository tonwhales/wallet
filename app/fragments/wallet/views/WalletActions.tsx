import { memo } from "react";
import { Platform, View } from "react-native";
import { ThemeType } from "../../../engine/state/theme";
import { TypedNavigation } from "../../../utils/useTypedNavigation";
import { WalletActionButton, WalletActionType } from "./WalletActionButton";
import { isNeocryptoAvailable } from "../../../utils/isNeocryptoAvailable";
import { useAppConfig } from "../../../engine/hooks/useAppConfig";
import { Jetton } from "../../../engine/types";
import { JettonMasterState } from "../../../engine/metadata/fetchJettonMasterContent";
import { Address } from "@ton/core";
import { useHoldersAccounts } from "../../../engine/hooks";

export const WalletActions = memo(({ theme, navigation, isTestnet, jetton, address }: { theme: ThemeType, navigation: TypedNavigation, isTestnet: boolean, jetton?: Jetton, address?: Address }) => {
    const showBuy = isNeocryptoAvailable();
    const appConfig = useAppConfig();
    const holdersAccounts = useHoldersAccounts(address).data;
    const holdersAccountsCount = holdersAccounts?.accounts?.length ?? 0;
    const receiveType = holdersAccountsCount > 0 ? WalletActionType.Deposit : WalletActionType.Receive;
    // TODO: rm platfrom check after review
    // dont show swap on ios until the issue with review is resolved
    const showSwap = appConfig?.features?.swap && Platform.OS === 'android';

    const jettonData: JettonMasterState | undefined = jetton ? {
        symbol: jetton.symbol,
        name: jetton.name,
        description: jetton.description,
        decimals: jetton.decimals,
        assets: jetton.assets ?? undefined,
        pool: jetton.pool ?? undefined,
        originalImage: jetton.icon,
        image: jetton.icon ? { preview256: jetton.icon, blurhash: '' } : null,
    } : undefined

    return (
        <View style={{ paddingHorizontal: 16, width: '100%' }}>
            {!jetton && (
                <View style={{
                    backgroundColor: theme.backgroundUnchangeable,
                    position: 'absolute', top: Platform.OS === 'android' ? -1 : 0, left: 0, right: 0,
                    height: '50%',
                    borderBottomLeftRadius: 20,
                    borderBottomRightRadius: 20,
                }} />
            )}
            <View
                style={{
                    marginTop: 28,
                    flexDirection: 'row',
                    justifyContent: 'space-evenly',
                    alignItems: 'center',
                    backgroundColor: theme.surfaceOnBg,
                    borderRadius: 20,
                    overflow: 'hidden',
                    height: 96,
                    paddingBottom: 2,
                }}
                collapsable={false}
            >
                {!isTestnet && showBuy && (
                    <WalletActionButton
                        action={{ type: WalletActionType.Buy }}
                        navigation={navigation}
                        theme={theme}
                    />
                )}
                <WalletActionButton
                    action={
                        !!jetton
                            ? { type: receiveType, jetton: { master: jetton.master, data: jettonData } }
                            : { type: receiveType }
                    }
                    navigation={navigation}
                    theme={theme}
                />
                {!isTestnet && showSwap && (
                    <WalletActionButton
                        action={{ type: WalletActionType.Swap }}
                        navigation={navigation}
                        theme={theme}
                    />
                )}
                <WalletActionButton
                    action={
                        !!jetton
                            ? { type: WalletActionType.Send, jetton: jetton.wallet }
                            : { type: WalletActionType.Send }
                    }
                    navigation={navigation}
                    theme={theme}
                />
            </View>
        </View>
    );
});