import { Currency } from "../types/deposit";

export function getChainNameByChain(chain?: string): string {
  switch (chain) {
    case 'ethereum':
      return 'Ethereum';
    case 'tron':
      return 'TRON';
    case 'polygon':
      return 'Polygon';
    case 'solana':
      return 'Solana';
    case 'ton':
      return 'TON';
    case 'near':
      return 'NEAR';
    case 'avax':
      return 'Avalanche';
    case 'arbitrum':
      return 'Arbitrum';
    case 'optimism':
      return 'Optimism';
    case 'stellar':
      return 'Stellar';
    default:
      return '';
  }
}

export function getChainShortNameByChain(chain?: string | null): string {
  switch (chain) {
    case 'ethereum':
      return 'ERC-20';
    case 'tron':
      return 'TRC-20';
    case 'polygon':
      return 'POLYGON';
    case 'solana':
      return 'SOL';
    case 'ton':
      return 'TON';
    case 'near':
      return 'NEAR';
    case 'avax':
      return 'AVAX';
    case 'arbitrum':
      return 'ARB';
    case 'optimism':
      return 'OP';
    case 'stellar':
      return 'XLM';
    default:
      return '';
  }
}

export function getCoinInfoByCurrency(currency: Currency) {
  switch (currency) {
    case Currency.Ton:
      return {
        blockchain: 'ton',
        name: 'TON',
      };
    case Currency.UsdTon:
      return {
        blockchain: 'ton',
        name: 'USDT'
      };
    case Currency.UsdcSol:
      return {
        blockchain: 'solana',
        name: 'USDC'
      };
    case Currency.Sol:
      return {
        blockchain: 'solana',
        name: 'SOL'
      };
    default:
      return {
        blockchain: 'ton',
        name: 'TON'
      };
  }
}

export const KNOWN_TICKERS: { [key: string]: string } = {
  usdton: 'ton',
  usdt20: 'ether',
  usdc: 'ether',
  usdtrx: 'tron',
  usdcmatic: 'polygon',
  usdtpolygon: 'polygon',
  usdtsol: 'solana',
  usdcsol: 'solana',
  sol: 'solana',
  ton: 'ton',
};

export function getKnownCurrencyFromName(name: string): Currency | undefined {
  if (name.toLowerCase().includes('usdc')) {
    return Currency.UsdcSol;
  }
  if (name.toLowerCase().includes('usdt')) {
    return Currency.UsdTon;
  }
  if (name.toLowerCase() === 'sol') {
    return Currency.Sol;
  }
  if (name.toLowerCase() === 'ton') {
    return Currency.Ton;
  }
  return undefined;
}
