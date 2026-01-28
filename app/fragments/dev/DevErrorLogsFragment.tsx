import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ItemButton } from '../../components/ItemButton';
import { ItemGroup } from '../../components/ItemGroup';
import { RoundButton } from '../../components/RoundButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Typography } from '../../components/styles';
import { ToastDuration, useToaster } from '../../components/toast/ToastProvider';
import { sendErrorLog } from '../../engine/api/sendErrorLog';
import { useTheme } from '../../engine/hooks';
import { fragment } from '../../fragment';
import {
    clearAllErrorLogs,
    deleteErrorLog,
    type ErrorLogEntry,
    getErrorLogs
} from '../../storage';
import { useTypedNavigation } from '../../utils/useTypedNavigation';

const SEND_INTERVAL_MS = 50;

export const DevErrorLogsFragment = fragment(() => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const insets = useSafeAreaInsets();
    const toaster = useToaster();

    const [errorLogs, setErrorLogs] = useState<ErrorLogEntry[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [sendProgress, setSendProgress] = useState({ sent: 0, total: 0 });
    const isUnmountedRef = useRef(false);

    const refreshLogs = useCallback(() => {
        setErrorLogs(getErrorLogs());
    }, []);

    useEffect(() => {
        refreshLogs();
        return () => {
            isUnmountedRef.current = true;
        };
    }, [refreshLogs]);

    const handleSendAll = useCallback(async () => {
        const logs = getErrorLogs();
        if (logs.length === 0) {
            toaster.show({
                message: 'No errors to send',
                type: 'default',
                duration: ToastDuration.SHORT
            });
            return;
        }

        setIsSending(true);
        setSendProgress({ sent: 0, total: logs.length });

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < logs.length; i++) {
            if (isUnmountedRef.current) {
                break;
            }

            const log = logs[i];
            const success = await sendErrorLog(log);

            if (success) {
                deleteErrorLog(log.id);
                successCount++;
            } else {
                failCount++;
            }

            setSendProgress({ sent: i + 1, total: logs.length });

            // Wait before sending next
            if (i < logs.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, SEND_INTERVAL_MS));
            }
        }

        if (isUnmountedRef.current) {
            return;
        }

        setIsSending(false);
        refreshLogs();

        toaster.show({
            message: `Sent: ${successCount}, Failed: ${failCount}`,
            type: failCount > 0 ? 'error' : 'default',
            duration: ToastDuration.SHORT
        });
    }, [refreshLogs, toaster]);

    const handleClearAll = useCallback(() => {
        Alert.alert('Clear All Errors', 'Are you sure you want to delete all stored errors?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Clear All',
                style: 'destructive',
                onPress: () => {
                    clearAllErrorLogs();
                    refreshLogs();
                    toaster.show({
                        message: 'All errors cleared',
                        type: 'default',
                        duration: ToastDuration.SHORT
                    });
                }
            }
        ]);
    }, [refreshLogs, toaster]);

    return (
        <View style={{ flexGrow: 1, paddingTop: insets.top }}>
            <ScreenHeader
                style={{ paddingHorizontal: 16 }}
                onBackPressed={navigation.goBack}
                title="Error Logs"
            />
            <ScrollView
                style={{ flexGrow: 1, paddingHorizontal: 16 }}
                contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
            >
                <ItemGroup
                    style={{
                        marginTop: 16,
                        backgroundColor: theme.surfaceOnBg,
                        borderRadius: 16,
                        padding: 16
                    }}
                >
                    <View style={{ alignItems: 'center', gap: 8 }}>
                        <Text style={[Typography.semiBold32_38, { color: theme.textPrimary }]}>
                            {errorLogs.length}
                        </Text>
                        <Text style={[Typography.regular15_20, { color: theme.textSecondary }]}>
                            Stored Errors
                        </Text>
                    </View>
                </ItemGroup>

                <View style={{ marginTop: 16, gap: 12 }}>
                    <RoundButton
                        title={
                            isSending
                                ? `Sending... (${sendProgress.sent}/${sendProgress.total})`
                                : 'Send All Errors'
                        }
                        disabled={isSending || errorLogs.length === 0}
                        action={handleSendAll}
                    />
                    <RoundButton
                        title="Clear All Errors"
                        display="secondary"
                        disabled={isSending || errorLogs.length === 0}
                        onPress={handleClearAll}
                    />
                </View>

                <ItemGroup
                    style={{
                        marginTop: 16,
                        backgroundColor: theme.surfaceOnBg,
                        borderRadius: 16
                    }}
                >
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <ItemButton title="Refresh" onPress={refreshLogs} />
                    </View>
                </ItemGroup>

                {errorLogs.length > 0 && (
                    <ItemGroup
                        style={{
                            marginTop: 16,
                            backgroundColor: theme.surfaceOnBg,
                            borderRadius: 16,
                            padding: 16
                        }}
                    >
                        <Text
                            style={[
                                Typography.semiBold15_20,
                                { color: theme.textPrimary, marginBottom: 12 }
                            ]}
                        >
                            Recent Errors
                        </Text>
                        {errorLogs.slice(-5).reverse().map((log) => (
                            <View
                                key={log.id}
                                style={{
                                    backgroundColor: theme.backgroundPrimary,
                                    borderRadius: 12,
                                    padding: 12,
                                    marginBottom: 8
                                }}
                            >
                                <Text
                                    style={[Typography.regular13_18, { color: theme.textSecondary }]}
                                    numberOfLines={1}
                                >
                                    {new Date(log.timestamp).toLocaleString()}
                                </Text>
                                <Text
                                    style={[Typography.regular15_20, { color: theme.textPrimary }]}
                                    numberOfLines={2}
                                >
                                    {log.message}
                                </Text>
                            </View>
                        ))}
                    </ItemGroup>
                )}
            </ScrollView>
        </View>
    );
});

