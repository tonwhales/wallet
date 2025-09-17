import { useCallback } from "react";
import { useLanguage } from "../appstate";
import Intercom, { Space } from "@intercom/intercom-react-native";
import { useCurrentAddress } from "../appstate";
import { useHoldersProfile } from "../holders/useHoldersProfile";
import { getUserLegalName } from "../../../utils/holders/getUserLegalName";

export const useSupport = () => {
    const [language] = useLanguage();
    const { tonAddressString } = useCurrentAddress();
    const { data: profile } = useHoldersProfile(tonAddressString);

    const authorizeIntercom = useCallback(async () => {
        if (!!tonAddressString) {
            await Intercom.logout()
            await Intercom.loginUserWithUserAttributes({
                userId: tonAddressString,
                languageOverride: language,
            });
            if (profile) {
                await Intercom.updateUser({
                    email: profile.email,
                    name: getUserLegalName(profile) + ' (' + profile.userId + ')',
                    phone: profile.phone,
                })
            }
        } else {
            await Intercom.logout()
            await Intercom.loginUnidentifiedUser();
        }
    }, [tonAddressString, language, profile])

    const onSupport = useCallback(async (options?: { space?: Space }) => {
        await authorizeIntercom();
        await Intercom.presentSpace(options?.space || Space.home)
    }, [authorizeIntercom])

    const onSupportWithMessage = useCallback(async (options?: { message?: string }) => {
        await authorizeIntercom();
        await Intercom.presentMessageComposer(options?.message);
    }, [authorizeIntercom])

    return {
        onSupport,
        onSupportWithMessage
    }
}