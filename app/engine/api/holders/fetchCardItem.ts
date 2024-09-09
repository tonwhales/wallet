import axios from "axios";
import * as t from "io-ts";
import { holdersEndpoint } from "./fetchUserState";

export const cardItemCodec = t.type({
  ok: t.boolean,
  config: t.type({
    id: t.string,
    address: t.string,
    state: t.string,
    balance: t.string,
  }),
});

export async function fetchCardItem(id: string, isTestnet: boolean) {
  const endpoint = holdersEndpoint(isTestnet);
  const res = await axios.post(`https://${endpoint}/card/get`, { id });

  if (!cardItemCodec.is(res.data)) {
    throw Error("Invalid card item response");
  }

  if (!res.data.ok) {
    throw Error("Invalid request");
  }
  return res.data.config;
}