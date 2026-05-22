import { BrowserProvider } from 'ethers';

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

/**
 * Checks if MetaMask is installed in the browser.
 */
export function isMetaMaskInstalled(): boolean {
  return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask === true;
}

/**
 * Requests wallet connection via MetaMask (eth_requestAccounts).
 * Returns the first connected address.
 */
export async function connectMetaMask(): Promise<string> {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }

  const accounts = (await window.ethereum!.request({
    method: 'eth_requestAccounts',
  })) as string[];

  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts returned from MetaMask');
  }

  return accounts[0];
}

/**
 * Gets the currently connected wallet address without prompting the user.
 * Returns null if no account is connected.
 */
export async function getWalletAddress(): Promise<string | null> {
  if (!isMetaMaskInstalled()) {
    return null;
  }

  const accounts = (await window.ethereum!.request({
    method: 'eth_accounts',
  })) as string[];

  if (!accounts || accounts.length === 0) {
    return null;
  }

  return accounts[0];
}

/**
 * Signs a message using MetaMask's personal_sign method via ethers.js BrowserProvider.
 */
export async function signMessage(message: string): Promise<string> {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }

  const provider = new BrowserProvider(window.ethereum!);
  const signer = await provider.getSigner();
  const signature = await signer.signMessage(message);

  return signature;
}

/**
 * Listens for account changes in MetaMask.
 */
export function onAccountChanged(callback: (accounts: string[]) => void): void {
  if (!isMetaMaskInstalled()) {
    return;
  }

  window.ethereum!.on('accountsChanged', callback as (...args: unknown[]) => void);
}

/**
 * Listens for chain/network changes in MetaMask.
 */
export function onChainChanged(callback: (chainId: string) => void): void {
  if (!isMetaMaskInstalled()) {
    return;
  }

  window.ethereum!.on('chainChanged', callback as (...args: unknown[]) => void);
}
