import { useRoute } from "@react-navigation/native";

export function useIsLedgerRoute() {
    const route = useRoute();
    return route.name.startsWith('Ledger');
}
