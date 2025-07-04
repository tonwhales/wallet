import { memo, useCallback, useEffect, useMemo } from "react";
import { Platform, Pressable, Share, Image } from "react-native";
import { t } from "../../../../i18n/t";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { openWithInApp } from "../../../../utils/openWithInApp";
import { copyText } from "../../../../utils/copyText";
import { ToastDuration, ToastProps } from "../../../../components/toast/ToastProvider";
import { PerfView } from "../../../../components/basic/PerfView";
import { PerfText } from "../../../../components/basic/PerfText";
import { ThemeType } from "../../../../engine/state/theme";
import { Typography } from "../../../../components/styles";
import * as ScreenCapture from 'expo-screen-capture';
import { TONVIEWER_TRANSACTION_URL } from "../../../../utils/constants";

type TxInfoProps = {
    lt: string;
    hash: string;
    address: string;
    isTestnet: boolean;
    toaster: {
        show: (props: ToastProps) => void;
        clear: () => void;
        push: (props: ToastProps) => void;
        pop: () => void;
    }
    theme: ThemeType
}

export const TxInfo = memo(({ lt, hash, address, isTestnet, toaster, theme }: TxInfoProps) => {
    const { showActionSheetWithOptions } = useActionSheet();

    const txId = useMemo(() => {
        return lt + '_' + hash
    }, [lt, hash]);

    const tonhubLink = useMemo(() => {
        return `${isTestnet ? 'https://test.tonhub.com' : 'https://tonhub.com'}/share/tx/`
            + `${address}/`
            + `${lt}_${encodeURIComponent(hash)}`
    }, []);

    const tonviewerLink = useMemo(() => {
        const hexHash = Buffer.from(hash, "base64").toString("hex") 
        return TONVIEWER_TRANSACTION_URL + hexHash
    }, [hash])

    const onTxIdPress = useCallback(() => {
        if (!tonhubLink) {
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
            message: (txId?.slice(0, 6) + '...' + txId?.slice(-4)) || undefined,
            options,
            cancelButtonIndex,
        }, (selectedIndex?: number) => {
            switch (selectedIndex) {
                case 1:
                    openWithInApp(tonviewerLink);
                    break;
                case 2:
                    copyText(tonhubLink);
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
                        Share.share({ title: t('receive.share.title'), url: tonhubLink });
                    } else {
                        Share.share({ title: t('receive.share.title'), message: tonhubLink });
                    }
                    break;
                case cancelButtonIndex:
                // Canceled
                default:
                    break;
            }
        });
    }, [tonhubLink, tonviewerLink, txId]);

    useEffect(() => {
        let subscription: ScreenCapture.Subscription;
        if (Platform.OS === 'ios') {
            subscription = ScreenCapture.addScreenshotListener(() => {
                if (!tonhubLink) {
                    return;
                }
                Share.share({ title: t('txActions.share.transaction'), url: tonhubLink });
            });
        }
        return () => subscription?.remove();
    }, [tonhubLink]);

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
                    {txId.slice(0, 6) + '...' + txId.slice(txId.length - 4)}
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
TxInfo.displayName = 'TxInfo';