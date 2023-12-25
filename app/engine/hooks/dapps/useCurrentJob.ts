import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { getAppInstanceKeyPair } from "../../../storage/appState";
import axios from "axios";
import { Address, Cell } from "@ton/core";
import { queryClient } from "../../clients";
import { z } from 'zod';
import { parseJob } from '../../apps/parseJob';
import { useNetwork, useSelectedAccount } from "..";
import { useMemo } from "react";

export type Job = {
    type: 'transaction',
    target: Address,
    amount: bigint,
    text: string,
    payload: Cell | null,
    stateInit: Cell | null,
} | {
    type: 'sign',
    text: string,
    textCell: Cell
    payloadCell: Cell
}

export type ParsedJob = {
    expires: number;
    key: Buffer;
    appPublicKey: Buffer;
    job: Job;
    jobCell: Cell;
    jobRaw: string;
}

const jobResponseCodec = z.union([
    z.object({
        state: z.union([z.literal('submitted'), z.literal('expired'), z.literal('completed'), z.literal('rejected')]),
        job: z.string(),
        result: z.union([z.string(), z.null()]),
        created: z.number(),
        updated: z.number(),
        now: z.number(),
    }),
    z.object({
        state: z.literal('empty'),
        now: z.number(),
    })
]);

export async function fetchJob(): Promise<string | null> {
    let keypair = await getAppInstanceKeyPair();
    let key = keypair.publicKey.toString('base64').replace(/\//g, '_')
        .replace(/\+/g, '-')
        .replace(/\=/g, '');
    let res = await axios.get('https://connect.tonhubapi.com/connect/command/' + key);

    if (res.status !== 200) {
        return null;
    }

    const parsed = jobResponseCodec.safeParse(res.data);
    if (!parsed.success) {
        return null;
    }

    if (res.data.state !== 'submitted') {
        return null;
    }

    return res.data.job;
}

export function useCurrentJob(): [ParsedJob | null, (job: ParsedJob | null) => void] {
    let { isTestnet } = useNetwork();
    let selected = useSelectedAccount();

    let addressString = useMemo(() => {
        if (!selected?.address) {
            return '';
        }
        if (selected.address instanceof Address) {
            return selected.address.toString({ testOnly: isTestnet });
        }
        return '';
    }, [selected, isTestnet]);

    const query = useQuery({
        queryKey: Queries.Job(addressString),
        queryFn: fetchJob,
        refetchInterval: 1000 * 5,
    });

    const update = (job: ParsedJob | null) => {
        queryClient.setQueryData(Queries.Job(addressString), job?.jobRaw || null);
    }

    if (!query.data) {
        return [null, update];
    }
    let jobCell = Cell.fromBoc(Buffer.from(query.data, 'base64'))[0];
    let parsed = parseJob(jobCell.beginParse());
    if (!parsed) {
        return [null, update];
    }

    return [{ ...parsed, jobCell, jobRaw: query.data }, update]
}