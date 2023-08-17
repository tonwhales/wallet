import { AppRequest, RpcMethod, SessionCrypto, } from '@tonconnect/protocol';
import { storage } from '../../storage/storage';
import { createLogger, warn } from '../../utils/log';
import { Engine } from '../Engine';
import { bridgeUrl } from '../products/ConnectProduct';
import { ConnectedAppConnection, ConnectedAppConnectionRemote, TonConnectBridgeType } from './types';
import EventSource, { MessageEvent } from 'react-native-sse';

export class TonConnectBridgeClient {
  readonly engine: Engine;
  private eventSource: EventSource | null = null;
  protected connections: ConnectedAppConnectionRemote[] = [];
  protected logger = createLogger('tonconnect');
  protected activeRequests: { [from: string]: AppRequest<RpcMethod> } = {};

  constructor(engine: Engine) {
    this.engine = engine;
  }

  // 
  // Events
  // 

  protected async setLastEventId(lastEventId: string) {
    storage.set('connect_last_event_id', lastEventId);
  }

  protected async getLastEventId() {
    return storage.getString('connect_last_event_id');
  }

  // 
  // Event subscription
  // 

  close() {
    if (this.eventSource) {
      this.eventSource.removeAllEventListeners();
      this.eventSource.close();
      this.eventSource = null;

      this.logger.log('sse close');
    }
  }

  async open(connections: ConnectedAppConnection[]) {
    // Clear old connections
    this.close();

    this.connections = connections.filter((item) => item.type === TonConnectBridgeType.Remote) as ConnectedAppConnectionRemote[];

    if (this.connections.length === 0) {
      return;
    }

    const walletSessionIds = this.connections.map((item) => new SessionCrypto(item.sessionKeyPair).sessionId).join(',');
    let url = `${bridgeUrl}/events?client_id=${walletSessionIds}`;
    const lastEventId = await this.getLastEventId();

    if (lastEventId) {
      url += `&last_event_id=${lastEventId}`;
    }

    this.eventSource = new EventSource(url);

    this.eventSource.addEventListener(
      'message',
      (event) => {
        this.handleMessage(event as MessageEvent);
      }
    );

    this.eventSource.addEventListener('open', () => {
      this.logger.log('sse connect: opened');
    });

    this.eventSource.addEventListener('close', () => {
      this.logger.log('sse connect: closed');
    });

    this.eventSource.addEventListener('error', (event) => {
      warn('sse connect: error' + JSON.stringify(event));
    });
  }

  //
  // Event handling (should be overriden in child classes)
  //

  protected async handleMessage(event: MessageEvent) {
    this.logger.log(`sse connect message: type ${event}`);
  }
}
