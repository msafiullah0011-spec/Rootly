import { useEffect, useState } from 'react';
import * as Font from 'expo-font';
import {
  InterTight_500Medium,
  InterTight_600SemiBold,
  InterTight_700Bold,
  InterTight_800ExtraBold,
} from '@expo-google-fonts/inter-tight';

import { logger } from '@/lib/logger';
import { setBodyFontsLoaded } from './typography';

/**
 * General Sans is distributed by Fontshare and is not on npm, so the files have
 * to be downloaded into `assets/fonts/` manually (see CLAUDE.md). `require` of a
 * missing asset throws at bundle time, so we resolve them lazily inside a
 * try/catch — the app runs with the system font until the files land.
 */
function loadGeneralSans(): Record<string, number> | null {
  try {
    return {
      'GeneralSans-Regular': require('../../assets/fonts/GeneralSans-Regular.otf'),
      'GeneralSans-Medium': require('../../assets/fonts/GeneralSans-Medium.otf'),
      'GeneralSans-Semibold': require('../../assets/fonts/GeneralSans-Semibold.otf'),
      'GeneralSans-Bold': require('../../assets/fonts/GeneralSans-Bold.otf'),
    };
  } catch {
    return null;
  }
}

export interface AppFontsState {
  /** True once loading has settled — successfully or not. Never blocks forever. */
  ready: boolean;
  /** False when General Sans is absent and body text is using the system font. */
  hasBodyFonts: boolean;
}

/**
 * Loads both type families. Resolves `ready` even on failure: a missing font is
 * a cosmetic problem, and refusing to render the app would be worse.
 */
export function useAppFonts(): AppFontsState {
  const [state, setState] = useState<AppFontsState>({ ready: false, hasBodyFonts: false });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const generalSans = loadGeneralSans();

      try {
        await Font.loadAsync({
          InterTight_500Medium,
          InterTight_600SemiBold,
          InterTight_700Bold,
          InterTight_800ExtraBold,
        });
      } catch (error) {
        logger.warn('Failed to load Inter Tight; falling back to system font', error);
      }

      let hasBodyFonts = false;
      if (generalSans) {
        try {
          await Font.loadAsync(generalSans);
          hasBodyFonts = true;
        } catch (error) {
          logger.warn('Failed to load General Sans; falling back to system font', error);
        }
      } else {
        logger.warn(
          'General Sans not found in assets/fonts — body text will use the system font. ' +
            'Download it from https://www.fontshare.com/fonts/general-sans',
        );
      }

      if (cancelled) return;
      setBodyFontsLoaded(hasBodyFonts);
      setState({ ready: true, hasBodyFonts });
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
