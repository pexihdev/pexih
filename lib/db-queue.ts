import { eq, and, sql } from "drizzle-orm";
import { db } from "./db"; // Sesuaikan dengan instance drizzle database Anda
import { queueJobs } from "../app/_applet/db/schema"; // Sesuaikan path schema

/**
 * Menambahkan pekerjaan baru ke antrean (Queue)
 */
export async function enqueueJob(queueName: string, payload: any, runAt: Date = new Date()) {
  const result = await db.insert(queueJobs).values({
    queueName,
    payload: JSON.stringify(payload),
    status: "pending",
    runAt,
  }).returning({ id: queueJobs.id });
  
  return result[0].id;
}

/**
 * Mengambil satu pekerjaan yang paling awal tertunda dan menandainya sebagai sedang diproses
 * Secara efektif menggunakan pola Polling untuk emulasi Queue
 */
export async function dequeueJob(queueName: string) {
  // Menggunakan CTE atau klausa FOR UPDATE SKIP LOCKED di SQL untuk menghindari race condition
  // Implementasi sederhana dengan Drizzle:
  
  const jobs = await db.execute(sql`
    UPDATE queue_jobs
    SET status = 'processing', updated_at = NOW()
    WHERE id = (
      SELECT id
      FROM queue_jobs
      WHERE queue_name = ${queueName}
        AND status = 'pending'
        AND run_at <= NOW()
      ORDER BY run_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING *;
  `);
  
  if (jobs.rows.length === 0) return null;
  return jobs.rows[0];
}

/**
 * Menandai pekerjaan sebagai selesai
 */
export async function completeJob(id: number) {
  await db.update(queueJobs)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(queueJobs.id, id));
}

/**
 * Menandai pekerjaan sebagai gagal dan menjadwalkan ulang jika batas maxAttempt belum tercapai
 */
export async function failJob(id: number, errorMsg: string) {
  await db.execute(sql`
    UPDATE queue_jobs
    SET 
      attempts = attempts + 1,
      last_error = ${errorMsg},
      status = CASE WHEN attempts + 1 >= max_attempts THEN 'failed' ELSE 'pending' END,
      run_at = CASE WHEN attempts + 1 >= max_attempts THEN run_at ELSE NOW() + INTERVAL '1 minute' * (attempts + 1) END,
      updated_at = NOW()
    WHERE id = ${id}
  `);
}
