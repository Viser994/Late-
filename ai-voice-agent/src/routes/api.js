import { Router } from 'express';
import {
  getBusinessConfig,
  updateBusinessConfig,
  isWithinBusinessHours,
} from '../config/business.js';
import { getRecentCalls, getCallSession } from '../services/callStore.js';

const router = Router();

router.get('/config', (req, res) => {
  res.json(getBusinessConfig());
});

router.put('/config', (req, res) => {
  try {
    const updated = updateBusinessConfig(req.body);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/status', (req, res) => {
  const config = getBusinessConfig();
  res.json({
    status: 'online',
    businessName: config.businessName,
    withinBusinessHours: isWithinBusinessHours(config),
    twilioConfigured: Boolean(
      process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ),
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    businessPhoneConfigured: Boolean(process.env.BUSINESS_PHONE_NUMBER),
  });
});

router.get('/calls', (req, res) => {
  const limit = parseInt(req.query.limit || '50', 10);
  const calls = getRecentCalls(limit).map((call) => ({
    id: call.id,
    callSid: call.callSid,
    from: call.from,
    startedAt: call.startedAt,
    endedAt: call.endedAt,
    status: call.status,
    handledBy: call.handledBy,
    summary: call.summary,
    collected: call.collected,
    messageCount: call.messages.length,
  }));
  res.json(calls);
});

router.get('/calls/:callSid', (req, res) => {
  const session = getCallSession(req.params.callSid);
  if (!session) {
    return res.status(404).json({ error: 'Call not found' });
  }
  res.json(session);
});

export default router;
