import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(__dirname, '../../config/default-business.json');
const OVERRIDE_PATH = path.join(__dirname, '../../config/business.json');

let cachedConfig = null;

function loadConfig() {
  const base = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  if (fs.existsSync(OVERRIDE_PATH)) {
    const override = JSON.parse(fs.readFileSync(OVERRIDE_PATH, 'utf-8'));
    return { ...base, ...override };
  }
  return base;
}

export function getBusinessConfig() {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
  }
  return cachedConfig;
}

export function updateBusinessConfig(updates) {
  const current = getBusinessConfig();
  const merged = { ...current, ...updates };
  fs.writeFileSync(OVERRIDE_PATH, JSON.stringify(merged, null, 2));
  cachedConfig = merged;
  return merged;
}

export function isWithinBusinessHours(config = getBusinessConfig()) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: config.timezone,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const weekday = parts.find((p) => p.type === 'weekday')?.value?.toLowerCase();
  const hour = parts.find((p) => p.type === 'hour')?.value;
  const minute = parts.find((p) => p.type === 'minute')?.value;
  const currentTime = `${hour}:${minute}`;

  const dayHours = config.hours[weekday];
  if (!dayHours || dayHours.closed) return false;

  return currentTime >= dayHours.open && currentTime < dayHours.close;
}

export function formatGreeting(config = getBusinessConfig()) {
  return config.greeting.replace(/\{businessName\}/g, config.businessName);
}
