import * as React from 'react';
import { useRoute } from "@react-navigation/native";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { getCurrentAddress } from '../../../storage/appState';
import { fragment } from '../../../fragment';
import { extractDomain } from '../../../engine/utils/extractDomain';
import { MixpanelEvent, trackEvent } from '../../../analytics/mixpanel';
import { useKeysAuth } from '../../../components/secure/AuthWalletKeys';
import { useAppData, useTheme } from '../../../engine/hooks';
import { useNetwork } from '../../../engine/hooks';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAddExtension } from '../../../engine/hooks';
import { useCreateDomainKeyIfNeeded } from '../../../engine/hooks';
import { DappAuthComponent } from './DappAuthComponent';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SignStateLoader = memo((props: { url: string, title: string | null, image: { url: string, blurhash: string } | null }) => {
    const authContext = useKeysAuth();
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const addExtension = useAddExtension();
    const createDomainKeyIfNeeded = useCreateDomainKeyIfNeeded();

    // App Data
    let appData = useAppData(props.url);

    // Approve
    const acc = useMemo(() => getCurrentAddress(), []);
    let active = useRef(true);
    let success = useRef(false);
    useEffect(() => {
        return () => { active.current = false; };
    }, []);
    const approve = useCallback(async () => {

        // Create Domain Key if Needed
        let domain = extractDomain(props.url);
        let created = await createDomainKeyIfNeeded(
            domain,
            authContext,
            undefined,
            {
                backgroundColor: theme.elevation,
                containerStyle: { paddingBottom: safeArea.bottom + 56 },
            },
        );
        if (!created) {
            return;
        }

        // Add extension
        addExtension(props.url, props.title, props.image);

        // Track installation
        success.current = true;
        trackEvent(MixpanelEvent.AppInstall, { url: props.url, domain: domain }, isTestnet);

        // Navigate
        navigation.replace('App', { url: props.url });
    }, []);
    useEffect(() => {
        if (!success.current) {
            let domain = extractDomain(props.url);
            trackEvent(MixpanelEvent.AppInstallCancel, { url: props.url, domain: domain }, isTestnet);
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
        <SignStateLoader
            url={params.url}
            image={params.image}
            title={params.title}
        />
    );
});