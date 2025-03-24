import * as React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Item } from '../../components/Item';
import { fragment } from '../../fragment';
import { getApplicationKey, getBiometricsState, getPasscodeState, loadKeyStorageRef, loadKeyStorageType } from '../../storage/secureStorage';
import { ItemButton } from '../../components/ItemButton';
import { ScrollView } from 'react-native-gesture-handler';
import { ItemGroup } from '../../components/ItemGroup';
import { useLocalStorageStatus, useTheme } from '../../engine/hooks';
import { useNetwork } from '../../engine/hooks';
import { Typography } from '../../components/styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { copyText } from '../../utils/copyText';
import { ToastDuration, useToaster } from '../../components/toast/ToastProvider';
import { t } from '../../i18n/t';
function loadStorageState() {
    const biometricsState = getBiometricsState();
    const passcodeState = getPasscodeState();
    return {
        biometricsState,
        passcodeState,
    }
}

export const DevStorageFragment = fragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const [localStorageStatus] = useLocalStorageStatus();
    const insets = useSafeAreaInsets();
    const toaster = useToaster();

    let [value, setValue] = React.useState('');

    const initialState = loadStorageState();
    const [keysStorageState, setKeysStorageState] = React.useState(initialState);

    React.useEffect(() => {
        (async () => {
            try {
                await getApplicationKey();
                setValue('ok');
            } catch (e) {
                console.warn(e);
                setValue('error');
            }
        })();
    }, []);
    let ref = loadKeyStorageRef();
    let kind = loadKeyStorageType();

    const onCopy = () => {
        copyText(localStorageStatus.keys.join('\n '));
        toaster.show(
            {
                message: t('common.copied'),
                type: 'default',
                duration: ToastDuration.SHORT,
            }
        );
    }

    return (
        <ScrollView style={{ flexGrow: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom }}>
            <View style={{ backgroundColor: theme.backgroundPrimary, flexGrow: 1, paddingHorizontal: 16 }}>
                <ItemGroup style={{
                    marginBottom: 16, marginTop: 16,
                    backgroundColor: theme.surfaceOnBg,
                    borderRadius: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <Item title={"Storage Kind"} hint={kind} />
                    </View>
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <Item title={"Storage Ref"} hint={ref} />
                    </View>
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <Item title={"Storage Key"} hint={value} />
                    </View>

                </ItemGroup>

                <ItemGroup style={{
                    marginBottom: 16,
                    backgroundColor: theme.surfaceOnBg,
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexShrink: 1,
                }}>
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <Item title={"Biometrics state"} hint={keysStorageState.biometricsState ?? 'Not set'} />
                    </View>
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <Item title={"Passcode state"} hint={keysStorageState.passcodeState ?? 'Not set'} />
                    </View>

                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <ItemButton
                            leftIcon={require('../../../assets/ic_backup.png')}
                            title={"Check keys storage status again"}
                            onPress={() => {
                                const stored = loadStorageState();
                                setKeysStorageState(stored);
                            }}
                        />
                    </View>
                </ItemGroup>
                <View style={{ marginHorizontal: 16, marginBottom: 16, width: '100%' }}>
                    <Text style={Typography.semiBold15_20}>Web View Local Storage</Text>
                </View>
                <ItemGroup style={{
                    marginBottom: 16,
                    backgroundColor: theme.surfaceOnBg,
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexShrink: 1,
                }}>

                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <Item title={"LocalStorage available"} hint={localStorageStatus.isAvailable ? 'Yes' : 'No'} />
                    </View>
                    <View style={{ marginHorizontal: 16, width: '100%' }}>
                        <Item title={"LocalStorage size"} hint={localStorageStatus.totalSizeBytes?.toString() ?? 'Not set'} />
                    </View>
                    <TouchableOpacity onPress={onCopy} style={{ marginHorizontal: 16, width: '100%' }}>
                        <Text style={{ marginHorizontal: 16, fontSize: 10, color: theme.textSecondary }}>
                            {localStorageStatus.error}
                            {localStorageStatus.keys.join('\n ')}
                        </Text>
                    </TouchableOpacity>
                </ItemGroup>
            </View>
        </ScrollView>
    );
});