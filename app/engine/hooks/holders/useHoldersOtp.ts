import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { Address } from "@ton/core";
import { useMemo } from "react";
import { fetchPaymentOtp, InappOtp } from "../../api/holders/fetchPaymentOtp";
import { useHoldersAccountStatus } from "..";
import { HoldersUserState } from "../../api/holders/fetchUserState";

export function useHoldersOtp(address: string | Address | undefined, isTestnet: boolean): InappOtp | null | undefined {
    const addressString = useMemo(() => {
        if (address instanceof Address) {
            return address.toString({ testOnly: isTestnet });
        }
        return address;
    }, [address, isTestnet]);

    const status = useHoldersAccountStatus(address).data;

    const token = (
        !!status &&
        status.state === HoldersUserState.Ok
    ) ? status.token : null;

    const query = useQuery({
        queryKey: Queries.Holders(addressString!).OTP(),
        refetchOnMount: true,
        enabled: !!addressString && !!token,
        queryFn: () => fetchPaymentOtp(token!, isTestnet)
    });

    return query.data;
}