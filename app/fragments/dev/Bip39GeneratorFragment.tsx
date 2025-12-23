import * as React from 'react';
import { Platform, Text, View, ScrollView, Alert, Pressable } from 'react-native';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RoundButton } from '../../components/RoundButton';
import { t } from '../../i18n/t';
import { fragment } from '../../fragment';
import { warn } from '../../utils/log';
import Clipboard from '@react-native-clipboard/clipboard';
import * as Haptics from 'expo-haptics';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useCallback, useState } from 'react';
import { useTheme } from '../../engine/hooks';
import { ToastDuration, useToaster } from '../../components/toast/ToastProvider';
import { StatusBar } from 'expo-status-bar';
import { mnemonicValidate } from '@ton/crypto';
import { ItemButton } from '../../components/ItemButton';
import { generateBip39Mnemonic, generateUniversalMnemonic, MnemonicLength } from '../../utils/bip39';

export const Bip39GeneratorFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const toaster = useToaster();

    const [mnemonic, setMnemonic] = useState<string[] | null>(null);
    const [isTonValid, setIsTonValid] = useState<boolean>(false);
    const [attempts, setAttempts] = useState<number>(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [wordCount, setWordCount] = useState<MnemonicLength>(24);

    const generateMnemonic = useCallback(async (universal: boolean) => {
        try {
            setIsGenerating(true);

            if (universal) {
                const result = await generateUniversalMnemonic(wordCount);
                setMnemonic(result.mnemonic);
                setIsTonValid(result.isTonValid);
                setAttempts(result.attempts);

                if (!result.isTonValid) {
                    Alert.alert(
                        'Warning',
                        `Could not find TON-compatible mnemonic after ${result.attempts} attempts. Generated BIP39-only mnemonic.`
                    );
                }
            } else {
                const words = await generateBip39Mnemonic(wordCount);
                setMnemonic(words);
                setIsTonValid(await mnemonicValidate(words));
                setAttempts(1);
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
            warn('Failed to generate mnemonic');
            Alert.alert(t('common.error'), t('errors.unknown'));
        } finally {
            setIsGenerating(false);
        }
    }, [wordCount]);

    const onCopy = useCallback(() => {
        if (!mnemonic) return;

        try {
            Clipboard.setString(mnemonic.join(' '));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toaster.show({
                message: t('common.copied'),
                type: 'default',
                duration: ToastDuration.SHORT,
                marginBottom: Platform.OS === 'ios' ? (safeArea.bottom === 0 ? 56 + 64 : safeArea.bottom + 64) : 16
            });
        } catch {
            warn('Failed to copy mnemonic');
            Alert.alert(t('common.error'), t('errors.unknown'));
        }
    }, [mnemonic, safeArea.bottom, toaster]);

    return (
        <View style={[{
            flexGrow: 1,
            backgroundColor: theme.backgroundPrimary,
        }, Platform.select({ android: { paddingTop: safeArea.top } })]}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: theme.style === 'dark' ? 'light' : 'dark',
            })} />
            <ScreenHeader
                title={'BIP39 Generator'}
                onBackPressed={navigation.goBack}
                style={{ paddingHorizontal: 16 }}
            />
            <ScrollView
                alwaysBounceVertical={false}
                showsVerticalScrollIndicator={false}
                style={{ flexGrow: 1, width: '100%', paddingHorizontal: 16 }}
                contentContainerStyle={{ paddingBottom: safeArea.bottom + 32 }}
            >
                <Text style={{
                    fontSize: 15, lineHeight: 20,
                    fontWeight: '400',
                    color: theme.textSecondary,
                    marginBottom: 16, marginTop: 8
                }}>
                    {'Generate BIP39-compatible mnemonic phrases. These can be imported into MetaMask and other standard wallets.'}
                </Text>

                <View style={{
                    backgroundColor: theme.surfaceOnElevation,
                    borderRadius: 14,
                    padding: 4,
                    marginBottom: 16
                }}>
                    <ItemButton
                        title={'Word Count'}
                        hint={`${wordCount} words`}
                        onPress={() => setWordCount(wordCount === 12 ? 24 : 12)}
                    />
                </View>

                <View style={{ gap: 12, marginBottom: 24 }}>
                    <RoundButton
                        title={'Generate BIP39 Only'}
                        loading={isGenerating}
                        onPress={() => generateMnemonic(false)}
                        display={'secondary'}
                    />
                    <RoundButton
                        title={'Generate Universal (TON + BIP39)'}
                        loading={isGenerating}
                        onPress={() => generateMnemonic(true)}
                    />
                </View>

                {mnemonic && (
                    <>
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                            <View style={{
                                backgroundColor: theme.accent,
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                borderRadius: 8,
                            }}>
                                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                                    {'BIP39 ✓'}
                                </Text>
                            </View>
                            <View style={{
                                backgroundColor: isTonValid ? theme.accent : theme.textSecondary,
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                borderRadius: 8,
                            }}>
                                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                                    {isTonValid ? 'TON ✓' : 'TON ✗'}
                                </Text>
                            </View>
                            {attempts > 1 && (
                                <View style={{
                                    backgroundColor: theme.surfaceOnElevation,
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    borderRadius: 8,
                                }}>
                                    <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '500' }}>
                                        {`${attempts} attempts`}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <Pressable onPress={onCopy}>
                            <View style={{
                                backgroundColor: theme.surfaceOnElevation,
                                borderRadius: 14,
                                padding: 16,
                            }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <View style={{ flex: 1 }}>
                                        {mnemonic.slice(0, mnemonic.length / 2).map((word, index) => (
                                            <View key={index} style={{ flexDirection: 'row', marginBottom: 6 }}>
                                                <Text style={{
                                                    fontSize: 14,
                                                    fontWeight: '500',
                                                    color: theme.textSecondary,
                                                    width: 24,
                                                    textAlign: 'right',
                                                    marginRight: 8
                                                }}>
                                                    {index + 1}
                                                </Text>
                                                <Text style={{
                                                    fontSize: 14,
                                                    fontWeight: '600',
                                                    color: theme.textPrimary,
                                                }}>
                                                    {word}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        {mnemonic.slice(mnemonic.length / 2).map((word, index) => (
                                            <View key={index} style={{ flexDirection: 'row', marginBottom: 6 }}>
                                                <Text style={{
                                                    fontSize: 14,
                                                    fontWeight: '500',
                                                    color: theme.textSecondary,
                                                    width: 24,
                                                    textAlign: 'right',
                                                    marginRight: 8
                                                }}>
                                                    {index + 1 + mnemonic.length / 2}
                                                </Text>
                                                <Text style={{
                                                    fontSize: 14,
                                                    fontWeight: '600',
                                                    color: theme.textPrimary,
                                                }}>
                                                    {word}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                                <Text style={{
                                    color: theme.accent,
                                    fontSize: 12,
                                    fontWeight: '500',
                                    marginTop: 12,
                                    textAlign: 'center'
                                }}>
                                    {'Tap to copy'}
                                </Text>
                            </View>
                        </Pressable>

                        <Text style={{
                            fontSize: 13, lineHeight: 18,
                            fontWeight: '400',
                            color: theme.textSecondary,
                            marginTop: 16,
                            textAlign: 'center'
                        }}>
                            {isTonValid
                                ? '✓ This mnemonic can be used for both TON and Ethereum wallets (MetaMask compatible)'
                                : '⚠️ This mnemonic is only BIP39 compatible. Use for Ethereum/MetaMask only.'
                            }
                        </Text>
                    </>
                )}
            </ScrollView>
        </View>
    );
});

