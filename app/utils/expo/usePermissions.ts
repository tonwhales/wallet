import { getPermissionsAsync, NotificationPermissionsStatus, IosAuthorizationStatus } from "expo-notifications";
import { useEffect, useState } from "react";

export function usePermissions() {
    const [permissions, setPermissions] = useState<NotificationPermissionsStatus | null>(null);

    useEffect(() => {
        (async () => {
            const permissions = await getPermissionsAsync();
            setPermissions(permissions);
        })();
    }, []);

    return permissions?.granted || permissions?.ios?.status === IosAuthorizationStatus.PROVISIONAL;
}