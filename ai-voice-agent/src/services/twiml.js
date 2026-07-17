import twilio from 'twilio';
import { getBusinessConfig, formatGreeting } from '../config/business.js';

const VoiceResponse = twilio.twiml.VoiceResponse;

export function buildRingBusinessTwiml() {
  const response = new VoiceResponse();
  const timeout = parseInt(process.env.RING_TIMEOUT_SECONDS || '20', 10);
  const businessPhone = process.env.BUSINESS_PHONE_NUMBER;

  if (!businessPhone) {
    return buildAgentGreetingTwiml();
  }

  const dial = response.dial({
    timeout,
    action: '/voice/no-answer',
    method: 'POST',
    callerId: process.env.TWILIO_PHONE_NUMBER,
  });
  dial.number(businessPhone);

  return response.toString();
}

export function buildAgentGreetingTwiml() {
  const config = getBusinessConfig();
  const response = new VoiceResponse();

  const gather = response.gather({
    input: 'speech',
    action: '/voice/agent/respond',
    method: 'POST',
    speechTimeout: 'auto',
    language: config.language || 'en-US',
    hints: config.services.join(', '),
    actionOnEmptyResult: true,
  });

  gather.say(
    { voice: config.voice || 'Polly.Joanna-Neural' },
    formatGreeting(config)
  );

  response.redirect({ method: 'POST' }, '/voice/agent/prompt');

  return response.toString();
}

export function buildAgentResponseTwiml(reply, isComplete = false) {
  const config = getBusinessConfig();
  const response = new VoiceResponse();

  if (isComplete) {
    response.say(
      { voice: config.voice || 'Polly.Joanna-Neural' },
      reply
    );
    response.say(
      { voice: config.voice || 'Polly.Joanna-Neural' },
      `Thank you for calling ${config.businessName}. Have a wonderful day. Goodbye.`
    );
    response.hangup();
    return response.toString();
  }

  const gather = response.gather({
    input: 'speech',
    action: '/voice/agent/respond',
    method: 'POST',
    speechTimeout: 'auto',
    language: config.language || 'en-US',
    actionOnEmptyResult: true,
  });

  gather.say({ voice: config.voice || 'Polly.Joanna-Neural' }, reply);

  response.redirect({ method: 'POST' }, '/voice/agent/prompt');

  return response.toString();
}

export function buildRepromptTwiml() {
  const config = getBusinessConfig();
  const response = new VoiceResponse();

  const gather = response.gather({
    input: 'speech',
    action: '/voice/agent/respond',
    method: 'POST',
    speechTimeout: 'auto',
    language: config.language || 'en-US',
    actionOnEmptyResult: true,
  });

  gather.say(
    { voice: config.voice || 'Polly.Joanna-Neural' },
    "I'm still here if you need anything. How can I help you?"
  );

  response.say(
    { voice: config.voice || 'Polly.Joanna-Neural' },
    "I didn't hear anything. Thank you for calling. Goodbye."
  );
  response.hangup();

  return response.toString();
}

export function buildErrorTwiml() {
  const config = getBusinessConfig();
  const response = new VoiceResponse();

  response.say(
    { voice: config.voice || 'Polly.Joanna-Neural' },
    `We apologize, but we're experiencing technical difficulties. Please try calling ${config.businessName} again later, or leave us a message on our website. Goodbye.`
  );
  response.hangup();

  return response.toString();
}
