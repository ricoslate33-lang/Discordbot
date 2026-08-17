import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * src/lib/gemini.js
 * Gemini wrapper utilities
 *
 * Exports:
 *  - generateReply(history, systemInstruction, options) => string
 *  - generateChatStream(...) TODO: placeholder for future streaming
 *
 * history: array of message objects in simple form:
 *   [{ role: 'user'|'assistant'|'system', content: '...' }, ...]
 *
 * systemInstruction: optional string appended to the default system guardrails
 *
 * options:
 *   - model: 'gemini-2.0-flash' (default) or 'gemini-1.5-pro'
 *   - timeoutMs: number (default 8000)
 *   - retries: number (default 2)
 */

const DEFAULT_MODEL = 'gemini-2.0-flash';
const DEFAULT_TIMEOUT = 8000;
const DEFAULT_RETRIES = 2;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function buildSystemInstruction(custom) {
  const base = [
    'You are a helpful, safe, and concise assistant integrated into a Discord bot.',
    'Guardrails: never produce hate speech, sexual content involving minors, instructions for violent wrongdoing, or any content violating Discord ToS.',
    'Stay in character when a persona is provided. Keep answers generally under ~300 words unless the user explicitly requests a longer response.',
    'When asked to generate insults/roasts, keep them PG-13, avoid targeting protected classes, and favor playful personal attributes instead.',
    'If the user input is disallowed, respond with a brief refusal and an explanation.',
  ].join(' ');
  if (!custom) return base;
  return `${custom}\n\n${base}`;
}

function isTransientError(err) {
  if (!err) return false;
  const message = String(err).toLowerCase();
  return /timeout|timed out|network|econnreset|etimedout|rate limit|503|502|500/.test(message);
}

/**
 * generateReply
 * @param {Array<{role:string, content:string}>} history
 * @param {string} systemInstruction
 * @param {object} options
 * @returns {Promise<string>}
 */
export async function generateReply(history = [], systemInstruction = '', options = {}) {
  const modelName = options.model || DEFAULT_MODEL;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT;
  const maxRetries = (options.retries ?? DEFAULT_RETRIES);

  const fullSystem = buildSystemInstruction(systemInstruction);

  let lastError = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: fullSystem,
      });

      const normalizedHistory = (history || []).map(m => {
        const role = m.role === 'system' ? 'system' : (m.role === 'assistant' ? 'assistant' : 'user');
        return { author: role, content: [{ type: 'text', text: String(m.content) }] };
      });

      const chat = model.startChat({ history: normalizedHistory });

      const lastUser = history && history.length ? history[history.length - 1].content : '';

      const sendPromise = (async () => {
        const result = await chat.sendMessage(String(lastUser || ''));
        // normalize a few possible shapes
        if (result?.response?.text) return result.response.text;
        if (typeof result?.response === 'string') return result.response;
        if (typeof result?.text === 'string') return result.text;
        return JSON.stringify(result);
      })();

      const response = await Promise.race([
        sendPromise,
        new Promise((_, rej) => setTimeout(() => rej(new Error('gemini_timeout')), timeoutMs))
      ]);

      const text = typeof response === 'string' ? response : String(response);
      return text;
    } catch (err) {
      lastError = err;
      if (isTransientError(err) && attempt < maxRetries) {
        const backoffMs = 500 * (attempt + 1);
        await new Promise(r => setTimeout(r, backoffMs));
        continue;
      }
      const wrapped = new Error(`Gemini request failed (attempt ${attempt + 1}): ${err?.message || err}`);
      wrapped.cause = err;
      throw wrapped;
    }
  }

  throw lastError ?? new Error('Unknown Gemini error');
}

export default { generateReply };