import axios from "axios";
import { holdersEndpoint } from "./fetchUserState";
import { z } from "zod";
import { Address } from "@ton/core";
import { getStoreFront } from "../../../modules/StoreFront";
import { getCountry } from 'react-native-localize';
import { getCampaignId } from "../../../utils/CachedLinking";

const textWithTranslations = z.object({ en: z.string(), ru: z.string() });

const holdersBannerContent = z.object({
  action: textWithTranslations,
  title: textWithTranslations,
  subtitle: textWithTranslations,
});

const holdersCustomBanner = z.object({
  id: z.number(),
  content: holdersBannerContent,
});

const inviteCheckCodec = z.object({
  allowed: z.boolean(),
  banner: holdersCustomBanner.optional()
});

export type HoldersBannerContent = z.infer<typeof holdersBannerContent>;
export type HoldersCustomBanner = z.infer<typeof holdersCustomBanner>;
export type InviteCheck = z.infer<typeof inviteCheckCodec>;

export async function fetchAddressInviteCheck(address: string, isTestnet: boolean): Promise<InviteCheck> {
  const endpoint = holdersEndpoint(isTestnet);
  const formattedAddress = Address.parse(address).toString({ testOnly: isTestnet });
  const countryCode = getCountry();
  const storeFrontCode = getStoreFront();
  const region = { countryCode, storeFrontCode };
  const campaignId = getCampaignId();

  let res = await axios.post(
    `https://${endpoint}/v2/invite/wallet/check/v2`,
    {
      wallet: formattedAddress,
      network: isTestnet ? "ton-testnet" : "ton-mainnet",
      region: region,
      campaignId
    }
  );

  const parsed = inviteCheckCodec.safeParse(res.data);

  if (!parsed.success) {
    console.warn("Failed to parse invite check response", parsed.error);
    return { allowed: false };
  }

  return parsed.data;
}
