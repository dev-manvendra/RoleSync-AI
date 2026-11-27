from pgvector import Vector
from pgvector.psycopg import register_vector
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from .config import settings


def _configure(conn):
    register_vector(conn)


# prepare_threshold=None keeps this compatible with Supabase's pgbouncer pooler.
pool = ConnectionPool(
    settings.database_url, min_size=1, max_size=5, open=False, configure=_configure,
    kwargs={"prepare_threshold": None, "row_factory": dict_row},
)

SEARCH_SQL = """
SELECT id, title, company, location, mode, salary, skills, description, apply_url,
       1 - (embedding <=> %s) AS similarity
FROM jobs
ORDER BY embedding <=> %s
LIMIT %s
"""


def search_jobs(vec: list[float], k: int) -> list[dict]:
    v = Vector(vec)
    with pool.connection() as conn:
        return conn.execute(SEARCH_SQL, (v, v, k)).fetchall()


def count_jobs() -> int:
    with pool.connection() as conn:
        return conn.execute("SELECT count(*) AS n FROM jobs").fetchone()["n"]
