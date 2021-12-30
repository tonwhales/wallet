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

    return (
        <Animated.View
            style={{ alignItems: 'stretch', justifyContent: 'flex-start', flexGrow: 1 }}
            exiting={FadeIn}
            key={"content"}
        >

            {mnemonics.map((v, i) => (
                <View>
                    <Text key={'mn-' + i}>{v}</Text>
                </View>
            ))}

            <View style={{ flexGrow: 1 }} />
            <View style={{ height: 64, marginHorizontal: 64, marginBottom: safeArea.bottom, alignSelf: 'stretch' }}>
                <RoundButton title="Complete" onPress={onComplete} />
            </View>

        </Animated.View>
    );
});