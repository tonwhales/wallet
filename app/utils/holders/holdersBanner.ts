import { storage } from "../../storage/storage";

const failedBannerClickedKey = 'failedBannerClicked';

export function getFailedBannerClicked() {
    return storage.getBoolean(failedBannerClickedKey);
}

export function setFailedBannerClicked(clicked: boolean) {
    storage.set(failedBannerClickedKey, clicked);
}