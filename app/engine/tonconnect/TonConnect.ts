import { AppRequest, ConnectEvent, ConnectRequest, DeviceInfo, RpcMethod, SendTransactionRpcResponseError, SEND_TRANSACTION_ERROR_CODES, WalletResponse, } from '@tonconnect/protocol';
import { MIN_PROTOCOL_VERSION } from './config';

export function checkProtocolVersionCapability(protocolVersion: number) {
  if (typeof protocolVersion !== 'number' || protocolVersion < MIN_PROTOCOL_VERSION) {
    throw new Error(`Protocol version ${String(protocolVersion)} is not supported by the wallet app`);
  }
}

export function verifyConnectRequest(request: ConnectRequest) {
  if (!(request && request.manifestUrl && request.items?.length)) {
    throw new Error('Wrong request data');
  }
}

export class SendTransactionError implements SendTransactionRpcResponseError {
  id: SendTransactionRpcResponseError['id'];
  error: SendTransactionRpcResponseError['error'];

  constructor(
    requestId: string,
    code: SEND_TRANSACTION_ERROR_CODES,
    message: string,
    data?: any,
  ) {
    this.id = requestId;
    this.error = {
      code,
      message,
      data,
    };
  }
}

export interface TonConnectInjectedBridge {
  deviceInfo: DeviceInfo;
  protocolVersion: number;
  isWalletBrowser: boolean;
  connect(
    protocolVersion: number,
    message: ConnectRequest,
    auto: boolean,
  ): Promise<ConnectEvent>;
  restoreConnection(): Promise<ConnectEvent>;
  disconnect(): Promise<void>;
  send<T extends RpcMethod>(message: AppRequest<T>): Promise<WalletResponse<T>>;
}
