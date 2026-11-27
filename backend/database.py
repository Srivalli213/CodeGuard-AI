
import sqlite3
import json
from datetime import datetime, timezone


DATABASE_NAME = "codeguard.db"


def get_connection():
    connection = sqlite3.connect(DATABASE_NAME)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    connection = get_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS review_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL,
            language TEXT NOT NULL,
            quality_score INTEGER,
            total_issues INTEGER,
            review_result TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    connection.commit()
    connection.close()


def save_review(code, language, result):
    connection = get_connection()

    cursor = connection.execute("""
        INSERT INTO review_history (
            code,
            language,
            quality_score,
            total_issues,
            review_result,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        code,
        language,
        result.get("quality_score", 0),
        result.get("total_issues", 0),
        json.dumps(result),
        datetime.now(timezone.utc).isoformat()
    ))

    review_id = cursor.lastrowid

    connection.commit()
    connection.close()

    return review_id


def get_all_reviews():
    connection = get_connection()

    rows = connection.execute("""
        SELECT id, code, language, quality_score,
               total_issues, created_at
        FROM review_history
        ORDER BY id DESC
    """).fetchall()

    connection.close()

    return [dict(row) for row in rows]


def get_review_by_id(review_id):
    connection = get_connection()

    row = connection.execute("""
        SELECT *
        FROM review_history
        WHERE id = ?
    """, (review_id,)).fetchone()

    connection.close()

    if row is None:
        return None

    review = dict(row)
    review["review_result"] = json.loads(
        review["review_result"]
    )

    return review
