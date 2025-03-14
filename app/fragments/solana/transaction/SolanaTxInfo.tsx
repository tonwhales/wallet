import { memo, useCallback, useEffect, useMemo } from "react";
import { Platform, Pressable, Share, Image } from "react-native";
import { useActionSheet } from "@expo/react-native-action-sheet";
import * as ScreenCapture from 'expo-screen-capture';
import { SolanaTx } from "../../../engine/api/solana/fetchSolanaTransactions";
import { useNetwork, useTheme } from "../../../engine/hooks";
import { ToastDuration, useToaster } from "../../../components/toast/ToastProvider";
import { t } from "../../../i18n/t";
import { openWithInApp } from "../../../utils/openWithInApp";
import { copyText } from "../../../utils/copyText";
import { PerfView } from "../../../components/basic/PerfView";
import { PerfText } from "../../../components/basic/PerfText";
import { Typography } from "../../../components/styles";

export const SolanaTxInfo = memo((solanaTx: SolanaTx) => {
    const { showActionSheetWithOptions } = useActionSheet();
    const { isTestnet } = useNetwork();
    const toaster = useToaster();
    const theme = useTheme();
    const explorerLink = `https://explorer.solana.com/tx/${solanaTx.signature}?cluster=${isTestnet ? 'devnet' : 'mainnet'}`;

    const onTxIdPress = useCallback(() => {
        if (!explorerLink) {
            return;
        }
        const options = [
            t('common.cancel'),
            t('txActions.view'),
            t('common.copy'),
            t('common.share')
        ];
        const cancelButtonIndex = 0;

        showActionSheetWithOptions({
            title: t('common.tx'),
            message: solanaTx.signature,
            options,
            cancelButtonIndex,
        }, (selectedIndex?: number) => {
            switch (selectedIndex) {
                case 1:
                    openWithInApp(explorerLink);
                    break;
                case 2:
                    copyText(explorerLink);
                    toaster.show(
                        {
                            message: t('common.copiedAlert'),
                            type: 'default',
                            duration: ToastDuration.SHORT,
                        }
                    );
                    break;
                case 3:
                    if (Platform.OS === 'ios') {
                        Share.share({ title: t('receive.share.title'), url: explorerLink });
                    } else {
                        Share.share({ title: t('receive.share.title'), message: explorerLink });
                    }
                    break;
                case cancelButtonIndex:
                // Canceled
                default:
                    break;
            }
        });
    }, [explorerLink, solanaTx.signature]);

    useEffect(() => {
        let subscription: ScreenCapture.Subscription;
        if (Platform.OS === 'ios') {
            subscription = ScreenCapture.addScreenshotListener(() => {
                if (!explorerLink) {
                    return;
                }
                Share.share({ title: t('txActions.share.transaction'), url: explorerLink });
            });
        }
        return () => subscription?.remove();
    }, [explorerLink]);

    return (
        <Pressable
            onPress={onTxIdPress}
            style={({ pressed }) => ({ paddingHorizontal: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', opacity: pressed ? 0.5 : 1 })}
        >
            <PerfView>
                <PerfText style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                    {t('common.tx')}
                </PerfText>
                <PerfText style={[{ color: theme.textPrimary }, Typography.medium17_24]}>
                    {solanaTx.signature.slice(0, 4)}...{solanaTx.signature.slice(-4)}
                </PerfText>
            </PerfView>
            <Image
                source={require('@assets/ic-explorer.png')}
                style={{
                    tintColor: theme.iconPrimary,
                    height: 24, width: 24
                }}
            />
        </Pressable>
    )
});
SolanaTxInfo.displayName = 'SolanaTxInfo';