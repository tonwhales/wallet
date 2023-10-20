import { Cell } from "@ton/core";
import { useCurrentJob } from "../../hooks/dapps/useCurrentJob";
import { backoff } from "../../../utils/time";
import axios from "axios";

export function useCommitCommand() {
    const [currentJob, update] = useCurrentJob();

    return async (success: boolean, job: string, result: Cell) => {
        if (currentJob?.jobRaw === job) {
            update(null);
        }
        // Notify
        await backoff('app', async () => {
            await axios.post('https://connect.tonhubapi.com/connect/command/commit', {
                successful: success,
                job,
                result: result.toBoc({ idx: false }).toString('base64')
            });
        });
        return true;
    }

}