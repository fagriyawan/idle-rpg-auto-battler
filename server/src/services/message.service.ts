import * as messageRepository from "../repositories/message.repository";
import * as resourceRepository from "../repositories/resource.repository";
import { PlayerMessage } from "../repositories/message.repository";

export async function getMessages(playerId: string): Promise<PlayerMessage[]> {
  return messageRepository.getMessages(playerId);
}

export async function getUnreadCount(playerId: string): Promise<number> {
  return messageRepository.getUnreadCount(playerId);
}

export async function markAsRead(
  messageId: string,
  playerId: string
): Promise<PlayerMessage> {
  const message = await messageRepository.markAsRead(messageId, playerId);
  if (!message) {
    throw new Error("Message not found");
  }
  return message;
}

/**
 * Claims the reward attached to a message.
 * Awards the resource to the player and marks the message as claimed.
 */
export async function claimReward(
  messageId: string,
  playerId: string
): Promise<PlayerMessage> {
  // Get the message first to check it exists and has a reward
  const message = await messageRepository.getMessageById(messageId, playerId);
  if (!message) {
    throw new Error("Message not found");
  }
  if (message.claimed) {
    throw new Error("Reward already claimed");
  }
  if (!message.rewardType || message.rewardAmount <= 0) {
    throw new Error("No reward to claim");
  }

  // Award the resource
  const result = await resourceRepository.awardResource(
    playerId,
    message.rewardType,
    message.rewardAmount
  );
  if (!result) {
    throw new Error("Failed to award resource");
  }

  // Mark as claimed
  const claimed = await messageRepository.markAsClaimed(messageId, playerId);
  if (!claimed) {
    throw new Error("Failed to mark message as claimed");
  }

  return claimed;
}

export async function deleteMessage(
  messageId: string,
  playerId: string
): Promise<void> {
  const deleted = await messageRepository.deleteMessage(messageId, playerId);
  if (!deleted) {
    throw new Error("Message not found");
  }
}

/**
 * Sends the welcome gift message to a new player.
 * Called during player initialization.
 */
export async function sendWelcomeGift(playerId: string): Promise<PlayerMessage> {
  return messageRepository.createMessage(playerId, {
    sender: "Developer",
    title: "🎉 Welcome Gift!",
    body: "Welcome to Idle RPG Auto-Battler! Here's 3,000 Gems as a welcome gift from the Developer team. Enjoy your adventure!",
    rewardType: "gems",
    rewardAmount: 3000,
  });
}
