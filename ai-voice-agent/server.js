import 'dotenv/config';
import { createApp } from './src/app.js';

const PORT = process.env.PORT || 3000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`AI Voice Agent running on port ${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}`);
  console.log(`Twilio webhook: ${process.env.BASE_URL || `http://localhost:${PORT}`}/voice/incoming`);
});
