import { Address } from "@ton/core";
import { useLanguage, useNetwork, useSelectedAccount } from "..";
import { getLedgerSelected } from "../../../storage/appState";
import { useEffect } from "react";
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
        (async () => {
            try {
                await Intercom.logout();
                setIsLoggedIn(false);
                if (!profile) {
                    await Intercom.loginUnidentifiedUser();
                    setIsLoggedIn(true);
                } else {
                    await Intercom.loginUserWithUserAttributes({
                        email: profile.email,
                        userId: profile.userId,
                        name: legalName,
                        phone: profile.phone,
                        languageOverride: language
                    });
                    setIsLoggedIn(true);
                }
            } catch (error) {
                console.error(`Error logging in to Intercom: ${JSON.stringify(error)}`);
                setIsLoggedIn(false);
            }
        })();
    }, [profile?.email, profile?.phone, profile?.userId, language, legalName]);
}