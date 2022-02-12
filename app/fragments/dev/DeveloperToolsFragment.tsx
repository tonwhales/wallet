import * as React from 'react';
import { t } from "i18next";
import { View } from "react-native";
import { ItemButton } from "../../components/ItemButton";
import { fragment } from "../../fragment";
import { Theme } from "../../Theme";
import { Item } from '../../components/Item';
import { AppConfig } from '../../AppConfig';
import { useReboot } from '../../utils/RebootContext';

export const DeveloperToolsFragment = fragment(() => {
    const reboot = useReboot();
    // const isTestNet = useTestnet();
    // const switchNetwork = React.useCallback(() => {
    //     let state = (getAppState())!;
    //     setAppState({ ...state, testnet: !state.testnet });
    //     reboot();
    // }, []);
    return (
        <View style={{ backgroundColor: Theme.background, flexGrow: 1, flexBasis: 0, paddingHorizontal: 16 }}>
            <View style={{
                marginBottom: 16, marginTop: 17,
                backgroundColor: "white",
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
                flexShrink: 1,
            }}>
                {/* <View style={{ marginHorizontal: 16, width: '100%' }}>
                    <ItemButton leftIcon={require('../../../assets/ic_sign_out.png')} dangerZone title={t(isTestNet ? 'Switch to mainnet' : 'Switch to testnet')} onPress={switchNetwork} />
                </View> */}
                <View style={{ marginHorizontal: 16, width: '100%' }}>
                    <ItemButton leftIcon={require('../../../assets/ic_sign_out.png')} dangerZone title={t("Restart app")} onPress={reboot} />
                </View>
                <View style={{ marginHorizontal: 16, width: '100%' }}>
                    <Item title={t("Version")} hint={AppConfig.isTestnet ? 'Testnet' : 'Mainnet'} />
                </View>
            </View>
        </View>
    );
});