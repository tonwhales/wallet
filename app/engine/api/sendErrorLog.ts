import * as Application from 'expo-application';
import { Platform } from 'react-native';
import axios from 'axios';
import { whalesConnectEndpoint } from '../clients';
import type { ErrorLogEntry } from '../../storage';

export async function sendErrorLog(error: ErrorLogEntry): Promise<boolean> {
	try {
		await axios.post(
			`${whalesConnectEndpoint}/client-error/report`,
			{
				message: error.message,
				stack: error.stack,
				url: error.url,
				platform: Platform.OS,
				appVersion: Application.nativeApplicationVersion,
				additionalData: {
					...error.additionalData,
					errorId: error.id,
					errorTimestamp: error.timestamp
				}
			}
		);
		return true;
	} catch {
		return false;
	}
}

