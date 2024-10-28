import { Address } from "@ton/core";
import { queryClient } from "../clients";
import { Queries } from "../queries";

export async function onHoldersInvalidate(account: string, isTestnet: boolean) {
    let address = Address.parse(account).toString({ testOnly: isTestnet });
    await queryClient.invalidateQueries({ queryKey: Queries.Holders(address).All() });
}