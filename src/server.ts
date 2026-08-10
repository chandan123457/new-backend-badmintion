import { app } from './app';
import { env } from './config/env';
import { startMembershipReminderScheduler } from './services/reminder.service';

// A stray rejection anywhere outside a request (a timer, a fire-and-forget
// call) would otherwise terminate the server. Log it and keep serving.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception', error);
});

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`Backend listening on http://0.0.0.0:${env.PORT}`);
  startMembershipReminderScheduler();
});
