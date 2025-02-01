import { Address, Cell } from "@ton/core";

export interface SimpleTransferParams {
  target?: string | null;
  comment?: string | null;
  amount?: bigint | null;
  payload?: Cell | null;
  feeAmount?: bigint | null;
  forwardAmount?: bigint | null;
  stateInit?: Cell | null;
  jetton?: Address | null;
  callback?: ((ok: boolean, result: Cell | null) => void) | null;
  back?: number;
  app?: {
    domain: string;
    title: string;
    url: string;
  };
}
