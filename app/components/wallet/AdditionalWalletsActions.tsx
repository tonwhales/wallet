import React from "react";
import { View, Text, Pressable } from "react-native";
import { TypedNavigation } from "../../utils/useTypedNavigation";
import { useAppConfig } from "../../utils/AppConfigContext";
import { t } from "../../i18n/t";
import { useBottomSheet } from "../modal/BottomSheetModal";
import { getAppState } from "../../storage/appState";

export const AdditionalWalletsActions = React.memo(({ navigation }: { navigation: TypedNavigation }) => {
    const { Theme } = useAppConfig();
    const modal = useBottomSheet();
    const appState = getAppState();

    return (
        <View style={{
            flexGrow: 1,
            paddingTop: 40,
            paddingHorizontal: 16, justifyContent: 'space-evenly',
        }}>
            <Text style={{
                fontSize: 32, fontWeight: '600',
                lineHeight: 38,
                color: Theme.textColor
            }}>
                {t('wallets.addNewTitle')}
            </Text>
            {appState.addresses.length <= 2 && (
                <>
                    <Pressable
                        onPress={() => {
                            modal?.hide();
                            navigation.navigate('WalletCreate', { additionalWallet: true });
                        }}
                        style={({ pressed }) => {
                            return {
                                opacity: pressed ? 0.5 : 1,
                                marginVertical: 12,
                                paddingVertical: 12,
                            }
                        }}
                    >
                        <Text style={{
                            fontSize: 17, fontWeight: '500',
                            lineHeight: 24,
                            color: Theme.textColor
                        }}>
                            {t('welcome.createWallet')}
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={() => {
                            modal?.hide();
                            navigation.navigate('WalletImport', { additionalWallet: true });
                        }}
                        style={({ pressed }) => {
                            return {
                                opacity: pressed ? 0.5 : 1,
                                marginBottom: 12,
                                paddingVertical: 12,
                            }
                        }}
                    >
                        <Text style={{
                            fontSize: 17, fontWeight: '500',
                            lineHeight: 24,
                            color: Theme.textColor
                        }}>
                            {t('welcome.importWallet')}
                        </Text>
                    </Pressable>
                </>
            )}

            <Pressable
                onPress={() => {
                    modal?.hide();
                    navigation.navigate('Ledger');
                }}
                style={({ pressed }) => {
                    return {
                        opacity: pressed ? 0.5 : 1,
                        marginBottom: 12,
                        paddingVertical: 12,
                    }
                }}
            >
                <Text style={{
                    fontSize: 17, fontWeight: '500',
                    lineHeight: 24,
                    color: Theme.textColor
                }}>
                    {t('hardwareWallet.actions.connect')}
                </Text>
            </Pressable>
        </View>
    )
});