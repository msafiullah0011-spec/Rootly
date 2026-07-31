import { z } from 'zod';

import { endpoints } from '@/api/endpoints';
import { get, post } from '@/api/http';
import { askAnswerSchema, suggestionListSchema } from '@/api/schemas';

/** AI assistant endpoints: suggestions, natural-language ask, auto-rooting. */

export function fetchSuggestions(signal?: AbortSignal) {
  return get(endpoints.assistant.suggestions, { schema: suggestionListSchema, signal });
}

export function dismissSuggestion(suggestionId: string) {
  return post(endpoints.assistant.dismiss(suggestionId), {}, { schema: z.unknown() });
}

export function askAssistant(question: string) {
  return post(
    endpoints.assistant.ask,
    { question },
    {
      schema: askAnswerSchema,
      // Model responses are slower than CRUD; the default 15s is too tight.
      timeoutMs: 30_000,
    },
  );
}

/** What the quick-add sheet gets back when the AI reads a pasted URL. */
export const autoRootResultSchema = z.object({
  url: z.string(),
  title: z.string(),
  rootId: z.string(),
  rootName: z.string(),
  shelfId: z.string(),
  shelfName: z.string(),
  tags: z.array(z.string()).default([]),
  confidence: z.number().default(0),
});
export type AutoRootResult = z.infer<typeof autoRootResultSchema>;

export function autoRoot(url: string) {
  return post(endpoints.assistant.autoRoot, { url }, { schema: autoRootResultSchema, timeoutMs: 20_000 });
}
