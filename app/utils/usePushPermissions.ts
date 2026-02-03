import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';

export function usePushPermissions() {
	const [pushPemissions, setPushPemissions] =
		useState<Notifications.NotificationPermissionsStatus | null>(null);
	useEffect(() => {
		(async () => {
			const permissions = await Notifications.getPermissionsAsync();
			setPushPemissions(permissions);
		})();
	}, []);
	return pushPemissions;
}
