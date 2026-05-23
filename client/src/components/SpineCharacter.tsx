import { useEffect, useRef } from 'react';
import { SpinePlayer } from '@esotericsoftware/spine-player';
import '@esotericsoftware/spine-player/dist/spine-player.css';

interface SpineCharacterProps {
  jsonUrl?: string;
  skelUrl?: string;
  atlasUrl: string;
  animation?: string;
  width?: number;
  height?: number;
}

export default function SpineCharacter({
  jsonUrl,
  skelUrl,
  atlasUrl,
  animation = 'Idle',
  width = 120,
  height = 120,
}: SpineCharacterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<SpinePlayer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous player
    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }

    // Clear container
    containerRef.current.innerHTML = '';

    try {
      const config: Record<string, unknown> = {
        atlasUrl,
        animation,
        premultipliedAlpha: true,
        backgroundColor: '#00000000',
        alpha: true,
        showControls: false,
        showLoading: false,
        success: (player: SpinePlayer) => {
          player.animationState.setAnimation(0, animation, true);
        },
        error: (_player: SpinePlayer, msg: string) => {
          console.warn('Spine load error:', msg);
        },
      };

      if (skelUrl) {
        config.skelUrl = skelUrl;
      } else if (jsonUrl) {
        config.jsonUrl = jsonUrl;
      }

      const player = new SpinePlayer(containerRef.current, config as any);
      playerRef.current = player;
    } catch (err) {
      console.warn('Failed to create SpinePlayer:', err);
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [jsonUrl, skelUrl, atlasUrl, animation]);

  return (
    <div
      ref={containerRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        overflow: 'hidden',
      }}
    />
  );
}
