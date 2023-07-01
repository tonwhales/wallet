import axios from "axios";
import * as t from "io-ts";
import { holdersEndpoint } from "../../holders/HoldersProduct";
import { Address } from "ton";

export const cardListPublicCodec = t.union([
  t.type({
    ok: t.literal(true),
    accounts: t.array(
      t.type({
        id: t.string,
        address: t.string,
        state: t.string,
        balance: t.string,
        card: t.type({
          lastFourDigits: t.union([t.string, t.undefined, t.null]),
          productId: t.string,
          personalizationCode: t.string,
          provider: t.string,
          kind: t.string,
          tzOffset: t.number
        }),
        contract: t.string
      })
    ),
  }),
  t.type({
    ok: t.literal(false),
    error: t.string,
  }),
]);

export async function fetchCardsPublic(address: Address, isTestnet: boolean) {
  let res = await axios.post(
    'https://' + holdersEndpoint + '/public/cards',
    {
      walletKind: 'tonhub',
      network: isTestnet ? 'ton:testnet' : 'ton:mainnet',
      address: address.toFriendly({ testOnly: isTestnet })
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

  if (!cardListPublicCodec.is(res.data)) {
    throw Error("Invalid card list response");
  }

  if (!res.data.ok) {
    throw Error(`Error fetching card list: ${res.data.error}`);
  }

  return res.data.accounts;
}

export enum CardStatus {
  PENDING = 'PENDING',
  ORDERED = 'ORDERED',
  PERSONALIZED = 'PERSONALIZED',
  DISPATCHED = 'DISPATCHED',
  DELIVERED = 'DELIVERED',
}

export type CardDelivery = {
  id: string,
  status: CardStatus,
  countryCode: string,
  address: string,
  postalCode: string | undefined | null,
  apartment: string | undefined | null,
  floor: string | undefined | null,
  phone: string,
  email: string,
  trackNumber: string | undefined | null,
  deliveryMethod: string
}

export const cardDeliveryCodec = t.type({
  id: t.string,
  status: t.union([
    t.literal(CardStatus.PENDING),
    t.literal(CardStatus.ORDERED),
    t.literal(CardStatus.PERSONALIZED),
    t.literal(CardStatus.DISPATCHED),
    t.literal(CardStatus.DELIVERED),
  ]),
  countryCode: t.string,
  address: t.string,
  postalCode: t.union([t.string, t.undefined, t.null]),
  apartment: t.union([t.string, t.undefined, t.null]),
  floor: t.union([t.string, t.undefined, t.null]),
  phone: t.string,
  email: t.string,
  trackNumber: t.union([t.string, t.undefined, t.null]),
  deliveryMethod: t.string
});

export type CardsList = {
  accounts: {
    id: string,
    address: string,
    state: string,
    balance: string,
    card: {
      lastFourDigits: string | undefined | null,
      productId: string,
      personalizationCode: string,
      provider: string,
      kind: string,
      tzOffset: number
    },
    contract: string,
    limits: {
      tzOffset: number,
      onetime: string,
      daily: string,
      dailySpent: string,
      monthly: string,
      monthlySpent: string,
      dailyDeadline: number,
      monthlyDeadline: number
    },
    delivery: CardDelivery | null
  }[]
}

export const cardsListCodec = t.type({
  accounts: t.array(
    t.type({
      id: t.string,
      address: t.string,
      state: t.string,
      balance: t.string,
      card: t.type({
        lastFourDigits: t.union([t.string, t.undefined, t.null]),
        productId: t.string,
        personalizationCode: t.string,
        provider: t.string,
        kind: t.string,
        tzOffset: t.number
      }),
      contract: t.string,
      limits: t.type({
        tzOffset: t.number,
        onetime: t.string,
        daily: t.string,
        dailySpent: t.string,
        monthly: t.string,
        monthlySpent: t.string,
        dailyDeadline: t.number,
        monthlyDeadline: t.number
      }),
      delivery: t.union([cardDeliveryCodec, t.null])
    })
  ),
});

export const cardsListResCodec = t.intersection([
  t.type({ ok: t.literal(true) }),
  cardsListCodec
]);

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

  if (!cardsListResCodec.is(res.data)) {
    throw Error("Invalid card list response");
  }

  return res.data as CardsList;
}