import { sharedStoragePersistence } from "../../storage/storage";

const inviteIdKey = 'inviteId';

export function getInviteId(): string | undefined {
    return sharedStoragePersistence.getString(inviteIdKey);
}

export function storeInviteId(inviteId: string) {
    sharedStoragePersistence.set(inviteIdKey, inviteId);
}