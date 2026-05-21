import { app } from './app';
import { env } from './config/env';
import { startMembershipReminderScheduler } from './services/reminder.service';

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`Backend listening on http://0.0.0.0:${env.PORT}`);
  startMembershipReminderScheduler();
});
