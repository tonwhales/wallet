import * as React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { fragment } from "../../fragment";
import { Theme } from '../../Theme';
import { decryptData } from '../../utils/secureStorage';
import { storage } from '../../utils/storage';
import Animated, { FadeIn, FadeOutDown } from 'react-native-reanimated';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RoundButton } from '../../components/RoundButton';
import LottieView from 'lottie-react-native';
import { ScrollView } from 'react-native-gesture-handler';

export const WalletBackupFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const [mnemonics, setMnemonics] = React.useState<string[] | null>(null);
    const onComplete = React.useCallback(() => {
        storage.set('ton-backup-completed', true);
        navigation.navigateAndReplaceAll('Home');
    }, []);
    React.useEffect(() => {
        (async () => {
            let plainText: Buffer;
            try {
                const cypherData = Buffer.from(storage.getString('ton-mnemonics')!, 'base64');
                plainText = await decryptData(cypherData);
            } catch (e) {
                navigation.goBack();
                return;
            }
            setMnemonics(plainText.toString().split(' '));
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

    let words1: any[] = [];
    let words2: any[] = [];
    for (let i = 0; i < 24; i++) {
        const component = (
            <View key={'mn-' + i} style={{ flexDirection: 'row', height: 26 }}>
                <Text style={{ textAlign: 'right', color: Theme.textSecondary, fontSize: 18, width: 48, marginRight: 3, fontWeight: '400' }}>{(i + 1) + '. '}</Text>
                <Text style={{ color: Theme.textColor, fontSize: 18, width: 120, fontWeight: '600' }}>{mnemonics[i]}</Text>
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
            style={{ alignItems: 'center', justifyContent: 'flex-start', flexGrow: 1 }}
            exiting={FadeIn}
            key={"content"}
        >
            <ScrollView style={{ flexGrow: 1, flexBasis: 0 }} contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }}>
                <LottieView
                    source={require('../../../assets/animations/paper.json')}
                    autoPlay={true}
                    loop={false}
                    style={{ width: 100, height: 100, marginBottom: 8 }}
                />
                <Text style={{ fontSize: 30, fontWeight: '700' }}>24 Secret Words</Text>
                <Text style={{ textAlign: 'center', marginHorizontal: 16, marginTop: 16, fontSize: 15 }}>Write down these 24 words in the correct order and store them in a secret place.</Text>
                <Text style={{ textAlign: 'center', marginHorizontal: 16, marginTop: 16, fontSize: 15 }}>Use these secret words to restore access to your wallet if you lose your passcode or device.</Text>
                <View style={{ flexDirection: 'row', alignSelf: 'center', marginVertical: 32 }}>
                    <View style={{ marginRight: 16 }}>
                        {words1}
                    </View>
                    <View>
                        {words2}
                    </View>
                </View>

                <View style={{ flexGrow: 1 }} />

            </ScrollView>
            <View style={{ height: 64, marginHorizontal: 32, marginBottom: safeArea.bottom, alignSelf: 'stretch' }}>
                <RoundButton title="Done" onPress={onComplete} />
            </View>
        </Animated.View>
    );
});