import { useEffect, useState, useRef } from 'react';
import { Application } from 'pixi.js';
import { Spine } from 'pixi-spine';
import { loadSpineAsset } from '../utils/spine/spine-asset-loader';
import type { SpineAssetConfig, SpineLoadError } from '../utils/spine/spine-asset-loader';

export type LoadingState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; spine: Spine; animationName: string }
  | { status: 'error'; error: SpineLoadError };

/**
 * Hook that orchestrates Spine asset loading and manages the loading state machine.
 *
 * - Creates AbortController for cancellation on unmount/prop change
 * - On success: adds Spine to app.stage, starts animation loop
 * - On error: returns typed error for the component to display fallback
 * - On prop change: aborts previous load, disposes old Spine, starts new load
 */
export function useSpineLoader(
  app: Application | null,
  config: SpineAssetConfig | null
): LoadingState {
  const [state, setState] = useState<LoadingState>({ status: 'idle' });
  const spineRef = useRef<Spine | null>(null);

  useEffect(() => {
    if (!app || !config || (!config.jsonUrl && !config.skelUrl)) {
      setState({ status: 'idle' });
      return;
    }

    const abortController = new AbortController();
    setState({ status: 'loading' });

    // Dispose previous spine if exists
    if (spineRef.current) {
      app.stage.removeChild(spineRef.current);
      spineRef.current.destroy();
      spineRef.current = null;
    }

    loadSpineAsset(config, abortController.signal)
      .then(({ spine, animationName }) => {
        if (abortController.signal.aborted) return;

        // Disable autoUpdate — we'll use a safe wrapper
        spine.autoUpdate = false;

        // Set skin
        try {
          spine.skeleton.setSkinByName('default');
          spine.skeleton.setSlotsToSetupPose();
        } catch { /* ignore */ }

        // Add to stage
        app.stage.addChild(spine);
        spineRef.current = spine;

        // Start animation
        if (animationName) {
          try {
            spine.state.setAnimation(0, animationName, true);
          } catch (e) {
            console.warn('[SpineLoader] Animation setup failed:', animationName, e);
          }
        }

        // Create a safe update wrapper that catches mesh errors
        // Spine expects delta time in seconds, but Pixi ticker gives delta in frames (1 = 1/60s at 60fps)
        const safeUpdate = () => {
          try {
            // Use fixed time step: 1/30 second (matching our 30fps cap)
            const dt = 1 / 30;
            spine.update(dt);
          } catch {
            // MeshAttachment.computeWorldVertices can fail for some skeletons
          }
        };

        // Add safe update to ticker instead of relying on autoUpdate
        app.ticker.add(safeUpdate);

        // Start the ticker
        app.start();

        console.log(`[SpineLoader] Loaded: ${config.skelUrl || config.jsonUrl}`, {
          animationName,
          bones: spine.skeleton?.data?.bones?.length,
          slots: spine.skeleton?.data?.slots?.length,
        });

        setState({ status: 'ready', spine, animationName });
      })
      .catch((err) => {
        if (abortController.signal.aborted) return;

        console.error('[SpineLoader] Load failed:', config.skelUrl || config.jsonUrl, err);

        const error: SpineLoadError = (err as SpineLoadError).type
          ? (err as SpineLoadError)
          : { type: 'parse', message: err instanceof Error ? err.message : String(err) };

        setState({ status: 'error', error });
      });

    return () => {
      abortController.abort();
      // Cleanup spine from stage on unmount or config change
      if (spineRef.current && app.stage) {
        app.stage.removeChild(spineRef.current);
        spineRef.current.destroy();
        spineRef.current = null;
      }
    };
  }, [app, config?.jsonUrl, config?.skelUrl, config?.atlasUrl, config?.animation]);

  return state;
}
