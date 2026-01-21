import { MMKV } from 'react-native-mmkv';

const errorLogsStorage = new MMKV({ id: 'error-logs' });

const ERROR_LOGS_KEY = 'error_logs';
const MAX_ERROR_LOGS = 50;

export interface ErrorLogEntry {
	id: string;
	timestamp: number;
	message: string;
	stack?: string;
	url?: string;
	additionalData?: Record<string, unknown>;
}

/**
 * Get all stored error logs
 */
export function getErrorLogs(): ErrorLogEntry[] {
	const logsJson = errorLogsStorage.getString(ERROR_LOGS_KEY);
	if (!logsJson) {
		return [];
	}
	try {
		return JSON.parse(logsJson);
	} catch {
		return [];
	}
}

/**
 * Save an error log entry (keeps max 50 entries, removes oldest if exceeded)
 */
export function saveErrorLog(entry: Omit<ErrorLogEntry, 'id' | 'timestamp'>): void {
	let logs = getErrorLogs();
	const newEntry: ErrorLogEntry = {
		...entry,
		id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
		timestamp: Date.now()
	};
	logs.push(newEntry);

	// Remove oldest entries if exceeded max limit
	if (logs.length > MAX_ERROR_LOGS) {
		logs = logs.slice(-MAX_ERROR_LOGS);
	}

	errorLogsStorage.set(ERROR_LOGS_KEY, JSON.stringify(logs));
}

/**
 * Delete a specific error log by id
 */
export function deleteErrorLog(id: string): void {
	const logs = getErrorLogs();
	const filtered = logs.filter((log) => log.id !== id);
	errorLogsStorage.set(ERROR_LOGS_KEY, JSON.stringify(filtered));
}

/**
 * Clear all error logs
 */
export function clearAllErrorLogs(): void {
	errorLogsStorage.delete(ERROR_LOGS_KEY);
}

/**
 * Get error logs count
 */
export function getErrorLogsCount(): number {
	return getErrorLogs().length;
}

