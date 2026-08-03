import { Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';

import { logger } from './logger';

/**
 * Handing text to the outside world.
 *
 * Every platform we ship to has *some* way of doing this, but not the same one:
 * iOS and Android have a native share sheet, the web build has neither. Rather
 * than branch at each call site, `shareText` degrades to the clipboard and
 * reports which route it took, so the caller can raise the right toast.
 */

export type ShareOutcome =
  /** The OS share sheet completed. */
  | 'shared'
  /** The user backed out of the share sheet — not a failure. */
  | 'dismissed'
  /** No share sheet available; the text is on the clipboard instead. */
  | 'copied'
  | 'failed';

/**
 * An absolute deep link into the app — `rootly://roots/root_1` in a build,
 * an `exp://` URL under Expo Go. Shared links are useless without it.
 */
export function appUrl(path: string): string {
  return Linking.createURL(path);
}

export async function copyText(value: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(value);
    return true;
  } catch (error) {
    logger.warn('Could not write to the clipboard', error);
    return false;
  }
}

/** Opens the OS share sheet, falling back to the clipboard where there is none. */
export async function shareText({
  title,
  message,
}: {
  title?: string;
  message: string;
}): Promise<ShareOutcome> {
  // `Share` is a no-op stub on web, so don't even try there.
  if (Platform.OS !== 'web' && typeof Share?.share === 'function') {
    try {
      const result = await Share.share({ title, message }, { dialogTitle: title });
      return result.action === 'dismissedAction' ? 'dismissed' : 'shared';
    } catch (error) {
      // A share sheet that refuses to open shouldn't lose the user's content.
      logger.warn('Share sheet failed; falling back to the clipboard', error);
    }
  }

  return (await copyText(message)) ? 'copied' : 'failed';
}
