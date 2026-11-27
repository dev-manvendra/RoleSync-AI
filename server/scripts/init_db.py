"""Create the pgvector extension and jobs table.  Run:  python -m scripts.init_db"""
import psycopg

from app.config import settings

DDL = f"""
CREATE TABLE IF NOT EXISTS jobs (
    id          bigserial PRIMARY KEY,
    title       text NOT NULL,
    company     text NOT NULL,
    location    text NOT NULL,
    mode        text NOT NULL CHECK (mode IN ('remote','hybrid','onsite')),
    salary      text,
    skills      text[] NOT NULL DEFAULT '{{}}',
    description text NOT NULL,
    apply_url   text DEFAULT '#',
    embedding   vector({settings.embed_dim}),
    UNIQUE (title, company, location)
);
CREATE INDEX IF NOT EXISTS jobs_embedding_idx ON jobs USING hnsw (embedding vector_cosine_ops);
"""

if __name__ == "__main__":
    with psycopg.connect(settings.database_url, autocommit=True) as conn:
        conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
        conn.execute(DDL)
    print(f"jobs table ready (vector dimension {settings.embed_dim}).")
