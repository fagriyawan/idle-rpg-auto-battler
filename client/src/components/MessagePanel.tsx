import { useState, useEffect, useCallback } from 'react';
import { usePlayerData } from '../context/PlayerDataContext';
import * as messageApi from '../services/message-api';
import type { PlayerMessage } from '../services/message-api';
import styles from './MessagePanel.module.css';

const TOKEN_KEY = 'idle_rpg_token';

interface MessagePanelProps {
  onClose: () => void;
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getRewardIcon(rewardType: string | null): string {
  switch (rewardType) {
    case 'gold': return '🪙';
    case 'gems': return '💎';
    case 'energy': return '⚡';
    default: return '🎁';
  }
}

export default function MessagePanel({ onClose }: MessagePanelProps) {
  const { fetchProfile } = usePlayerData();
  const [messages, setMessages] = useState<PlayerMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const token = localStorage.getItem(TOKEN_KEY);

  const loadMessages = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await messageApi.getMessages(token);
      setMessages(data.messages);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleClaim = async (messageId: string) => {
    if (!token || claimingId) return;
    setClaimingId(messageId);
    try {
      const updated = await messageApi.claimReward(token, messageId);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? updated : m))
      );
      // Refresh player resources after claiming
      await fetchProfile();
    } catch (err) {
      console.error('Failed to claim reward:', err);
    } finally {
      setClaimingId(null);
    }
  };

  const handleRead = async (messageId: string) => {
    if (!token) return;
    try {
      const updated = await messageApi.markAsRead(token, messageId);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? updated : m))
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.title}>📬 Messages</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Message List */}
        {isLoading ? (
          <div className={styles.loading}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className={styles.emptyState}>No messages yet</div>
        ) : (
          <div className={styles.messageList}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.messageItem} ${!msg.read ? styles.messageUnread : ''}`}
                onClick={() => !msg.read && handleRead(msg.id)}
              >
                <div className={styles.messageHeader}>
                  <span className={styles.messageSender}>{msg.sender}</span>
                  <span className={styles.messageDate}>{formatDate(msg.createdAt)}</span>
                </div>
                <div className={styles.messageTitle}>{msg.title}</div>
                <div className={styles.messageBody}>{msg.body}</div>

                {/* Reward section */}
                {msg.rewardType && msg.rewardAmount > 0 && (
                  <>
                    <div className={`${styles.rewardBadge} ${msg.claimed ? styles.rewardClaimed : ''}`}>
                      <span>{getRewardIcon(msg.rewardType)}</span>
                      <span>{msg.rewardAmount.toLocaleString()} {msg.rewardType}</span>
                    </div>

                    {msg.claimed ? (
                      <div className={styles.claimedText}>✓ Claimed</div>
                    ) : (
                      <button
                        className={styles.claimBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClaim(msg.id);
                        }}
                        disabled={claimingId === msg.id}
                      >
                        {claimingId === msg.id ? 'Claiming...' : 'Claim Reward'}
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
