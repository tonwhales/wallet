import axios from "axios";
import { holdersEndpoint } from "./fetchUserState";
import { z } from "zod";
import { Address } from "@ton/core";
import { getStoreFront } from "../../../modules/StoreFront";
import { getCountry } from 'react-native-localize';
import { getCampaignId, getSearchParams } from "../../../utils/holders/queryParamsStore";

const textWithTranslations = z.object({ en: z.string(), ru: z.string() });

const holdersBannerContent = z.object({
  action: textWithTranslations,
  title: textWithTranslations,
  subtitle: textWithTranslations,
});

const holdersCustomBanner = z.object({
  id: z.number(),
  content: holdersBannerContent,
  // Data-driven fields (server-side). When `path` is present the banner is rendered as a data-driven
  // banner that deep-links into the Holders dapp at that path; `imageUrl` overrides the bundled artwork.
  imageUrl: z.string().nullish(),
  path: z.string().nullish(),
});

const inviteCheckCodec = z.object({
  allowed: z.boolean(),
  banner: holdersCustomBanner.nullish(),
  settingsBanner: holdersCustomBanner.nullish(),
  // Data-driven banner STACK (new server field). When present we render the whole list; the count/order
  // is decided server-side. The single banner/settingsBanner above stay populated (the top one) for
  // backward compatibility. Same list is sent for home + settings.
  banners: z.array(holdersCustomBanner).nullish(),
  settingsBanners: z.array(holdersCustomBanner).nullish()
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
  const storedReferrerParams = getSearchParams();

  let res = await axios.post(
    `https://${endpoint}/v2/invite/wallet/check/v2`,
    {
      wallet: formattedAddress,
      network: isTestnet ? "ton-testnet" : "ton-mainnet",
      region: region,
      campaignId,
      campaignParams: storedReferrerParams,
      // Opt into server-driven (data-driven) Altery banner stack — this build can render `banners`.
      dataDrivenBanners: true
    }
  );

  const parsed = inviteCheckCodec.safeParse(res.data);

  if (!parsed.success) {
    console.warn("Failed to parse invite check response", parsed.error);
    return { allowed: false };
  }

  return parsed.data;
}
