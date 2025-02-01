import { RefObject, useEffect, useMemo, useState } from "react";
import { estimateFees } from "../../../../../utils/estimateFees";
import { contractFromPublicKey } from "../../../../../engine/contractFromPublicKey";
import { fetchSeqno } from "../../../../../engine/api/fetchSeqno";
import { getLastBlock } from "../../../../../engine/accountWatcher";
import { backoff } from "../../../../../utils/time";
import {
  Address,
  Cell,
  comment,
  external,
  internal,
  loadStateInit,
  MessageRelaxed,
  SendMode,
  storeMessage,
  storeMessageRelaxed,
} from "@ton/core";
import { AsyncLock } from "teslabot";
import { getCurrentAddress } from "../../../../../storage/appState";
import { useConfig } from "../../../../../engine/hooks";
import { resolveLedgerPayload } from "../../../../ledger/utils/resolveLedgerPayload";
import { WalletContractV4, WalletContractV5R1 } from "@ton/ton";
import { LedgerOrder, Order } from "../../../ops/Order";
import { WalletVersions } from "../../../../../engine/types";
import { AccountLite } from "../../../../../engine/hooks/accounts/useAccountLite";

export type Props = {
  estimationRef: RefObject<bigint | null>;
  stateInit?: Cell | null;
  ledgerContext: any;
  order: LedgerOrder | Order | null;
  client: any;
  commentString: string;
  ledgerAddress?: Address;
  walletVersion: WalletVersions;
  supportsGaslessTransfer?: boolean;
  jettonPayload?: {
    customPayload?: string | null | undefined;
    stateInit?: string | null | undefined;
  } | null;
  accountLite?: AccountLite | null;
  network: {
    isTestnet: boolean;
  };
  isV5: boolean;
};

export const useFeeEstimation = ({
  estimationRef,
  stateInit,
  ledgerContext,
  order,
  client,
  commentString,
  ledgerAddress,
  walletVersion,
  supportsGaslessTransfer,
  jettonPayload,
  accountLite,
  network,
  isV5,
}: Props) => {
  const config = useConfig();

  const [estimation, setEstimation] = useState<bigint | null>(
    estimationRef.current
  );
  const lock = useMemo(() => new AsyncLock(), []);

  useEffect(() => {
    let ended = false;
    lock.inLock(async () => {
      await backoff("simple-transfer", async () => {
        if (ended) {
          return;
        }

        // Load app state
        const currentAcc = getCurrentAddress();
        const address = ledgerAddress ?? currentAcc.address;

        let seqno = await fetchSeqno(client, await getLastBlock(), address);

        // Parse order
        let intMessage: MessageRelaxed;
        let sendMode: number =
          SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATELY;

        let storageStats: ({
          lastPaid: number;
          duePayment: string | null;
          used: {
            bits: number;
            cells: number;
            publicCells: number;
          };
        } | null)[] = [];

        const block: any = await backoff("transfer", () =>
          client.getLastBlock()
        );

        if (!order) {
          const internalStateInit = !!stateInit
            ? loadStateInit(stateInit.asSlice())
            : null;

          const body = comment(commentString);

          intMessage = internal({
            to: address,
            value: 0n,
            init: internalStateInit,
            bounce: false,
            body,
          });

          const state: any = await backoff("transfer", () =>
            client.getAccount(block.last.seqno, address)
          );
          storageStats = state.account.storageStat
            ? [state.account.storageStat]
            : [];
        } else {
          if (order.type === "order") {
            const internalStateInit = !!order.messages[0].stateInit
              ? loadStateInit(order.messages[0].stateInit.asSlice())
              : null;

            const body = order.messages[0].payload
              ? order.messages[0].payload
              : null;

            intMessage = internal({
              to: Address.parse(order.messages[0].target),
              value: 0n,
              init: internalStateInit,
              bounce: false,
              body,
            });

            const state: any = await backoff("transfer", () =>
              client.getAccount(
                block.last.seqno,
                Address.parse(order.messages[0].target)
              )
            );
            storageStats = state.account.storageStat
              ? [state.account.storageStat]
              : [];

            if (order.messages[0].amountAll) {
              sendMode = SendMode.CARRY_ALL_REMAINING_BALANCE;
            }
          } else {
            const internalStateInit = !!stateInit
              ? loadStateInit(stateInit.asSlice())
              : null;

            const body = order.payload
              ? resolveLedgerPayload(order.payload)
              : comment(commentString);

            intMessage = internal({
              to: address,
              value: 0n,
              init: internalStateInit,
              bounce: false,
              body,
            });

            const state: any = await backoff("transfer", () =>
              client.getAccount(block.last.seqno, address)
            );
            storageStats = state.account.storageStat
              ? [state.account.storageStat]
              : [];
          }
        }

        // Load contract
        const pubKey = ledgerContext.addr?.publicKey ?? currentAcc.publicKey;
        const contract = contractFromPublicKey(
          pubKey,
          walletVersion,
          network.isTestnet
        );

        const transferParams = {
          seqno: seqno,
          secretKey: Buffer.alloc(64),
          sendMode,
          messages: [intMessage],
        };

        // Create transfer
        const transfer = isV5
          ? (contract as WalletContractV5R1).createTransfer(transferParams)
          : (contract as WalletContractV4).createTransfer(transferParams);

        if (ended) {
          return;
        }

        // Resolve fee
        if (config && accountLite && !supportsGaslessTransfer) {
          const externalMessage = external({
            to: contract.address,
            body: transfer,
            init: seqno === 0 ? contract.init : null,
          });

          const inMsg = new Cell().asBuilder();
          storeMessage(externalMessage)(inMsg);

          const outMsg = new Cell().asBuilder();
          storeMessageRelaxed(intMessage)(outMsg);

          const local = estimateFees(
            config,
            inMsg.endCell(),
            [outMsg.endCell()],
            storageStats
          );
          setEstimation(local);
        } else {
          setEstimation(null);
        }
      });
    });
    return () => {
      ended = true;
    };
  }, [
    order,
    accountLite,
    client,
    config,
    commentString,
    ledgerAddress,
    walletVersion,
    supportsGaslessTransfer,
    jettonPayload,
  ]);

  return estimation;
};
