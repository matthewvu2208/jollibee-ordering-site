declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    OPENAI_API_KEY?: string;
    OPENAI_CHAT_ENABLED?: string;
    OPENAI_MODEL?: string;
    PUBLIC_DEMO?: string;
    DEMO_SESSION_SECRET?: string;
    AI_DAILY_LIMIT?: string;
    BUCKET?: R2Bucket;
  }
}
