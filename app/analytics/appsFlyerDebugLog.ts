import { MMKV } from 'react-native-mmkv';

const afLogStorage = new MMKV({ id: 'appsflyer-debug' });

const LOG_KEY = 'af_debug_logs';
const MAX_ENTRIES = 200;

export interface AFLogEntry {
  ts: number;
  tag: string;
  msg: string;
  data?: unknown;
}

export function afLog(tag: string, msg: string, data?: unknown) {
  const entry: AFLogEntry = { ts: Date.now(), tag, msg, data };

  let logs: AFLogEntry[] = [];
  try {
    const raw = afLogStorage.getString(LOG_KEY);
    if (raw) logs = JSON.parse(raw);
  } catch { /* ignore */ }

  logs.push(entry);
  if (logs.length > MAX_ENTRIES) {
    logs = logs.slice(-MAX_ENTRIES);
  }

  afLogStorage.set(LOG_KEY, JSON.stringify(logs));
}

export function getAFLogs(): AFLogEntry[] {
  try {
    const raw = afLogStorage.getString(LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearAFLogs() {
  afLogStorage.delete(LOG_KEY);
}

export function getAFLogsText(): string {
  const logs = getAFLogs();
  if (logs.length === 0) return '(no logs)';

  return logs.map(e => {
    const time = new Date(e.ts).toISOString().slice(11, 23);
    const dataStr = e.data !== undefined
      ? '\n  ' + JSON.stringify(e.data, null, 2).replace(/\n/g, '\n  ')
      : '';
    return `[${time}] ${e.tag}: ${e.msg}${dataStr}`;
  }).join('\n\n');
}
