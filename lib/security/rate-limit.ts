import { getDb } from "@/lib/db";

export async function consumeDailyLimit(
  userId: string,
  action: "document_upload" | "ai_analysis",
  limit: number,
) {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO user_daily_limits (user_id, action, request_count)
    VALUES (${userId}, ${action}, 1)
    ON CONFLICT (user_id, action, usage_date)
    DO UPDATE SET request_count = user_daily_limits.request_count + 1
    WHERE user_daily_limits.request_count < ${limit}
    RETURNING request_count
  `;
  return rows.length > 0;
}
