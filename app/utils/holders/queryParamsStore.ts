import { sharedStoragePersistence } from "../../storage/storage";

const campaignKey = 'campaignId-key';
const searchParamsKey = 'search-params';
/*
 * @deprecated
 */
const branchCampaignKey = 'branch-campaign';

/*
 * @deprecated
 */
function clearBranchCampaignId() {
    sharedStoragePersistence.delete(branchCampaignKey);
}

export function getCampaignId(): string | undefined {
    const branch = sharedStoragePersistence.getString(branchCampaignKey);
    if (branch) {
        clearBranchCampaignId();
        storeCampaignId(branch);
        return branch;
    }
    return sharedStoragePersistence.getString(campaignKey);
}

export function storeCampaignId(campaignId: string) {
    sharedStoragePersistence.set(campaignKey, campaignId);
}

export function getSearchParams(): Record<string, string> {
    const searchParams = sharedStoragePersistence.getString(searchParamsKey);
    if (searchParams) {
        return JSON.parse(searchParams);
    }
    return {};
}

export function addSearchParams(params: Record<string, string>) {
    const currentParams = getSearchParams();
    const newParams = { ...currentParams, ...params };
    sharedStoragePersistence.set(searchParamsKey, JSON.stringify(newParams));
}

export function processSearchParams(params: Record<string, string>) {
    // to add to invite fetch
    if (params.campaignId) {
        storeCampaignId(params.campaignId);
    }

    addSearchParams(params);
}