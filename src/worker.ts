import { DurableObject } from 'cloudflare:workers';
import astroWorker from '@astrojs/cloudflare/entrypoints/server';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export class NewsletterRateLimiter extends DurableObject {
  constructor(ctx: DurableObjectState, env: Cloudflare.Env) {
    super(ctx, env);
    this.ctx.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS attempts (id INTEGER PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL)'
    );
  }

  async check(): Promise<{ allowed: boolean; retryAfter: number }> {
    const now = Date.now();
    const rows = this.ctx.storage.sql.exec<{ reset_at: number }>(
      `INSERT INTO attempts (id, count, reset_at) VALUES (1, 1, ?)
       ON CONFLICT(id) DO UPDATE SET
         count = CASE WHEN reset_at <= ? THEN 1 ELSE count + 1 END,
         reset_at = CASE WHEN reset_at <= ? THEN ? ELSE reset_at END
       WHERE reset_at <= ? OR count < ?
       RETURNING reset_at`,
      now + WINDOW_MS, now, now, now + WINDOW_MS, now, MAX_ATTEMPTS
    ).toArray();

    if (rows.length === 0) {
      const { reset_at } = this.ctx.storage.sql.exec<{ reset_at: number }>(
        'SELECT reset_at FROM attempts WHERE id = 1'
      ).one();
      return { allowed: false, retryAfter: Math.max(1, Math.ceil((reset_at - now) / 1000)) };
    }

    await this.ctx.storage.setAlarm(rows[0].reset_at);
    return { allowed: true, retryAfter: 0 };
  }

  async alarm(): Promise<void> {
    this.ctx.storage.sql.exec('DELETE FROM attempts WHERE reset_at <= ?', Date.now());
    const remaining = this.ctx.storage.sql.exec<{ reset_at: number }>(
      'SELECT reset_at FROM attempts WHERE id = 1'
    ).toArray();
    if (remaining.length > 0) {
      await this.ctx.storage.setAlarm(remaining[0].reset_at);
    }
  }
}

export default astroWorker;
