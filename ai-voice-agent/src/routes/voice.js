import { Router } from 'express';
import twilio from 'twilio';
import {
  buildAgentGreetingTwiml,
  buildAgentResponseTwiml,
  buildErrorTwiml,
  buildRepromptTwiml,
  buildRingBusinessTwiml,
} from '../services/twiml.js';
import {
  createCallSession,
  endCallSession,
  getCallSession,
} from '../services/callStore.js';
import {
  generateAgentResponse,
  generateCallSummary,
} from '../services/aiAgent.js';
import { getBusinessConfig } from '../config/business.js';

const router = Router();

function validateTwilioRequest(req, res, next) {
  if (process.env.NODE_ENV === 'development' && !process.env.TWILIO_AUTH_TOKEN) {
    return next();
  }

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return next();

  const signature = req.headers['x-twilio-signature'];
  const url = `${process.env.BASE_URL}${req.originalUrl}`;

  const valid = twilio.validateRequest(
    authToken,
    signature,
    url,
    req.body
  );

  if (!valid && process.env.NODE_ENV === 'production') {
    return res.status(403).send('Forbidden');
  }
  next();
}

router.use(validateTwilioRequest);

router.post('/incoming', (req, res) => {
  const { CallSid, From } = req.body;
  createCallSession(CallSid, From);
  res.type('text/xml').send(buildRingBusinessTwiml());
});

router.post('/no-answer', (req, res) => {
  const { CallSid, DialCallStatus } = req.body;

  const answered = DialCallStatus === 'completed';
  if (answered) {
    endCallSession(CallSid, 'Answered by business');
    res.type('text/xml').send('<Response><Hangup/></Response>');
    return;
  }

  res.type('text/xml').send(buildAgentGreetingTwiml());
});

router.post('/agent/start', (req, res) => {
  const { CallSid, From } = req.body;
  if (!getCallSession(CallSid)) {
    createCallSession(CallSid, From);
  }
  res.type('text/xml').send(buildAgentGreetingTwiml());
});

router.post('/agent/respond', async (req, res) => {
  const { CallSid, SpeechResult } = req.body;

  try {
    const userMessage = SpeechResult?.trim();
    if (!userMessage) {
      res.type('text/xml').send(buildRepromptTwiml());
      return;
    }

    const { reply, isComplete } = await generateAgentResponse(
      CallSid,
      userMessage
    );

    if (isComplete) {
      const summary = await generateCallSummary(CallSid);
      endCallSession(CallSid, summary);
      await sendSmsSummary(CallSid, summary);
    }

    res.type('text/xml').send(buildAgentResponseTwiml(reply, isComplete));
  } catch (err) {
    console.error('Agent respond error:', err);
    res.type('text/xml').send(buildErrorTwiml());
  }
});

router.post('/agent/prompt', (req, res) => {
  res.type('text/xml').send(buildRepromptTwiml());
});

router.post('/status', async (req, res) => {
  const { CallSid, CallStatus } = req.body;

  if (['completed', 'busy', 'failed', 'no-answer', 'canceled'].includes(CallStatus)) {
    const session = getCallSession(CallSid);
    if (session && session.status === 'active') {
      const summary = await generateCallSummary(CallSid);
      endCallSession(CallSid, summary);
      await sendSmsSummary(CallSid, summary);
    }
  }

  res.sendStatus(200);
});

async function sendSmsSummary(callSid, summary) {
  if (process.env.ENABLE_SMS_SUMMARY !== 'true') return;

  const businessPhone = process.env.BUSINESS_PHONE_NUMBER;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!businessPhone || !twilioPhone || !accountSid || !authToken) return;

  const session = getCallSession(callSid);
  const config = getBusinessConfig();
  const collected = session?.collected || {};

  const body = [
    `${config.businessName} — Missed call handled by AI`,
    collected.name ? `Caller: ${collected.name}` : null,
    collected.phone ? `Phone: ${collected.phone}` : session?.from ? `Phone: ${session.from}` : null,
    collected.reason ? `Reason: ${collected.reason}` : null,
    `Summary: ${summary}`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const client = twilio(accountSid, authToken);
    await client.messages.create({
      body,
      from: twilioPhone,
      to: businessPhone,
    });
  } catch (err) {
    console.error('SMS summary failed:', err.message);
  }
}

export default router;
