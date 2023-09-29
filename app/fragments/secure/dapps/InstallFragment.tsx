import * as React from 'react';
import { useRoute } from "@react-navigation/native";
import { StyleProp, TextStyle } from "react-native";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { fragment } from '../../../fragment';
import { useEngine } from '../../../engine/Engine';
import { extractDomain } from '../../../engine/utils/extractDomain';
import { MixpanelEvent, trackEvent } from '../../../analytics/mixpanel';
import { useAppConfig } from '../../../utils/AppConfigContext';
import { useKeysAuth } from '../../../components/secure/AuthWalletKeys';
import { memo, useCallback, useEffect, useRef } from 'react';
import { DappAuthComponent } from './DappAuthComponent';

const labelStyle: StyleProp<TextStyle> = {
    fontWeight: '600',
    marginLeft: 17,
    fontSize: 17
};

const SignStateLoader = memo((props: { url: string, title: string | null, image: { url: string, blurhash: string } | null }) => {
    const authContext = useKeysAuth();
    const { AppConfig } = useAppConfig();
    const navigation = useTypedNavigation();
    const engine = useEngine();

    // App Data
    let appData = engine.products.extensions.useAppData(props.url);

    // Approve
    let active = useRef(true);
    let success = useRef(false);
    useEffect(() => {
        return () => { active.current = false; };
    }, []);
    const approve = useCallback(async () => {

        // Create Domain Key if Needed
        let domain = extractDomain(props.url);
        let created = await engine.products.keys.createDomainKeyIfNeeded(domain, authContext);
        if (!created) {
            return;
        }

        // Add extension
        engine.products.extensions.addExtension(props.url, props.title, props.image);

        // Track installation
        success.current = true;
        trackEvent(MixpanelEvent.AppInstall, { url: props.url, domain: domain }, AppConfig.isTestnet);

        // Navigate
        navigation.goBack();
        navigation.navigate('App', { url: props.url });
    }, []);
    useEffect(() => {
        if (!success.current) {
            let domain = extractDomain(props.url);
            trackEvent(MixpanelEvent.AppInstallCancel, { url: props.url, domain: domain }, AppConfig.isTestnet);
        }
    }, []);

    return (
        <DappAuthComponent
            state={{
                type: 'initing',
                connector: 'ton-x',
                name: props.title || '', 
                url: props.url, 
                app: appData
            }}
            onApprove={approve}
            onCancel={navigation.goBack}
        />
    )
});

export const InstallFragment = fragment(() => {
    const params: { url: string, title: string | null, image: { url: string, blurhash: string } | null } = useRoute().params as any;
    return (
        <SignStateLoader url={params.url} image={params.image} title={params.title} />
    );
});