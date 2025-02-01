import { formatCurrency } from "../../../../../utils/formatCurrency";
import { fromNano } from "@ton/core";
import { PriceState } from "../../../../../engine/api/fetchPrice";

export const formatPrice = (
  value: bigint | null,
  price: PriceState,
  currency: string
) => {
  if (!price || !value) return undefined;
  const isNeg = value < 0n;
  const abs = isNeg ? -value : value;
  return formatCurrency(
    (
      parseFloat(fromNano(abs)) *
      price.price.usd *
      price.price.rates[currency]
    ).toFixed(2),
    currency,
    isNeg
  );
};
