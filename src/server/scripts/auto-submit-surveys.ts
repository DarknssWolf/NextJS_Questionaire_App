import {
  autoSubmitLapsedSubmissions,
  notifyDueDatesCloseToEnding,
  notifySuppliersWhoHaventStarted,
} from '@/server/services/submission-auto-complete.service';

async function main() {
  console.log(`[Cron] Starting at ${new Date().toISOString()}`);

  const results = [
    await autoSubmitLapsedSubmissions(),
    await notifySuppliersWhoHaventStarted(),
    await notifyDueDatesCloseToEnding(),
  ];

  for (const result of results) {
    console.log(`[Cron] ${result.success ? 'OK  ' : 'FAIL'} ${result.message}`);
  }

  process.exit(results.every((result) => result.success) ? 0 : 1);
}

main().catch((error) => {
  console.error('[Cron] Fatal error:', error);
  process.exit(1);
});
