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
    language: string,
    // Wallet address goes to Intercom only as a custom attribute — never as userId,
    // so a later Holders enrollment keeps the same Intercom identity (account.id)
    address: string | undefined
};

// The login attempt state lives at module level so a failed startup login
// (e.g. no network) can be retried on demand from useSupport
let lastLoginParams: IntercomLoginParams | null = null;
let loginQueue: Promise<void> = Promise.resolve();
let activeLogin: { params: IntercomLoginParams, promise: Promise<void> } | null = null;

function performIntercomLogin(params: IntercomLoginParams): Promise<void> {
    // Re-join the in-flight attempt for the same params instead of queueing another logout/login cycle
    if (activeLogin && activeLogin.params === params) {
        return activeLogin.promise;
    }
    // Chain attempts so concurrent logins can't interleave their logout/login calls
    const run = loginQueue.catch(() => { }).then(async () => {
        await Intercom.logout();
        if (!params.profile) {
            await Intercom.loginUnidentifiedUser();
            if (params.address) {
                await Intercom.updateUser({ customAttributes: { ton_address: params.address } });
            }
        } else {
            await Intercom.loginUserWithUserAttributes({
                email: params.profile.email,
                userId: params.profile.userId,
                name: params.legalName,
                phone: params.profile.phone,
                languageOverride: params.language,
                ...(params.address ? { customAttributes: { ton_address: params.address } } : {})
            });
        }
    });
    loginQueue = run;
    const attempt = { params, promise: run };
    activeLogin = attempt;
    run.catch(() => { }).then(() => {
        if (activeLogin === attempt) {
            activeLogin = null;
        }
    });
    return run;
}

export function useIntercomLoginRetry() {
    const [, setIsLoggedIn] = useRecoilState(isLoggedInAtom);

    return useCallback(async () => {
        const params = lastLoginParams;
        if (!params) {
            return false;
        }
        try {
            await performIntercomLogin(params);
            // Only report success for the latest login target — a newer login may already be underway
            if (lastLoginParams === params) {
                setIsLoggedIn(true);
            }
            return true;
        } catch (error) {
            console.error(`Error logging in to Intercom: ${JSON.stringify(error)}`);
            if (lastLoginParams === params) {
                setIsLoggedIn(false);
            }
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

    // Keep the ton_address attribute fresh on wallet switches that don't re-login
    // (switching between non-Holders wallets changes no login deps). Chained after
    // the login queue so the attribute lands on the freshly logged-in identity.
    useEffect(() => {
        if (!address) {
            return;
        }
        loginQueue
            .catch(() => { })
            .then(() => Intercom.updateUser({ customAttributes: { ton_address: address } }))
            .catch(() => { });
    }, [address]);

    useEffect(() => {
        const params: IntercomLoginParams = { profile, legalName, language, address };
        lastLoginParams = params;
        (async () => {
            try {
                setIsLoggedIn(false);
                await performIntercomLogin(params);
                // Guard against a stale continuation: a newer effect run may already be re-logging-in
                if (lastLoginParams === params) {
                    setIsLoggedIn(true);
                }
            } catch (error) {
                console.error(`Error logging in to Intercom: ${JSON.stringify(error)}`);
                if (lastLoginParams === params) {
                    setIsLoggedIn(false);
                }
            }
        })();
    }, [profile?.email, profile?.phone, profile?.userId, language, legalName]);
}
