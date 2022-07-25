import * as React from 'react';
import { fragment } from '../../fragment';
import { Platform, Share, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { AppComponent } from './components/AppComponent';
import Color from 'color';
import { useRoute } from '@react-navigation/native';
import { extractDomain } from '../../engine/utils/extractDomain';
import { useEngine } from '../../engine/Engine';
import { RoundButton } from '../../components/RoundButton';
import { t } from '../../i18n/t';
import MoreIcon from '../../../assets/ic_more.svg';
import { MenuView } from '@react-native-menu/menu';
import { generateAppLink } from '../../utils/generateAppLink';
import { MixpanelEvent, trackEvent, useTrackEvent } from '../../analytics/mixpanel';

export const AppFragment = fragment(() => {
    const engine = useEngine();
    const url = (useRoute().params as any).url as string;
    const domain = extractDomain(url);
    const appData = engine.products.extensions.useAppData(url);
    const safeArea = useSafeAreaInsets();
    // const navigation = useTypedNavigation();
    const color = appData && appData.color ? appData.color : '#fff';
    const c = Color(color);
    const dark = c.isDark();
    const fontColor = dark ? '#fff' : '#000';
    const key = engine.persistence.domainKeys.getValue(domain);
    // const start = React.useMemo(() => {
    //     return Date.now();
    // }, []);
    // const close = React.useCallback(() => {
    //     navigation.goBack();
    //     trackEvent(MixpanelEvent.AppClose, { url, domain, duration: Date.now() - start });
    // }, []);
    // useTrackEvent(MixpanelEvent.AppOpen, { url, domain });

    if (!appData) {
        throw Error('No App Data');
    }
    if (!key) {
        throw Error('No Domain Key');
    }

    // const onShare = React.useCallback(
    //     () => {
    //         const link = generateAppLink(url, appData.title);
    //         if (Platform.OS === 'ios') {
    //             Share.share({ title: t('receive.share.title'), url: link });
    //         } else {
    //             Share.share({ title: t('receive.share.title'), message: link });
    //         }
    //     },
    //     [appData],
    // );

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            backgroundColor: color
        }}>
            <StatusBar style={dark ? 'light' : 'dark'} />

            <AppComponent
                endpoint={url}
                color={color}
                dark={dark}
                foreground={fontColor}
                title={appData.title}
                domainKey={key}
            />

            {/* <View style={{ flexDirection: 'row', height: 50 + safeArea.bottom, alignItems: 'center', justifyContent: 'center', paddingBottom: safeArea.bottom }}>
                <RoundButton
                    title={t('common.close')}
                    display="secondary"
                    size="normal"
                    style={{ paddingHorizontal: 8 }}
                    onPress={close}
                />
                <MenuView
                    style={{
                        position: 'absolute',
                        top: 8, right: 16,
                        height: 32
                    }}
                    onPressAction={({ nativeEvent }) => {
                        if (nativeEvent.event === 'share') onShare();
                    }}
                    actions={[
                        { title: t('common.share'), id: 'share', image: Platform.OS === 'ios' ? 'square.and.arrow.up' : undefined },
                    ]}
                >
                    <MoreIcon color={'black'} height={30} width={30} />
                </MenuView>
            </View> */}
        </View>
    );
});