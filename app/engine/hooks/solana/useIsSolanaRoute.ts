import { useRoute } from "@react-navigation/native";

export function useIsSolanaRoute() {
    const route = useRoute();
    return route.name.startsWith('Solana');
}