import crypto from "crypto";
import jwt from "jsonwebtoken";
import { ethers } from "ethers";
import { config } from "../config";
import * as nonceRepository from "../repositories/nonce.repository";
import * as playerRepository from "../repositories/player.repository";
import * as playerProfileRepository from "../repositories/player-profile.repository";
import * as playerService from "./player.service";
import { NonceResponse, AuthResponse, Player } from "../types";

const NONCE_EXPIRY_MINUTES = 5;

function buildSignMessage(walletAddress: string, nonce: string): string {
  return `Sign this message to authenticate with Idle RPG.\n\nWallet: ${walletAddress}\nNonce: ${nonce}`;
}

export async function generateNonce(walletAddress: string): Promise<NonceResponse> {
  const nonce = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + NONCE_EXPIRY_MINUTES * 60 * 1000);

  await nonceRepository.createNonce(walletAddress, nonce, expiresAt);

  const message = buildSignMessage(walletAddress, nonce);

  return { nonce, message };
}

export async function verifySignature(
  walletAddress: string,
  signature: string,
  nonce: string
): Promise<AuthResponse> {
  const nonceRecord = await nonceRepository.findValidNonce(nonce);
  if (!nonceRecord) {
    throw new Error("Invalid or expired nonce");
  }

  const message = buildSignMessage(walletAddress, nonce);

  const recoveredAddress = ethers.verifyMessage(message, signature);

  if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
    throw new Error("Invalid signature");
  }

  await nonceRepository.markNonceUsed(nonce);

  let player = await playerRepository.findByWalletAddress(walletAddress);
  if (!player) {
    player = await playerRepository.createPlayer(walletAddress);
  }

  // Initialize player profile, resources, and starter heroes if not already done.
  // Check if the player has a profile (display_name set) — if not, they haven't been initialized.
  const existingProfile = await playerProfileRepository.getProfile(player.id);
  if (!existingProfile || existingProfile.displayName === null) {
    await playerService.initializeNewPlayer(player.id, player.walletAddress);
  }

  await playerRepository.updateLastLogin(walletAddress);

  const token = jwt.sign(
    { playerId: player.id, walletAddress: player.walletAddress },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRATION }
  );

  return { token, player };
}

export async function validateToken(token: string): Promise<Player> {
  const payload = jwt.verify(token, config.JWT_SECRET) as {
    playerId: string;
    walletAddress: string;
  };

  const player = await playerRepository.findByWalletAddress(payload.walletAddress);
  if (!player) {
    throw new Error("Player not found");
  }

  return player;
}
