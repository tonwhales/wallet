import axios from "axios";
import * as t from "io-ts";
import { zenPayEndpoint } from "../../corp/ZenPayProduct";

export const cardListCodec = t.union([
  t.type({
    ok: t.literal(true),
    accounts: t.array(
      t.type({
        id: t.string,
        address: t.string,
        state: t.string,
        balance: t.string,
        card: t.type({
          lastFourDigits: t.union([t.string, t.undefined]),
        })
      })
    ),
  }),
  t.type({
    ok: t.literal(false),
    error: t.string,
  }),
]);

export async function fetchCardList(token: string) {
  console.log({ token });
  let res = await axios.post(
    'https://' + zenPayEndpoint + '/card/list',
    { token: token, },
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Credentials": "true",
      }
    }
  );

  console.log({ res: res.data });

  if (!cardListCodec.is(res.data)) {
    throw Error("Invalid card list response");
  }

  if (!res.data.ok) {
    throw Error(`Error fetching card list: ${res.data.error}`);
  }

  return res.data.accounts;
}