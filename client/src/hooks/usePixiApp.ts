import { useEffect, useState, type RefObject } from 'react';
import { Application } from 'pixi.js';

export interface UsePixiAppOptions {
  onContextLost?: () => void;
  onContextRestored?: () => void;
}

/**
 * Hook that creates and manages a PixiJS Application lifecycle.
 * Creates a transparent canvas sized to the specified dimensions.
 * Properly destroys the application and releases GPU resources on cleanup.
 *
 * Handles WebGL context loss/restore events on the canvas:
 * - Prevents default on context loss to allow recovery
 * - Invokes optional callbacks so parent components can react
 *
 * Compatible with React 19 strict mode (handles double-mount/unmount).
 */
export function usePixiApp(
  containerRef: RefObject<HTMLDivElement | null>,
  width: number,
  height: number,
  options?: UsePixiAppOptions
): Application | null {
  const [app, setApp] = useState<Application | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const pixiApp = new Application({
      width,
      height,
      backgroundAlpha: 0,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
      autoStart: false, // Don't start rendering until spine is added
    });

    // Limit to 30fps — sufficient for idle animations
    pixiApp.ticker.maxFPS = 30;

    const canvas = pixiApp.view as HTMLCanvasElement;
    container.appendChild(canvas);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      options?.onContextLost?.();
    };

    const handleContextRestored = () => {
      options?.onContextRestored?.();
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    setApp(pixiApp);

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      setApp(null);
      // Destroy the PixiJS app and its resources
      // NOTE: Do NOT clear the global textureCache here — other SpineRenderers
      // may still be using shared textures. The texture cache uses reference
      // counting and handles cleanup via release() in the spine loader.
      pixiApp.destroy(true, { children: true, texture: false, baseTexture: false });
    };
  }, [containerRef, width, height]);

  return app;
}
