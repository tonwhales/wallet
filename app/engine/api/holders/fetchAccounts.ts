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
  name: z.string().nullable().optional(),
  balance: z.string(),
  partner: z.string(),
  tzOffset: z.number(),
  cards: z.array(cardPublicSchema),
  contract: z.string(),
  network: networksSchema,
});

export const accountsListPublicSchema = z.union([
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
      network: isTestnet ? 'ton-testnet' : 'ton-mainnet',
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

  const parseResult = accountsListPublicSchema.safeParse(res.data);
  if (!parseResult.success) {
    console.warn(JSON.stringify(parseResult.error.format()));
    throw Error("Invalid public card list response");
  }

  if (!res.data.ok) {
    throw Error(`Error fetching card list: ${res.data.error}`);
  }

  return res.data.accounts as GeneralHoldersAccount[];
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

const cardPendingStatusSchema = z.union([
  z.literal('PENDING_BLOCK'),
  z.literal('PENDING_FREEZE'),
  z.literal('PENDING_UNFREEZE'),
  z.literal('PENDING_FOR_PAYMENT'),
]);

const cardStatusSchema = z.union([
  cardPendingStatusSchema,
  z.literal('PENDING_CARD'),
  z.literal('PENDING_CARD_ISSUE'),
  z.literal('PENDING_CONTRACT'),
  z.literal('WAITING_FOR_PAYMENT'),
  z.literal('ACTIVE'),
  z.literal('BLOCKED'),
  z.literal('FROZEN'),
  z.literal('CLOSED'),
]);

const cardSchema = z.object({
  id: z.string(),
  fiatCurrency: z.string(),
  lastFourDigits: z.string().nullable().optional(),
  leftToPay: z.string(),
  personalizationCode: z.string(),
  productId: z.string(),
  seed: z.string().nullable().optional(),
  status: cardStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

const cryptoCurrencyTicker = z.union([
  z.literal('TON'),
  z.literal('USDT'),
  z.literal('EURT'),
]);

const accountSchema = z.object({
  id: z.string(),
  address: z.string().optional().nullable(),
  name: z.string().nullable().optional(),
  seed: z.string().nullable(),
  state: z.string(),
  balance: z.string(),
  tzOffset: z.number(),
  contract: z.string(),
  partner: z.string(),
  network: networksSchema,
  ownerAddress: z.string(),

  cryptoCurrency: z.object({
    decimals: z.number(),
    ticker: cryptoCurrencyTicker,
    tokenContract: z.string().nullable().optional(),
  }),

  limits: accountLimitsSchema,
  cards: z.array(cardSchema),
});

export const accountsListResCodec = z.union([
  z.object({
    ok: z.literal(true),
    list: z.array(accountSchema),
  }),
  z.object({
    ok: z.literal(false),
    error: z.string(),
  }),
]);;

export const generalAccountSchema = z.intersection(accountSchema, accountPublicSchema);
export const generalCardSchema = z.intersection(cardSchema, cardPublicSchema);

export type GeneralHoldersAccount = z.infer<typeof generalAccountSchema>;
export type HoldersAccount = z.infer<typeof accountSchema>;
export type GeneralHoldersCard = z.infer<typeof generalCardSchema>;

export async function fetchAccountsList(token: string) {
  let res = await axios.post(
    'https://' + holdersEndpoint + '/v2/account/list',
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

  let parseResult = accountsListResCodec.safeParse(res.data);
  if (!parseResult.success) {
    console.warn(JSON.stringify(parseResult.error.format()));
    throw Error("Invalid card list response");
  }

  return res.data.list as GeneralHoldersAccount[];
}