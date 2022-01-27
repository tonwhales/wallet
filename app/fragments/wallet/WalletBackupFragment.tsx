import * as React from 'react';
import { ActivityIndicator, Platform, Text, View, useWindowDimensions } from 'react-native';
import { fragment } from "../../fragment";
import { Theme } from '../../Theme';
import { storage } from '../../storage/storage';
import Animated, { FadeIn, FadeOutDown } from 'react-native-reanimated';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RoundButton } from '../../components/RoundButton';
import LottieView from 'lottie-react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { loadWalletKeys } from '../../storage/walletKeys';
import { useTranslation } from 'react-i18next';
import { AndroidToolbar } from '../../components/AndroidToolbar';
import { getAppState, setAppState } from '../../storage/appState';

export const WalletBackupFragment = fragment(() => {
    const { t } = useTranslation();
    const safeArea = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const navigation = useTypedNavigation();
    const [mnemonics, setMnemonics] = React.useState<string[] | null>(null);
    const onComplete = React.useCallback(() => {
        let state = getAppState();
        if (!state) {
            throw Error('Invalid state');
        }
        setAppState({ ...state, backupCompleted: true });
        navigation.navigateAndReplaceAll('Home');
    }, []);
    React.useEffect(() => {
        (async () => {
            try {
                let keys = await loadWalletKeys();
                setMnemonics(keys.mnemonics);
            } catch (e) {
                navigation.goBack();
                return;
            }
        })();
    }, []);
    if (!mnemonics) {
        return (
            <Animated.View
                style={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}
                exiting={FadeOutDown}
                key={"loader"}
            >
                <ActivityIndicator color={Theme.loader} />
            </Animated.View>
        )
    }

    console.log('height', height);

    let words1: any[] = [];
    let words2: any[] = [];
    for (let i = 0; i < 24; i++) {
        const component = (
            <View key={'mn-' + i} style={{ flexDirection: 'row', height: 26, marginBottom: height < 800 ? 6 : 12 }}>
                <Text style={{ textAlign: 'right', color: Theme.textSecondary, fontSize: 16, width: 24, marginRight: 24, fontWeight: '400' }}>{(i + 1) + '. '}</Text>
                <Text style={{ color: Theme.textColor, fontSize: 16, fontWeight: '400' }}>{mnemonics[i]}</Text>
            </View>
        );
        if (i < 12) {
            words1.push(component);
        } else {
            words2.push(component);
        }
    }

    return (
        <Animated.View
            style={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1, backgroundColor: 'white', paddingTop: Platform.OS === 'android' ? safeArea.top : undefined, }}
            exiting={FadeIn}
            key={"content"}
        >
            <AndroidToolbar />
            <View style={{ flexGrow: 1 }} />
            <Text style={{ fontSize: 26, fontWeight: '800', textAlign: 'center' }}>{t("Your recovery phrase")}</Text>
            <Text style={{ textAlign: 'center', marginHorizontal: 16, marginTop: height < 800 ? 6 : 16, fontSize: 16, color: '#6D6D71' }}>
                {t("Write down these 24 words in the correct order and store them in a secret place. Use these secret words to restore access to your wallet if you lose your passcode or device.")}
            </Text>
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginHorizontal: 16,
                marginTop: 16,
                alignSelf: 'stretch'
            }}>
                <View>
                    {words1}
                </View>
                <View>
                    {words2}
                </View>
            </View>
            <View style={{ flexGrow: 1 }} />
            <View style={{ height: 64, marginHorizontal: 16, marginBottom: safeArea.bottom, alignSelf: 'stretch' }}>
                <RoundButton title={t("Done")} onPress={onComplete} />
            </View>
        </Animated.View>
    );
});