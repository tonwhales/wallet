import { Address } from "@ton/core";
import { useLanguage, useNetwork, useSelectedAccount } from "..";
import { getLedgerSelected } from "../../../storage/appState";
import { useCallback, useEffect } from "react";
import { getUserLegalName } from "../../../utils/holders/getUserLegalName";
import Intercom from "@intercom/intercom-react-native";
import { atom, useRecoilState, useRecoilValue } from "recoil";
import { useLedgerTransport } from "../../../fragments/ledger/components/TransportContext";
import { useHoldersProfile } from "../holders/useHoldersProfile";

const isLoggedInAtom = atom({
    key: 'support/isLoggedIn',
    default: false
});

export function useSupportAuthState() {
    return useRecoilValue(isLoggedInAtom);
}

type IntercomLoginParams = {
    profile: { email?: string, userId?: string, phone?: string } | null | undefined,
    legalName: string | undefined,
    language: string
};

// The login attempt state lives at module level so a failed startup login
// (e.g. no network) can be retried on demand from useSupport
let lastLoginParams: IntercomLoginParams | null = null;
let loginQueue: Promise<void> = Promise.resolve();

function performIntercomLogin(params: IntercomLoginParams): Promise<void> {
    // Chain attempts so concurrent logins can't interleave their logout/login calls
    const run = loginQueue.catch(() => { }).then(async () => {
        await Intercom.logout();
        if (!params.profile) {
            await Intercom.loginUnidentifiedUser();
        } else {
            await Intercom.loginUserWithUserAttributes({
                email: params.profile.email,
                userId: params.profile.userId,
                name: params.legalName,
                phone: params.profile.phone,
                languageOverride: params.language
            });
        }
    });
    loginQueue = run;
    return run;
}

export function useIntercomLoginRetry() {
    const [, setIsLoggedIn] = useRecoilState(isLoggedInAtom);

    return useCallback(async () => {
        if (!lastLoginParams) {
            return false;
        }
        try {
            await performIntercomLogin(lastLoginParams);
            setIsLoggedIn(true);
            return true;
        } catch (error) {
            console.error(`Error logging in to Intercom: ${JSON.stringify(error)}`);
            setIsLoggedIn(false);
            return false;
        }
    }, []);
}

export function useSupportAuth() {
    const { isTestnet } = useNetwork();
    const ledgerContext = useLedgerTransport();
    const ledgerAddress = ledgerContext.wallets[0]?.address;
    const ledgerAddressString = ledgerAddress
        ? Address.parse(ledgerAddress).toString({ testOnly: isTestnet })
        : undefined;
    const selected = useSelectedAccount();
    const ledgerSelected = getLedgerSelected();
    const _address = ledgerAddressString && ledgerSelected ? Address.parse(ledgerAddressString) : selected?.address;
    const address = _address?.toString({ testOnly: isTestnet });
    const { data: profile } = useHoldersProfile(address);
    const [language] = useLanguage();
    const legalName = profile ? getUserLegalName(profile) : undefined;

    const [, setIsLoggedIn] = useRecoilState(isLoggedInAtom);

    useEffect(() => {
        const params: IntercomLoginParams = { profile, legalName, language };
        lastLoginParams = params;
        (async () => {
            try {
                setIsLoggedIn(false);
                await performIntercomLogin(params);
                setIsLoggedIn(true);
            } catch (error) {
                console.error(`Error logging in to Intercom: ${JSON.stringify(error)}`);
                setIsLoggedIn(false);
            }
        })();
    }, [profile?.email, profile?.phone, profile?.userId, language, legalName]);
}
