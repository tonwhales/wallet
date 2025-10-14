import { holdersUrl } from '../../engine/api/holders/fetchUserState';
import { HoldersAppParamsType } from '../../fragments/holders/HoldersAppFragment';
import { TypedNavigation } from '../useTypedNavigation';

export function resolveHoldersInvitationLink(params: {
    navigation: TypedNavigation,
    isTestnet: boolean,
    invitationId: string
}) {
    const { navigation, isTestnet, invitationId } = params

    const endpoint = holdersUrl(isTestnet);

    navigation.navigateHoldersLanding({ endpoint, onEnrollType: { type: HoldersAppParamsType.Invitation }, invitationId }, isTestnet);
}