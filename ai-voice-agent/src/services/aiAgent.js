import OpenAI from 'openai';
import { getBusinessConfig } from '../config/business.js';
import { buildSystemPrompt } from '../prompts/systemPrompt.js';
import {
  addMessage,
  getCallSession,
  updateCollected,
} from './callStore.js';

let openai = null;

function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

const EXTRACTION_PROMPT = `From the conversation, extract any contact details mentioned. Return JSON only:
{"name": string|null, "phone": string|null, "email": string|null, "reason": string|null, "callbackRequested": boolean, "preferredCallbackTime": string|null}`;

export async function generateAgentResponse(callSid, userMessage) {
  const config = getBusinessConfig();
  const session = getCallSession(callSid);

  if (!session) {
    throw new Error(`No session for call ${callSid}`);
  }

  addMessage(callSid, 'user', userMessage);

  const messages = [
    { role: 'system', content: buildSystemPrompt(config) },
    ...session.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const client = getOpenAI();
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages,
    max_tokens: 250,
    temperature: 0.7,
  });

  let reply = completion.choices[0]?.message?.content?.trim() || '';
  const isComplete = reply.includes('[CALL_COMPLETE]');
  reply = reply.replace(/\[CALL_COMPLETE\]/g, '').trim();

  addMessage(callSid, 'assistant', reply);

  extractContactInfo(callSid).catch(() => {});

  return { reply, isComplete };
}

async function extractContactInfo(callSid) {
  const session = getCallSession(callSid);
  if (!session || session.messages.length < 2) return;

  const transcript = session.messages
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  const client = getOpenAI();
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: EXTRACTION_PROMPT },
      { role: 'user', content: transcript },
    ],
    max_tokens: 200,
    temperature: 0,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) return;

  try {
    const extracted = JSON.parse(raw);
    updateCollected(callSid, extracted);
  } catch {
    // ignore parse errors
  }
}

export async function generateCallSummary(callSid) {
  const session = getCallSession(callSid);
  if (!session) return 'No call data available.';

  const transcript = session.messages
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  const client = getOpenAI();
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'Summarize this phone call in 2-3 sentences for the business owner. Include caller name, reason, and any action items.',
      },
      { role: 'user', content: transcript || 'No transcript.' },
    ],
    max_tokens: 150,
    temperature: 0.3,
  });

  return completion.choices[0]?.message?.content?.trim() || 'Call handled by AI agent.';
}
