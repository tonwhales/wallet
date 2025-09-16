import { useCallback } from "react";
import { useLanguage } from "../appstate";
import Intercom, { Space } from "@intercom/intercom-react-native";
import { useCurrentAddress } from "../appstate";

export interface HoldersProfile {
    email: string;
    userId: string;
    name: string;
    phone: string;
}

export const useSupport = () => {
    const [language] = useLanguage();
    const { tonAddressString } = useCurrentAddress();

    const authorizeIntercom = useCallback(async (options?: { holdersProfile?: HoldersProfile }) => {
        if (!!tonAddressString) {
            await Intercom.logout()
            await Intercom.loginUserWithUserAttributes({
                userId: tonAddressString,
                languageOverride: language,
            });
            if (options?.holdersProfile) {
                await Intercom.updateUser({
                    email: options?.holdersProfile.email,
                    name: options?.holdersProfile.name + ' (' + options?.holdersProfile.userId + ')',
                    phone: options?.holdersProfile.phone,
                })
            }
        } else {
            await Intercom.logout()
            await Intercom.loginUnidentifiedUser();
        }
    }, [tonAddressString, language])

    const onSupport = useCallback(async (options?: { holdersProfile?: HoldersProfile, space?: Space }) => {
        await authorizeIntercom({ holdersProfile: options?.holdersProfile });
        await Intercom.presentSpace(options?.space || Space.home)
    }, [authorizeIntercom])

    const onSupportWithMessage = useCallback(async (options?: { holdersProfile?: HoldersProfile, message?: string }) => {
        await authorizeIntercom({ holdersProfile: options?.holdersProfile });
        await Intercom.presentMessageComposer(options?.message);
    }, [authorizeIntercom])

    return {
        onSupport,
        onSupportWithMessage
    }
}