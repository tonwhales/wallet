import { useRoute } from "@react-navigation/native";

export function useParams<T extends {}>() {
    return (useRoute().params || {}) as T;
}