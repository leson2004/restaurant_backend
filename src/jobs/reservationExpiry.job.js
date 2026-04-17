import cron from "node-cron";
import { expireHoldReservationsService } from "../services/reservationAdmin.service.js";

// /**
//  * 5️⃣ CRON JOB - Scheduled job to expire HOLD reservations
//  * 
//  * ⏰ Cron expression: "0 */5 * * * *" (every 5 minutes)
//  * Có thể customize theo yêu cầu:
//  *  - "*/1 * * * *" : Mỗi phút
//  *  - "0 * * * *"   : Mỗi giờ
//  *  - "0 */6 * * *" : Mỗi 6 tiếng
//  * 
//  * Business rule:
//  * Update status = 5 (EXPIRED) nếu:
//  * - status = 0 (HOLD)
//  * - hold_expired_at < now()
//  **/
const startReservationExpiryJob = () => {
  // ⏰ Chạy mỗi 5 phút
  const cronExpression = "0 */5 * * * *";

  cron.schedule(cronExpression, async () => {
    try {
      const timestamp = new Date().toISOString();
      console.log(
        `[${timestamp}] ⏰ Running HOLD reservation expiry job...`
      );

      const result = await expireHoldReservationsService();

      if (result.updatedCount > 0) {
        console.log(
          `[${timestamp}] ✅ Successfully expired ${result.updatedCount} HOLD reservation(s)`
        );
      } else {
        console.log(`[${timestamp}] ✅ No expired HOLD reservations found`);
      }
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] ❌ Error in HOLD reservation expiry job:`,
        error.message,
        error.stack
      );
    }
  });

  console.log(
    `✅ Reservation HOLD expiry job started - running every 5 minutes (${new Date().toISOString()})`
  );
};

export default startReservationExpiryJob;
