import Intercom, { type Article, ContentType, IntercomEvents, Space } from '@intercom/intercom-react-native';
import { Address } from '@ton/core';
import { useCallback, useEffect, useState } from 'react';
import { useIsLedgerRoute, useNetwork, useSupportAuthState } from '..';
import { MixpanelEvent, trackEvent } from '../../../analytics/mixpanel';
import { useToaster } from '../../../components/toast/ToastProvider';
import { t } from '../../../i18n/t';
import { getLedgerSelected } from '../../../storage/appState';
import { useSelectedAccount } from '../appstate';
import { useIntercomLoginRetry } from './useSupportAuth';

export const useSupport = () => {
	const network = useNetwork();
	const isLedger = useIsLedgerRoute();
	const selected = useSelectedAccount();
	const ledgerSelected = getLedgerSelected();
	const _address = isLedger && ledgerSelected ? Address.parse(ledgerSelected) : selected?.address;
	const address = _address?.toString({ testOnly: network.isTestnet });
	const [notifications, setNotifications] = useState(0);
	const isLoggedIn = useSupportAuthState();
	const retryLogin = useIntercomLoginRetry();
	const toaster = useToaster();

	useEffect(() => {
		Intercom.getUnreadConversationCount().then((count) => {
			setNotifications(count);
		}).catch(() => { });

		const subscription = Intercom.addEventListener(IntercomEvents.IntercomUnreadCountDidChange, (event) => {
			setNotifications(event.count ?? 0);
		});

		return () => {
			subscription.remove();
		};
	}, []);

	// If the startup Intercom login failed (e.g. no network), retry it on demand
	// instead of silently ignoring the tap
	const ensureLoggedIn = useCallback(async () => {
		if (isLoggedIn) {
			return true;
		}
		if (await retryLogin()) {
			return true;
		}
		toaster.show({ message: t('common.somethingWentWrong'), type: 'error' });
		return false;
	}, [isLoggedIn, retryLogin, toaster]);

	const onSupport = useCallback(async () => {
		trackEvent(MixpanelEvent.ButtonPress, { button: 'support', isLoggedIn });
		if (!(await ensureLoggedIn())) {
			return;
		}
		try {
			await Intercom.presentSpace(Space.messages);
		} catch { }
	}, [isLoggedIn, ensureLoggedIn]);

	const onSupportNew = useCallback(async () => {
		trackEvent(MixpanelEvent.ButtonPress, { button: 'support_new', isLoggedIn });
		if (!(await ensureLoggedIn())) {
			return;
		}
		try {
			await Intercom.presentMessageComposer();
		} catch { }
	}, [isLoggedIn, ensureLoggedIn]);

    const onSupportWithMessage = useCallback(async (options?: { message?: string }) => {
        trackEvent(MixpanelEvent.ButtonPress, { button: 'support_with_message', isLoggedIn });
        if (!(await ensureLoggedIn())) {
            return;
        }
        try {
            await Intercom.presentMessageComposer(options?.message);
        } catch { }
    }, [isLoggedIn, ensureLoggedIn])

	const onHelpCenter = useCallback(async () => {
		trackEvent(MixpanelEvent.ButtonPress, { button: 'help_center', isLoggedIn });
		Intercom.presentSpace(Space.home);
	}, [isLoggedIn]);

	const onAboutSeed = useCallback(async () => {
		trackEvent(MixpanelEvent.ButtonPress, { button: 'about_seed', isLoggedIn });
		await Intercom.presentContent({
			type: ContentType.Article,
			id: '12257180'
		} as Article);
	}, []);

	if (!address) {
		return {
			onSupport: async () => { },
			onSupportNew: async () => { },
			onAboutSeed,
			onHelpCenter,
			notifications: 0,
			onSupportWithMessage: async () => { }
		};
	}

	return {
		onSupport,
		onAboutSeed,
		onSupportNew,
		onHelpCenter,
		notifications,
		onSupportWithMessage
	};
};
