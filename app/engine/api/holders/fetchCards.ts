import axios from "axios";
import { holdersEndpoint } from "../../legacy/holders/HoldersProduct";
import { Address } from "@ton/core";
import { z } from "zod";

const publicCardSchema = z.object({
  id: z.string(),
  address: z.string(),
  state: z.string(),
  balance: z.string(),
  card: z.object({
    lastFourDigits: z.union([z.string(), z.undefined(), z.null()]),
    productId: z.string(),
    personalizationCode: z.string(),
    provider: z.string(),
    kind: z.string(),
    tzOffset: z.number()
  }),
  contract: z.string()
});

export const cardListPublicSchema = z.union([
  z.object({
    ok: z.literal(true),
    accounts: z.array(publicCardSchema),
  }),
  z.object({
    ok: z.literal(false),
    error: z.string(),
  }),
]);

export async function fetchCardsPublic(address: string | Address, isTestnet: boolean) {
  console.log('fetchCardsPublic', { address, isTestnet });
  let res = await axios.post(
    'https://' + holdersEndpoint + '/public/cards',
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

  console.log('fetchCardsPublic', { status: res.status, data: res.data });

  if (res.status === 401) {
    return null;
  }

  if (!cardListPublicSchema.safeParse(res.data).success) {
    throw Error("Invalid card list response");
  }

  if (!res.data.ok) {
    throw Error(`Error fetching card list: ${res.data.error}`);
  }

  return res.data.accounts as HoldersCard[];
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

const cardLimitsSchema = z.object({
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
  address: z.string(),
  state: z.string(),
  balance: z.string(),
  card: z.object({
    lastFourDigits: z.union([z.string(), z.undefined(), z.null()]),
    productId: z.string(),
    personalizationCode: z.string(),
    provider: z.string(),
    kind: z.string(),
    tzOffset: z.number()
  }),
  contract: z.string(),
  limits: cardLimitsSchema,
  delivery: z.union([cardDeliverySchema, z.null()])
});

const cardsListSchema = z.object({ accounts: z.array(cardSchema) });

export type CardsList = z.infer<typeof cardsListSchema>;

export const cardsListResCodec = z.intersection(z.object({ ok: z.literal(true) }), cardsListSchema);

export const generalCardSchema = z.intersection(cardSchema, publicCardSchema);
export type HoldersCard = z.infer<typeof generalCardSchema>;

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

  console.log('fetchCards', { status: res.status, data: res.data });

  if (res.status === 401) {
    return null;
  }

  if (!res.data.ok) {
    throw Error(`Error fetching card list: ${res.data.error}`);
  }

  if (!cardsListResCodec.safeParse(res.data).success) {
    throw Error("Invalid card list response");
  }

  return res.data.accounts as HoldersCard[];
}