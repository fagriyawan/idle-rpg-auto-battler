import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isMetaMaskInstalled,
  connectMetaMask,
  getWalletAddress,
  onAccountChanged,
  onChainChanged,
} from '../services/wallet';

function createMockEthereum() {
  return {
    isMetaMask: true,
    request: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
  };
}

describe('wallet service', () => {
  let originalEthereum: typeof window.ethereum;

  beforeEach(() => {
    originalEthereum = window.ethereum;
  });

  afterEach(() => {
    window.ethereum = originalEthereum;
  });

  describe('isMetaMaskInstalled', () => {
    it('returns true when window.ethereum exists with isMetaMask=true', () => {
      window.ethereum = createMockEthereum();
      expect(isMetaMaskInstalled()).toBe(true);
    });

    it('returns false when window.ethereum is undefined', () => {
      window.ethereum = undefined;
      expect(isMetaMaskInstalled()).toBe(false);
    });

    it('returns false when isMetaMask is false', () => {
      window.ethereum = { ...createMockEthereum(), isMetaMask: false };
      expect(isMetaMaskInstalled()).toBe(false);
    });
  });

  describe('connectMetaMask', () => {
    it('returns the first address on successful connection', async () => {
      const mockEthereum = createMockEthereum();
      mockEthereum.request.mockResolvedValue(['0x1234abcd']);
      window.ethereum = mockEthereum;

      const address = await connectMetaMask();

      expect(address).toBe('0x1234abcd');
      expect(mockEthereum.request).toHaveBeenCalledWith({
        method: 'eth_requestAccounts',
      });
    });

    it('throws when MetaMask is not installed', async () => {
      window.ethereum = undefined;

      await expect(connectMetaMask()).rejects.toThrow('MetaMask is not installed');
    });
  });

  describe('getWalletAddress', () => {
    it('returns the address when connected', async () => {
      const mockEthereum = createMockEthereum();
      mockEthereum.request.mockResolvedValue(['0xabcdef']);
      window.ethereum = mockEthereum;

      const address = await getWalletAddress();

      expect(address).toBe('0xabcdef');
      expect(mockEthereum.request).toHaveBeenCalledWith({
        method: 'eth_accounts',
      });
    });

    it('returns null when not connected (empty accounts)', async () => {
      const mockEthereum = createMockEthereum();
      mockEthereum.request.mockResolvedValue([]);
      window.ethereum = mockEthereum;

      const address = await getWalletAddress();

      expect(address).toBeNull();
    });

    it('returns null when MetaMask is not installed', async () => {
      window.ethereum = undefined;

      const address = await getWalletAddress();

      expect(address).toBeNull();
    });
  });

  describe('onAccountChanged', () => {
    it('registers the accountsChanged event listener', () => {
      const mockEthereum = createMockEthereum();
      window.ethereum = mockEthereum;
      const callback = vi.fn();

      onAccountChanged(callback);

      expect(mockEthereum.on).toHaveBeenCalledWith('accountsChanged', callback);
    });
  });

  describe('onChainChanged', () => {
    it('registers the chainChanged event listener', () => {
      const mockEthereum = createMockEthereum();
      window.ethereum = mockEthereum;
      const callback = vi.fn();

      onChainChanged(callback);

      expect(mockEthereum.on).toHaveBeenCalledWith('chainChanged', callback);
    });
  });
});
