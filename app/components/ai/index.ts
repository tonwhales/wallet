// AI Chat Components and Hooks
export { AIChatComponent } from './AIChatComponent';
export type { AIChatComponentProps } from './AIChatComponent';

// Socket.IO AI Chat
export { createAIChatSocket } from '../../engine/ai/socket';
export type {
    AIChatSocket,
    ServerToClientEvents,
    ClientToServerEvents
} from '../../engine/ai/socket';

// Socket.IO AI Chat Hook
export { useAIChatSocket } from '../../engine/hooks/useAIChatSocket';
export type {
    UseAIChatSocketOptions,
    UseAIChatSocketResult,
    AIChatMessage
} from '../../engine/hooks/useAIChatSocket';
