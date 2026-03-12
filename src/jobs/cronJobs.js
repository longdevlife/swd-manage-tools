// ══════════════════════════════════════════════════════════
// Cron Jobs – Automated Sync
// Phase 10 – Dùng node-cron chạy định kỳ
// ══════════════════════════════════════════════════════════
import cron from "node-cron";
import { syncAllGroups } from "../services/syncService.js";

/**
 * Khởi tạo tất cả cron jobs
 * Gọi hàm này trong server.js sau khi app.listen()
 */
export const initCronJobs = () => {
  // ═══════════════════════════════════════════════════
  // Cron: Full Sync tất cả nhóm — chạy mỗi 6 tiếng
  // Pattern: "0 */6 * * *" = phút 0, mỗi 6 giờ
  // ═══════════════════════════════════════════════════
  const syncSchedule = process.env.SYNC_CRON_SCHEDULE || "0 */6 * * *";

  cron.schedule(syncSchedule, async () => {
    const startTime = new Date();
    console.log(`\n⏰ [CRON] Starting full sync at ${startTime.toISOString()}`);

    try {
      const results = await syncAllGroups();

      const endTime = new Date();
      const durationMs = endTime - startTime;

      console.log(
        `✅ [CRON] Full sync completed in ${durationMs}ms — ${results.length} group(s) processed`
      );

      // Log errors nếu có
      for (const result of results) {
        if (result.errors && result.errors.length > 0) {
          console.warn(
            `⚠️ [CRON] Group "${result.group_name}" had errors:`,
            result.errors
          );
        }
      }
    } catch (error) {
      console.error(`❌ [CRON] Full sync failed:`, error.message);
    }
  });

  console.log(`⏰ Cron Job: Full Sync scheduled (${syncSchedule})`);
};
