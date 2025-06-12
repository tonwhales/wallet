import { holdersUrl } from '../../engine/api/holders/fetchUserState';
import { HoldersAppParamsType } from '../../fragments/holders/HoldersAppFragment';
import { TypedNavigation } from '../useTypedNavigation';

export function resolveHoldersInviteLink(params: {
    navigation: TypedNavigation,
    isTestnet: boolean,
    inviteId: string
}) {
    const { navigation, isTestnet, inviteId } = params

    const endpoint = holdersUrl(isTestnet);

    navigation.navigateHoldersLanding({ endpoint, onEnrollType: { type: HoldersAppParamsType.Invite }, inviteId }, isTestnet);
}