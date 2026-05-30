import { describe, it, expect, vi, beforeEach } from "vitest";
import { ethers } from "ethers";
import jwt from "jsonwebtoken";

// Mock the repositories
vi.mock("../repositories/nonce.repository", () => ({
  createNonce: vi.fn(),
  findValidNonce: vi.fn(),
  markNonceUsed: vi.fn(),
}));

vi.mock("../repositories/player.repository", () => ({
  findByWalletAddress: vi.fn(),
  createPlayer: vi.fn(),
  updateLastLogin: vi.fn(),
}));

vi.mock("../repositories/player-profile.repository", () => ({
  getProfile: vi.fn(),
  initializeProfile: vi.fn(),
  initializeResources: vi.fn(),
  getResourceBalances: vi.fn(),
}));

vi.mock("../services/player.service", () => ({
  initializeNewPlayer: vi.fn(),
}));

// Mock the config
vi.mock("../config", () => ({
  config: {
    JWT_SECRET: "test-secret-key-for-unit-tests",
    JWT_EXPIRATION: "24h",
  },
}));

import * as nonceRepository from "../repositories/nonce.repository";
import * as playerRepository from "../repositories/player.repository";
import * as playerProfileRepository from "../repositories/player-profile.repository";
import * as playerService from "../services/player.service";
import { generateNonce, verifySignature, validateToken } from "../services/auth.service";

const TEST_WALLET = "0x1234567890abcdef1234567890abcdef12345678";
const TEST_JWT_SECRET = "test-secret-key-for-unit-tests";

const mockPlayer = {
  id: "player-uuid-1",
  walletAddress: TEST_WALLET.toLowerCase(),
  createdAt: new Date("2024-01-01"),
  lastLoginAt: new Date("2024-01-01"),
};

describe("Auth Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateNonce", () => {
    it("should generate a nonce and return it with a sign message", async () => {
      vi.mocked(nonceRepository.createNonce).mockResolvedValue({
        id: "nonce-uuid-1",
        walletAddress: TEST_WALLET.toLowerCase(),
        nonce: "abc123",
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        used: false,
      });

      const result = await generateNonce(TEST_WALLET);

      expect(result.nonce).toBeDefined();
      expect(result.nonce).toHaveLength(64); // 32 bytes hex = 64 chars
      expect(result.message).toContain("Sign this message to authenticate with Idle RPG");
      expect(result.message).toContain(TEST_WALLET);
      expect(result.message).toContain(result.nonce);
      expect(nonceRepository.createNonce).toHaveBeenCalledWith(
        TEST_WALLET,
        expect.any(String),
        expect.any(Date)
      );
    });

    it("should set nonce expiry to 5 minutes from now", async () => {
      vi.mocked(nonceRepository.createNonce).mockResolvedValue({
        id: "nonce-uuid-1",
        walletAddress: TEST_WALLET.toLowerCase(),
        nonce: "abc123",
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        used: false,
      });

      const before = Date.now();
      await generateNonce(TEST_WALLET);
      const after = Date.now();

      const call = vi.mocked(nonceRepository.createNonce).mock.calls[0];
      const expiresAt = call[2] as Date;
      const expectedMin = before + 5 * 60 * 1000;
      const expectedMax = after + 5 * 60 * 1000;

      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin);
      expect(expiresAt.getTime()).toBeLessThanOrEqual(expectedMax);
    });
  });

  describe("verifySignature", () => {
    it("should verify a valid signature and return a token with player", async () => {
      // Create a real wallet and sign a message
      const wallet = ethers.Wallet.createRandom();
      const walletAddress = wallet.address;
      const nonce = "a".repeat(64);
      const createdAt = new Date();

      const message = `Sign this message to authenticate with Idle RPG.\n\nWallet: ${walletAddress}\nNonce: ${nonce}`;
      const signature = await wallet.signMessage(message);

      const player = {
        id: "player-uuid-1",
        walletAddress: walletAddress.toLowerCase(),
        createdAt: new Date("2024-01-01"),
        lastLoginAt: new Date("2024-01-01"),
      };

      vi.mocked(nonceRepository.findValidNonce).mockResolvedValue({
        id: "nonce-uuid-1",
        walletAddress: walletAddress.toLowerCase(),
        nonce,
        createdAt,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        used: false,
      });
      vi.mocked(nonceRepository.markNonceUsed).mockResolvedValue(undefined);
      vi.mocked(playerRepository.findByWalletAddress).mockResolvedValue(player);
      vi.mocked(playerRepository.updateLastLogin).mockResolvedValue(undefined);
      // Player already initialized — has a display name
      vi.mocked(playerProfileRepository.getProfile).mockResolvedValue({
        id: player.id,
        walletAddress: player.walletAddress,
        displayName: "Player_1234ab",
        level: 1,
        experience: 0,
        experienceToNextLevel: 100,
        resources: { gold: 500, gems: 50, energy: 100 },
        createdAt: "2024-01-01T00:00:00.000Z",
        lastLoginAt: "2024-01-01T00:00:00.000Z",
      });

      const result = await verifySignature(walletAddress, signature, nonce);

      expect(result.token).toBeDefined();
      expect(result.player).toEqual(player);

      // Verify the JWT contains correct payload
      const decoded = jwt.verify(result.token, TEST_JWT_SECRET) as {
        playerId: string;
        walletAddress: string;
      };
      expect(decoded.playerId).toBe(player.id);
      expect(decoded.walletAddress).toBe(player.walletAddress);

      expect(nonceRepository.markNonceUsed).toHaveBeenCalledWith(nonce);
      expect(playerRepository.updateLastLogin).toHaveBeenCalledWith(walletAddress);
      // Should NOT call initializeNewPlayer since player is already initialized
      expect(playerService.initializeNewPlayer).not.toHaveBeenCalled();
    });

    it("should create a new player if one does not exist", async () => {
      const wallet = ethers.Wallet.createRandom();
      const walletAddress = wallet.address;
      const nonce = "b".repeat(64);
      const createdAt = new Date();

      const message = `Sign this message to authenticate with Idle RPG.\n\nWallet: ${walletAddress}\nNonce: ${nonce}`;
      const signature = await wallet.signMessage(message);

      const newPlayer = {
        id: "new-player-uuid",
        walletAddress: walletAddress.toLowerCase(),
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      vi.mocked(nonceRepository.findValidNonce).mockResolvedValue({
        id: "nonce-uuid-2",
        walletAddress: walletAddress.toLowerCase(),
        nonce,
        createdAt,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        used: false,
      });
      vi.mocked(nonceRepository.markNonceUsed).mockResolvedValue(undefined);
      vi.mocked(playerRepository.findByWalletAddress).mockResolvedValue(null);
      vi.mocked(playerRepository.createPlayer).mockResolvedValue(newPlayer);
      vi.mocked(playerRepository.updateLastLogin).mockResolvedValue(undefined);
      // New player — no profile exists yet (displayName is null)
      vi.mocked(playerProfileRepository.getProfile).mockResolvedValue({
        id: newPlayer.id,
        walletAddress: newPlayer.walletAddress,
        displayName: null,
        level: 1,
        experience: 0,
        experienceToNextLevel: 100,
        resources: { gold: 0, gems: 0, energy: 0 },
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      });
      vi.mocked(playerService.initializeNewPlayer).mockResolvedValue(null);

      const result = await verifySignature(walletAddress, signature, nonce);

      expect(result.player).toEqual(newPlayer);
      expect(playerRepository.createPlayer).toHaveBeenCalledWith(walletAddress);
      // Should call initializeNewPlayer since displayName is null
      expect(playerService.initializeNewPlayer).toHaveBeenCalledWith(
        newPlayer.id,
        newPlayer.walletAddress
      );
    });

    it("should throw an error for an invalid or expired nonce", async () => {
      vi.mocked(nonceRepository.findValidNonce).mockResolvedValue(null);

      await expect(
        verifySignature(TEST_WALLET, "0xfakesignature", "invalid-nonce")
      ).rejects.toThrow("Invalid or expired nonce");
    });

    it("should throw an error for an invalid signature", async () => {
      const nonce = "c".repeat(64);
      const createdAt = new Date();

      vi.mocked(nonceRepository.findValidNonce).mockResolvedValue({
        id: "nonce-uuid-3",
        walletAddress: TEST_WALLET.toLowerCase(),
        nonce,
        createdAt,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        used: false,
      });

      // Sign with a different wallet than the one claiming to authenticate
      const differentWallet = ethers.Wallet.createRandom();
      const message = `Sign this message to authenticate with Idle RPG.\n\nWallet: ${TEST_WALLET}\nNonce: ${nonce}`;
      const signature = await differentWallet.signMessage(message);

      await expect(
        verifySignature(TEST_WALLET, signature, nonce)
      ).rejects.toThrow("Invalid signature");
    });
  });

  describe("validateToken", () => {
    it("should validate a valid JWT and return the player", async () => {
      const token = jwt.sign(
        { playerId: mockPlayer.id, walletAddress: mockPlayer.walletAddress },
        TEST_JWT_SECRET,
        { expiresIn: "24h" }
      );

      vi.mocked(playerRepository.findByWalletAddress).mockResolvedValue(mockPlayer);

      const result = await validateToken(token);

      expect(result).toEqual(mockPlayer);
      expect(playerRepository.findByWalletAddress).toHaveBeenCalledWith(
        mockPlayer.walletAddress
      );
    });

    it("should throw an error for an expired token", async () => {
      const token = jwt.sign(
        { playerId: mockPlayer.id, walletAddress: mockPlayer.walletAddress },
        TEST_JWT_SECRET,
        { expiresIn: "-1s" } // Already expired
      );

      await expect(validateToken(token)).rejects.toThrow();
    });

    it("should throw an error for a token signed with wrong secret", async () => {
      const token = jwt.sign(
        { playerId: mockPlayer.id, walletAddress: mockPlayer.walletAddress },
        "wrong-secret",
        { expiresIn: "24h" }
      );

      await expect(validateToken(token)).rejects.toThrow();
    });

    it("should throw an error if player is not found", async () => {
      const token = jwt.sign(
        { playerId: "nonexistent", walletAddress: "0xnonexistent" },
        TEST_JWT_SECRET,
        { expiresIn: "24h" }
      );

      vi.mocked(playerRepository.findByWalletAddress).mockResolvedValue(null);

      await expect(validateToken(token)).rejects.toThrow("Player not found");
    });
  });
});
