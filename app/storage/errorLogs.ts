import { MMKV } from 'react-native-mmkv';
import { sanitizeErrorData } from '../fragments/secure/utils/sanitizeErrorData';

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
 * Recursively sanitize all string values in an object
 */
function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const key of Object.keys(obj)) {
		const value = obj[key];
		if (typeof value === 'string') {
			result[key] = sanitizeErrorData(value);
		} else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
			result[key] = sanitizeObject(value as Record<string, unknown>);
		} else if (Array.isArray(value)) {
			result[key] = value.map(item =>
				typeof item === 'string'
					? sanitizeErrorData(item)
					: (item !== null && typeof item === 'object' ? sanitizeObject(item as Record<string, unknown>) : item)
			);
		} else {
			result[key] = value;
		}
	}
	return result;
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
 * All string fields are sanitized to remove sensitive data (hex strings, base58, seed phrases)
 */
export function saveErrorLog(entry: Omit<ErrorLogEntry, 'id' | 'timestamp'>): void {
	let logs = getErrorLogs();

	// Sanitize all string fields
	const sanitizedEntry: ErrorLogEntry = {
		message: sanitizeErrorData(entry.message),
		stack: entry.stack ? sanitizeErrorData(entry.stack) : undefined,
		url: entry.url ? sanitizeErrorData(entry.url) : undefined,
		additionalData: entry.additionalData ? sanitizeObject(entry.additionalData) : undefined,
		id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
		timestamp: Date.now()
	};

	logs.push(sanitizedEntry);

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

