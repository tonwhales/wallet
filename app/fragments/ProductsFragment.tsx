import { Platform, View } from "react-native";
import { fragment } from "../fragment";
import { useParams } from "../utils/useParams";
import { CloseButton } from "../components/CloseButton";
import { useTypedNavigation } from "../utils/useTypedNavigation";

export const ProductsFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const { addNew } = useParams<{ addNew?: boolean }>();

    return (
        <View>
            <CloseButton style={{ position: 'absolute', top: 22, right: 16 }} />
        </View>
    );
});