import * as React from 'react';
import { ActivityIndicator, Platform, Text, View, useWindowDimensions } from 'react-native';
import { fragment } from "../../fragment";
import { Theme } from '../../Theme';
import Animated, { FadeIn, FadeOutDown } from 'react-native-reanimated';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RoundButton } from '../../components/RoundButton';
import { loadWalletKeys } from '../../storage/walletKeys';
import { useTranslation } from 'react-i18next';
import { AndroidToolbar } from '../../components/AndroidToolbar';
import { getAppState, getCurrentAddress, markAddressSecured } from '../../storage/appState';
import { useRoute } from '@react-navigation/native';

export const WalletBackupFragment = fragment(() => {
    const { t } = useTranslation();
    const safeArea = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const props: { dark?: boolean } | undefined = useRoute().params;
    const navigation = useTypedNavigation();
    const [mnemonics, setMnemonics] = React.useState<string[] | null>(null);
    const address = React.useMemo(() => getCurrentAddress(), []);
    const onComplete = React.useCallback(() => {
        let state = getAppState();
        if (!state) {
            throw Error('Invalid state');
        }
        markAddressSecured(address.address);
        navigation.navigateAndReplaceAll('Home');
    }, []);

    React.useEffect(() => {
        (async () => {
            try {
                let keys = await loadWalletKeys(address.secretKeyEnc);
                setMnemonics(keys.mnemonics);
            } catch (e) {
                navigation.goBack();
                return;
            }
        })();
    }, []);

    React.useLayoutEffect(() => {
        if (props?.dark) {
            navigation.setOptions({ headerStyle: { backgroundColor: 'white' } });
        } else {
            navigation.setOptions({ headerStyle: { backgroundColor: Theme.background } });
        }
    }, [navigation, props]);

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

    let words1: any[] = [];
    let words2: any[] = [];
    for (let i = 0; i < 24; i++) {
        const component = (
            <View key={'mn-' + i} style={{ flexDirection: 'row', marginBottom: i === 11 || i === 23 ? undefined : height > 800 ? 19 : 12 }}>
                <Text style={{ textAlign: 'right', color: Theme.textSecondary, fontSize: 16, minWidth: 24, marginRight: 20, fontWeight: '400' }}>{(i + 1) + '. '}</Text>
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
            style={{
                alignItems: 'center',
                justifyContent: 'center',
                flexGrow: 1,
                backgroundColor: props?.dark ? 'white' : Theme.background,
                paddingTop: Platform.OS === 'android' ? safeArea.top : undefined
            }}
            exiting={FadeIn}
            key={"content"}
        >
            <AndroidToolbar />
            <Text style={{ fontSize: 26, fontWeight: '800', textAlign: 'center', marginTop: 9 }}>{t("Your recovery phrase")}</Text>
            <Text style={{ textAlign: 'center', marginHorizontal: 16, marginTop: 11, fontSize: 16, color: '#6D6D71' }}>
                {t("Write down these 24 words in the order given below and store them in a secret, safe place.")}
            </Text>
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginHorizontal: 16,
                marginTop: height < 800 ? 12 : height * 0.04,
                alignSelf: 'stretch',
                padding: 24,
                borderRadius: 14,
                backgroundColor: props?.dark ? Theme.background : 'white'
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