import * as React from 'react';
import { useRoute } from "@react-navigation/native";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { backoff } from '../../../utils/time';
import axios from 'axios';
import { addConnectionReference, addPendingGrant, getAppInstanceKeyPair, getCurrentAddress, removePendingGrant } from '../../../storage/appState';
import { contractFromPublicKey, walletConfigFromContract } from '../../../engine/contractFromPublicKey';
import { beginCell, Cell, safeSign } from '@ton/core';
import { WalletKeys } from '../../../storage/walletKeys';
import { fragment } from '../../../fragment';
import { warn } from '../../../utils/log';
import { AppData } from '../../../engine/api/fetchAppData';
import { MixpanelEvent, trackEvent } from '../../../analytics/mixpanel';
import { extractDomain } from '../../../engine/utils/extractDomain';
import Url from 'url-parse';
import isValid from 'is-valid-domain';
import { connectAnswer } from '../../../engine/api/connectAnswer';
import { useKeysAuth } from '../../../components/secure/AuthWalletKeys';
import { useNetwork, useTheme } from '../../../engine/hooks';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCreateDomainKeyIfNeeded } from '../../../engine/hooks';
import { useAddExtension } from '../../../engine/hooks';
import { getAppData } from '../../../engine/getters/getAppData';
import { DappAuthComponent } from './DappAuthComponent';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SignState = { type: 'loading' }
    | { type: 'expired' }
    | { type: 'initing', name: string, url: string, app?: AppData | null }
    | { type: 'completed' }
    | { type: 'authorized' }
    | { type: 'failed' }

const SignStateLoader = memo((props: { session: string, endpoint: string }) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const safeArea = useSafeAreaInsets();
    const authContext = useKeysAuth();
    const navigation = useTypedNavigation();
    const [state, setState] = useState<SignState>({ type: 'loading' });
    const [addExt, setAddExt] = useState(false);
    const addExtension = useAddExtension();
    const createDomainKeyIfNeeded = useCreateDomainKeyIfNeeded();

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
                const appData = await getAppData(currentState.data.url);
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
        const config = walletConfigFromContract(contract);

        const walletConfig = config.walletConfig;
        const walletType = config.type;

        let address = contract.address.toString({ testOnly: isTestnet });
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
            walletKeys = await authContext.authenticate({
                cancelable: true,
                backgroundColor: theme.elevation,
                containerStyle: { paddingBottom: safeArea.bottom + 56 },
            });
        } catch (e) {
            warn('Failed to load wallet keys');
            return;
        }
        let toSign = beginCell()
            .storeCoins(0)
            .storeBuffer(Buffer.from(props.session, 'base64'))
            .storeAddress(contract.address)
            .storeMaybeRef(beginCell()
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
                testnet: isTestnet
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
            trackEvent(MixpanelEvent.Connect, { url, name }, isTestnet);

            // Exit if already exited screen
            if (!active.current) {
                return;
            }
        });

        // Add extension if AppData has extension field
        // and option is checked
        if (addExt && state.app?.extension) {
            // Read cell from extension field
            let slice = Cell.fromBoc(Buffer.from(state.app?.extension, 'base64'))[0].beginParse();
            let endpoint = slice.loadRef().toString();
            let extras = slice.loadBit();
            let customTitle: string | null = null;
            let customImage: { url: string, blurhash: string } | null = null;
            if (!extras) {
                if (slice.remainingBits !== 0 || slice.remainingRefs !== 0) {
                    warn('Invalid endpoint');
                    return;
                }
            } else {
                // Read custom title
                if (slice.loadBit()) {
                    customTitle = slice.loadRef().toString()
                    if (customTitle.trim().length === 0) {
                        customTitle = null;
                    }
                }
                // Read custom image
                if (slice.loadBit()) {
                    let imageUrl = slice.loadRef().toString();
                    let imageBlurhash = slice.loadRef().toString();
                    new Url(imageUrl, true);
                    customImage = { url: imageUrl, blurhash: imageBlurhash };
                }

                // Future compatibility
                extras = slice.loadBit();
                if (!extras) {
                    if (slice.remainingBits !== 0 || slice.remainingRefs !== 0) {
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
            await createDomainKeyIfNeeded(domain, authContext, walletKeys);

            // Add extension
            addExtension(
                endpoint,
                customTitle ? customTitle : title,
                customImage ? customImage : image
            );

            // Track installation
            trackEvent(MixpanelEvent.AppInstall, { url: endpoint, domain: domain }, isTestnet);

            // Navigate
            navigation.replace('App', { url });
        } else {
            navigation.goBack();
        }
    }, [state, addExt, useCreateDomainKeyIfNeeded]);


    return (
        <DappAuthComponent
            state={{ ...state, connector: 'ton-x' }}
            onApprove={approve}
            onCancel={navigation.goBack}
            setAddExtension={state.type === 'initing' && state.app?.extension ? setAddExt : undefined}
            addExtension={state.type === 'initing' && state.app?.extension ? addExt : undefined}
        />
    )
});

export const AuthenticateFragment = fragment(() => {
    const params: {
        session: string,
        endpoint: string | null
    } = useRoute().params as any;

    return (
        <SignStateLoader
            session={params.session}
            endpoint={params.endpoint || 'connect.tonhubapi.com'}
        />
    );
});