import * as React from 'react';
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { fragment } from '../../../fragment';
import { extractDomain } from '../../../engine/utils/extractDomain';
import { MixpanelEvent, trackEvent } from '../../../analytics/mixpanel';
import { useKeysAuth } from '../../../components/secure/AuthWalletKeys';
import { useAppData, useTheme } from '../../../engine/hooks';
import { useNetwork } from '../../../engine/hooks';
import { memo, useCallback, useEffect, useRef } from 'react';
import { useAddExtension } from '../../../engine/hooks';
import { useCreateDomainKeyIfNeeded } from '../../../engine/hooks';
import { DappAuthComponent } from './DappAuthComponent';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useParams } from '../../../utils/useParams';
import { SelectedAccount } from '../../../engine/types';

type SignStateLoaderParams = {
    url: string,
    title: string | null,
    image: { url: string, blurhash: string } | null,
    callback?: (result: boolean) => void,
}

const SignStateLoader = memo((props: SignStateLoaderParams) => {
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
    let success = useRef(false);
    const approve = useCallback(async (selectedAccount?: SelectedAccount) => {

        // Create Domain Key if Needed
        let domain = extractDomain(props.url);
        let created = await createDomainKeyIfNeeded(
            domain,
            authContext,
            undefined,
            {
                backgroundColor: theme.elevation,
                containerStyle: { paddingBottom: safeArea.bottom + 56 },
                selectedAccount
            },
        );

        if (!!props.callback) {
            navigation.goBack();
            props.callback(!!created);
            return;
        }

        if (!created) {
            return;
        }

        // Add extension
        addExtension(props.url, props.title, props.image);

        // Track installation
        success.current = true;

        // Navigate
        navigation.replace('App', { url: props.url });
    }, [useCreateDomainKeyIfNeeded]);

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
            single
        />
    )
});

export const InstallFragment = fragment(() => {
    const params = useParams<SignStateLoaderParams>();
    return (<SignStateLoader {...params} />);
});