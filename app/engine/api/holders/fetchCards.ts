import axios from "axios";
import { Address } from "@ton/core";
import { z } from "zod";
import { holdersEndpoint } from "./fetchAccountState";

const networksSchema = z.union([
  z.literal('ton-mainnet'),
  z.literal('ton-testnet'),
  z.literal('tron'),
  z.literal('polygon'),
  z.literal('ether'),
  z.literal('solana')
]);

const cardPublicSchema = z.object({
  lastFourDigits: z.union([z.string(), z.undefined(), z.null()]),
  productId: z.string(),
  personalizationCode: z.string(),
  provider: z.string(),
  kind: z.string(),
});

const accountPublicSchema = z.object({
  id: z.string(),
  address: z.nullable(z.string()),
  state: z.string(),
  name: z.string(),
  balance: z.string(),
  partner: z.string(),
  tzOffset: z.number(),
  cards: z.array(cardPublicSchema),
  contract: z.string(),
  network: networksSchema,
});

export const accoutnsListPublicSchema = z.union([
  z.object({
    ok: z.literal(true),
    accounts: z.array(accountPublicSchema),
  }),
  z.object({
    ok: z.literal(false),
    error: z.string(),
  }),
]);

export async function fetchAccountsPublic(address: string | Address, isTestnet: boolean) {
  let res = await axios.post(
    'https://' + holdersEndpoint + '/v2/public/accounts',
    {
      walletKind: 'tonhub',
      network: isTestnet ? 'ton:testnet' : 'ton:mainnet',
      address: (address instanceof Address) ? address.toString({ testOnly: isTestnet }) : address
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Credentials": "true",
      }
    }
  );

  if (res.status === 401) {
    return null;
  }

  if (!accoutnsListPublicSchema.safeParse(res.data).success) {
    throw Error("Invalid card list response");
  }

  console.log({ fetchCardsPublic: res.data });

  if (!res.data.ok) {
    throw Error(`Error fetching card list: ${res.data.error}`);
  }

  return res.data.accounts as HoldersAccount[];
}

export enum CardStatus {
  PENDING = 'PENDING',
  ORDERED = 'ORDERED',
  PERSONALIZED = 'PERSONALIZED',
  DISPATCHED = 'DISPATCHED',
  DELIVERED = 'DELIVERED',
}

export type CardDelivery = z.infer<typeof cardDeliverySchema>;

const cardDeliveryStatusSchema = z.union([
  z.literal(CardStatus.PENDING),
  z.literal(CardStatus.ORDERED),
  z.literal(CardStatus.PERSONALIZED),
  z.literal(CardStatus.DISPATCHED),
  z.literal(CardStatus.DELIVERED),
]);

const cardDeliverySchema = z.object({
  id: z.string(),
  status: cardDeliveryStatusSchema,
  countryCode: z.string(),
  address: z.string(),
  postalCode: z.union([z.string(), z.undefined(), z.null()]),
  apartment: z.union([z.string(), z.undefined(), z.null()]),
  floor: z.union([z.string(), z.undefined(), z.null()]),
  phone: z.string(),
  email: z.string(),
  trackNumber: z.union([z.string(), z.undefined(), z.null()]),
  deliveryMethod: z.string()
});

const accountLimitsSchema = z.object({
  tzOffset: z.number(),
  onetime: z.string(),
  daily: z.string(),
  dailySpent: z.string(),
  monthly: z.string(),
  monthlySpent: z.string(),
  dailyDeadline: z.number(),
  monthlyDeadline: z.number()
});

const cardSchema = z.object({
  id: z.string(),
  createAt: z.number(),
  fiatCurrency: z.string(),
  lastFourDigits: z.union([z.string(), z.undefined(), z.null()]),
  leftToPay: z.string(),
  personalizationCode: z.string(),
  productId: z.string(),
  seed: z.string(),
  status: z.string(),
  updatedAt: z.number(),
  walletId: z.string(),
});

const accountSchema = z.object({
  id: z.string(),
  address: z.string(),
  name: z.string(),
  seed: z.string(),
  state: z.string(),
  balance: z.string(),
  tzOffset: z.number(),
  partner: z.string(),
  contract: z.string(),
  network: networksSchema,
  ownerAddress: z.string(),
  cryptoCurrency: z.object({
    decimals: z.number(),
    ticker: z.string(),
    tokenContract: z.string(),
  }),
  limits: accountLimitsSchema,
  cards: z.array(cardSchema),
});

export const cardsListResCodec = z.union([
  z.object({
    ok: z.literal(true),
    accounts: z.array(accountSchema),
  }),
  z.object({
    ok: z.literal(false),
    error: z.string(),
  }),
]);;

export const generalAccountSchema = z.intersection(cardSchema, accountPublicSchema);
export type HoldersAccount = z.infer<typeof generalAccountSchema>;

export async function fetchCardsList(token: string) {
  let res = await axios.post(
    'https://' + holdersEndpoint + '/card/list',
    { token },
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Credentials": "true",
      }
    }
  );

  if (res.status === 401) {
    return null;
  }

  if (!res.data.ok) {
    throw Error(`Error fetching card list: ${res.data.error}`);
  }

  if (!cardsListResCodec.safeParse(res.data).success) {
    throw Error("Invalid card list response");
  }

  return res.data.list as HoldersAccount[];
}