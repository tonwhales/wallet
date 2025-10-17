import { sharedStoragePersistence } from "../../storage/storage";

const inviteIdKey = 'inviteId';
const invitationIdKey = 'invitationId';

export function getInviteId(): string | undefined {
    return sharedStoragePersistence.getString(inviteIdKey);
}

export function getInvitationId(): string | undefined {
    return sharedStoragePersistence.getString(invitationIdKey);
}

export function storeInviteId(inviteId: string) {
    sharedStoragePersistence.set(inviteIdKey, inviteId);
}

export function storeInvitationId(invitationId: string) {
    sharedStoragePersistence.set(invitationIdKey, invitationId);
}