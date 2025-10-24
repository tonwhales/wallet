import axios from "axios";
import { Address } from "@ton/core";
import { z } from "zod";
import { holdersEndpoint } from "./fetchUserState";

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

const accountTypeSchema = z.union([
  z.literal('crypto'),
  z.literal('vesting'),
]);

export type AccountType = z.infer<typeof accountTypeSchema>;

const accountPublicSchema = z.object({
  id: z.string(),
  type: accountTypeSchema.optional(),
  accountIndex: z.number(),
  address: z.nullable(z.string()),
  state: z.string(),
  name: z.string().nullish(),
  balance: z.string(),
  partner: z.string(),
  tzOffset: z.number(),
  cards: z.array(cardPublicSchema),
  contract: z.string(),
  network: networksSchema,
  createdAt: z.string().nullish()
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

export async function fetchAccountsPublic({ address, solanaAddress, isTestnet }: { address: string | Address, isTestnet: boolean, solanaAddress?: string }) {
  const endpoint = holdersEndpoint(isTestnet);
  const addressString = (address instanceof Address) ? address.toString({ testOnly: isTestnet }) : address;
  const body = solanaAddress ? {
    walletKind: 'tonhub',
    wallets: [
      {
        network: isTestnet ? 'ton-testnet' : 'ton-mainnet',
        address: addressString
      },
      {
        network: 'solana',
        address: solanaAddress
      }
    ]
  } : {
    walletKind: 'tonhub',
    network: isTestnet ? 'ton-testnet' : 'ton-mainnet',
    address: addressString
  };

  const res = await axios.post(
    `https://${endpoint}/v2/public/accounts`,
    body,
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
  dailyDeadline: z.number(),
  dailySpent: z.string(),
  monthlyDeadline: z.number(),
  monthlySpent: z.string(),
  monthly: z.string(),
  daily: z.string(),
  onetime: z.string()
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
  z.literal('CLIENT_VERIFICATION'),
  z.literal('CARD_VERIFICATION')
]);

const cardPaymentSchema = z.union([
  z.literal('visa'),
  z.literal('mc'),
]);

const cardSchema = z.object({
  id: z.string(),
  status: cardStatusSchema,
  walletId: z.string().optional().nullable(),
  fiatCurrency: z.string(),
  lastFourDigits: z.string().nullish(),
  productId: z.string(),
  personalizationCode: z.string(),
  delivery: cardDeliverySchema.nullish(),
  seed: z.string().nullish(),
  updatedAt: z.string(),
  createdAt: z.string(),
  provider: z.string().nullish(),
  kind: z.string().nullish(),
  schema: cardPaymentSchema
});

const cardDebit = cardSchema.and(z.object({ type: z.literal('DEBIT') }),);
const cardPrepaid = cardSchema.and(
  z.object({
    type: z.literal('PREPAID'),
    fiatBalance: z.string(),
  }),
);

const brandSchema = z.union([
  z.literal('HOLDERS'),
  z.literal('TONHUB'),
  z.literal('TONKEEPER'),
  z.literal('CARDBOT'),
]);

const cryptoCurrencySchema = z.object({
  decimals: z.number(),
  ticker: z.string(),
  tokenContract: z.string().optional(),
});

export const invoiceSchema = z.object({
  id: z.string(),
  expiresAt: z.number().nullable(),
  cryptoAccountId: z.string(),
  cryptoCurrency: cryptoCurrencySchema,
  params: z.object({
    kind: z.enum(['crypto', 'crypto_fiat']),
    cryptoAmount: z.string().nullable(),
    cryptoAmountNano: z.string(),
    fiatAmount: z.string().nullable(),
    fiatCurrency: z.string().nullable(),
    rate: z.string().nullable(),
    fees: z.string().optional(),
  }),
  purpose: z.any(),
});

export const cryptoAccountStatusSchema = z.enum([
  'PENDING',
  'PENDING_CONTRACT',
  'ACTIVE',
  'SUSPENDED',
  'MANUALLY_CLOSED',
  'CLOSED',
]);

const baseAccountSchema = z.object({
  id: z.string(),
  type: accountTypeSchema.optional(),
  createdAt: z.string().nullish(),
  address: z.string().nullish(),
  name: z.string().nullish(),
  accountIndex: z.number(),
  seed: z.string().nullable(),
  state: cryptoAccountStatusSchema,
  balance: z.string(),
  contract: z.string(),
  network: networksSchema,
  ownerAddress: z.string(),
  contractAddress: z.string().nullish(),
  cryptoCurrency: cryptoCurrencySchema,
  hasBeenDepositedOnce: z.boolean().nullish(),
});

const vestingAccountSchema = baseAccountSchema.extend({
  type: z.literal('vesting'),
  beneficiaryAddress: z.string(),
  beneficiaryCryptoAccountId: z.string(),
  beneficiaryName: z.string(),
  creatorAccountId: z.string(),
  estimatedPayoutsRemaining: z.number(),
  nextPayoutAt: z.string().nullable(),
  startPaymentsAt: z.number(),
  totalDeposited: z.string(),
  totalPaidOut: z.string(),
  unlockAmountPerPeriod: z.string(),
  unlockPeriodSeconds: z.string(),
});

const cryptoAccountSchema = baseAccountSchema.extend({
  type: z.literal('crypto').optional(),
  contractSeed: z.string().nullish(),
  tzOffset: z.number(),
  prepaidOnly: z.boolean(),
  partner: z.string(),
  brand: brandSchema,
  isLatestContract: z.boolean(),
  limits: accountLimitsSchema,
  invoices: invoiceSchema.array(),
  totalDebtCryptoAmountNano: z.string(),
  cards: z.array(cardDebit),
  vestingAccounts: z.array(z.any()).optional(),
});

const accountSchema = z.union([
  vestingAccountSchema,
  cryptoAccountSchema,
]);

export const accountsListResCodec = z.discriminatedUnion('ok', [
  z.object({
    ok: z.literal(true),
    list: z.array(accountSchema),
    prepaidCards: z.array(cardPrepaid)
  }),
  z.object({
    ok: z.literal(false),
    error: z.string(),
  }),
]);

export const generalAccountSchema = z.intersection(cryptoAccountSchema, accountPublicSchema);
export const generalCardSchema = z.intersection(cardSchema, cardPublicSchema);

export type GeneralHoldersAccount = z.infer<typeof generalAccountSchema>;
export type HoldersAccount = z.infer<typeof accountSchema>;
export type HoldersCard = z.infer<typeof cardSchema>;
export type GeneralHoldersCard = z.infer<typeof generalCardSchema>;
export type PrePaidHoldersCard = z.infer<typeof cardPrepaid>;

export async function fetchAccountsList(token: string, isTestnet: boolean) {
  const endpoint = holdersEndpoint(isTestnet);
  let res = await axios.post(
    `https://${endpoint}/v2/account/list`,
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

  console.log('res', JSON.stringify(res.data, null, 2));

  if (res.status === 401) {
    return null;
  }

  const data = res.data;

  let parseResult = accountsListResCodec.safeParse(data);
  if (!parseResult.success) {
    console.warn(JSON.stringify(parseResult.error.format()));
    throw Error("Invalid card list response");
  }

  if (!parseResult.data.ok) {
    throw Error(`Error fetching card list: ${parseResult.data.error}`);
  }

  return {
    accounts: data.list as GeneralHoldersAccount[],
    prepaidCards: data.prepaidCards as PrePaidHoldersCard[]
  };
}