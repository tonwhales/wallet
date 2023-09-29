import * as React from 'react';
import { useRoute } from "@react-navigation/native";
import { Platform } from "react-native";
import { t } from "../../../i18n/t";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { backoff } from '../../../utils/time';
import axios from 'axios';
import { addConnectionReference, addPendingGrant, getAppInstanceKeyPair, getCurrentAddress, removePendingGrant } from '../../../storage/appState';
import { contractFromPublicKey } from '../../../engine/contractFromPublicKey';
import { beginCell, Cell, safeSign } from 'ton';
import { WalletKeys } from '../../../storage/walletKeys';
import { fragment } from '../../../fragment';
import { warn } from '../../../utils/log';
import { AppData } from '../../../engine/api/fetchAppData';
import { useEngine } from '../../../engine/Engine';
import { MixpanelEvent, trackEvent } from '../../../analytics/mixpanel';
import { extractDomain } from '../../../engine/utils/extractDomain';
import Url from 'url-parse';
import isValid from 'is-valid-domain';
import { connectAnswer } from '../../../engine/api/connectAnswer';
import { useAppConfig } from '../../../utils/AppConfigContext';
import { useKeysAuth } from '../../../components/secure/AuthWalletKeys';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { DappAuthComponent } from './DappAuthComponent';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

type SignState = { type: 'loading' }
    | { type: 'expired' }
    | { type: 'initing', name: string, url: string, app?: AppData | null }
    | { type: 'completed' }
    | { type: 'authorized' }
    | { type: 'failed' }

const SignStateLoader = memo((props: { session: string, endpoint: string }) => {
    const { AppConfig } = useAppConfig();
    const authContext = useKeysAuth();
    const navigation = useTypedNavigation();
    const engine = useEngine();

    const [state, setState] = useState<SignState>({ type: 'loading' });
    const [addExtension, setAddExtension] = useState(false);

    useEffect(() => {
        let ended = false;
        backoff('authenticate', async () => {
            if (ended) {
                return;
            }
            let currentState = await axios.get('https://' + props.endpoint + '/connect/' + props.session);
            if (ended) {
                return;
            }
            if (currentState.data.state === 'not_found') {
                setState({ type: 'expired' });
                return;
            }
            if (currentState.data.state === 'initing') {
                const appData = await engine.products.extensions.getAppData(currentState.data.url);
                if (appData) {
                    setState({ type: 'initing', name: currentState.data.name, url: currentState.data.url, app: appData });
                    return;
                }
                setState({ type: 'failed' });
                return;
            }
            if (currentState.data.state === 'ready') {
                setState({ type: 'completed' });
                return;
            }
            setState({ type: 'expired' });
        });
        return () => {
            ended = true;
        };
    }, []);

    // Approve
    const acc = useMemo(() => getCurrentAddress(), []);
    let active = useRef(true);
    useEffect(() => {
        return () => { active.current = false; };
    }, []);
    const approve = useCallback(async () => {

        if (state.type !== 'initing') {
            return;
        }

        // Load data
        const contract = contractFromPublicKey(acc.publicKey);
        let walletConfig = contract.source.backup();
        let walletType = contract.source.type;
        let address = contract.address.toFriendly({ testOnly: AppConfig.isTestnet });
        let appInstanceKeyPair = await getAppInstanceKeyPair();
        let endpoint = 'https://connect.tonhubapi.com/connect/command';
        let name = state.name;
        let url = state.url;
        let title = state.app ? state.app.title : name;
        let image = state.app?.image ? {
            blurhash: state.app.image.blurhash,
            url: state.app.image.preview256
        } : null;

        // Sign
        let walletKeys: WalletKeys;
        try {
            walletKeys = await authContext.authenticate({ cancelable: true });
        } catch (e) {
            warn('Failed to load wallet keys');
            return;
        }
        let toSign = beginCell()
            .storeCoins(0)
            .storeBuffer(Buffer.from(props.session, 'base64'))
            .storeAddress(contract.address)
            .storeRefMaybe(beginCell()
                .storeBuffer(Buffer.from(endpoint))
                .endCell())
            .storeRef(beginCell()
                .storeBuffer(appInstanceKeyPair.publicKey)
                .endCell())
            .endCell();
        let signature = safeSign(toSign, walletKeys.keyPair.secretKey);

        // Notify
        await backoff('authenticate', async () => {
            if (!active.current) {
                return;
            }

            // Apply answer
            await connectAnswer({
                reportEndpoint: props.endpoint,
                key: props.session,
                appPublicKey: appInstanceKeyPair.publicKey.toString('base64'),
                address: address,
                walletType,
                walletConfig,
                walletSig: signature.toString('base64'),
                endpoint,
                kind: 'ton-x',
                testnet: AppConfig.isTestnet
            });

            // Persist reference
            addConnectionReference(props.session, name, url, Date.now());
            addPendingGrant(props.session);

            // Grant access
            await backoff('authenticate', async () => {
                await axios.post('https://connect.tonhubapi.com/connect/grant', { key: props.session }, { timeout: 5000 });
                removePendingGrant(props.session);
            });

            // Track
            trackEvent(MixpanelEvent.Connect, { url, name }, AppConfig.isTestnet);

            // Exit if already exited screen
            if (!active.current) {
                return;
            }

            setState({ type: 'authorized' });
            navigation.goBack();
        });

        // Add extension if AppData has extension field
        // and option is checked
        if (addExtension && state.app?.extension) {
            // Read cell from extension field
            let slice = Cell.fromBoc(Buffer.from(state.app?.extension, 'base64'))[0].beginParse();
            let endpoint = slice.readRef().readRemainingBytes().toString();
            let extras = slice.readBit();
            let customTitle: string | null = null;
            let customImage: { url: string, blurhash: string } | null = null;
            if (!extras) {
                if (slice.remaining !== 0 || slice.remainingRefs !== 0) {
                    warn('Invalid endpoint');
                    return;
                }
            } else {
                // Read custom title
                if (slice.readBit()) {
                    customTitle = slice.readRef().readRemainingBytes().toString()
                    if (customTitle.trim().length === 0) {
                        customTitle = null;
                    }
                }
                // Read custom image
                if (slice.readBit()) {
                    let imageUrl = slice.readRef().readRemainingBytes().toString();
                    let imageBlurhash = slice.readRef().readRemainingBytes().toString();
                    new Url(imageUrl, true);
                    customImage = { url: imageUrl, blurhash: imageBlurhash };
                }

                // Future compatibility
                extras = slice.readBit();
                if (!extras) {
                    if (slice.remaining !== 0 || slice.remainingRefs !== 0) {
                        warn('Invalid endpoint');
                        return;
                    }
                }
            }

            // Validate endpoint
            let parsedEndpoint = new Url(endpoint, true);
            if (parsedEndpoint.protocol !== 'https:') {
                warn('Invalid endpoint');
                return;
            }
            if (!isValid(parsedEndpoint.hostname)) {
                warn('Invalid endpoint');
                return;
            }


            // Create domain key if needed
            let domain = extractDomain(endpoint);
            await engine.products.keys.createDomainKeyIfNeeded(domain, authContext, walletKeys); // Always succeeds

            // Add extension
            engine.products.extensions.addExtension(
                endpoint,
                customTitle ? customTitle : title,
                customImage ? customImage : image
            );

            // Track installation
            trackEvent(MixpanelEvent.AppInstall, { url: endpoint, domain: domain }, AppConfig.isTestnet);

            // Navigate
            navigation.replace('App', { url });
        }
    }, [state, addExtension]);

    return (
        <DappAuthComponent
            state={{ ...state, connector: 'ton-x' }}
            onApprove={approve}
            onCancel={navigation.goBack}
            setAddExtension={setAddExtension}
            addExtension={addExtension}
        />
    )
});

export const AuthenticateFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const params: {
        session: string,
        endpoint: string | null
    } = useRoute().params as any;
    return (
        <>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <ScreenHeader title={t('auth.title')} onClosePressed={navigation.goBack} />
            <SignStateLoader session={params.session} endpoint={params.endpoint || 'connect.tonhubapi.com'} />
        </>
    );
});