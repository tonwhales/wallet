import { storage } from '../../storage/storage';
import { getCurrentAddress } from '../../storage/appState';
import { z } from 'zod';

const lastReturnStrategyKey = 'connectLastReturnStrategy';
const lastRetirnStrategyCodec = z.object({
  at: z.number(),
  strategy: z.string(),
});

export function setLastReturnStrategy(returnStrategy: string) {
  storage.set(lastReturnStrategyKey, JSON.stringify({ at: Date.now(), strategy: returnStrategy }));
}

export function clearLastReturnStrategy() {
  storage.delete(lastReturnStrategyKey);
}

export function getLastReturnStrategy() {
  const stored = storage.getString(lastReturnStrategyKey);

  if (!stored) {
    return null;
  }

  const parsed = lastRetirnStrategyCodec.safeParse(JSON.parse(stored));

  if (parsed.success) {

    if (Date.now() - parsed.data.at > 1000 * 60 * 1) {
      return null;
    }

    return parsed.data.strategy;
  }

  return null;
}

export function setLastEventId(lastEventId: string) {
  const selected = getCurrentAddress().addressString;
  storage.set(`${selected}/connect_last_event_id`, lastEventId);
}

export function getLastEventId() {
  const selected = getCurrentAddress().addressString;
  return storage.getString(`${selected}/connect_last_event_id`);
}