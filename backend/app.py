import os
import sqlite3
import pandas as pd

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from groq import Groq

# ----------------------------
# LOAD ENV
# ----------------------------

load_dotenv()

# ----------------------------
# FLASK
# ----------------------------

app = Flask(__name__)
CORS(app)

# ----------------------------
# CREATE DATABASE FOLDER
# ----------------------------

os.makedirs("database", exist_ok=True)

DB_PATH = "database/data.db"

os.makedirs("database", exist_ok=True)

# ----------------------------
# GROQ
# ----------------------------

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

# ----------------------------
# STORE CURRENT TABLE
# ----------------------------

CURRENT_TABLE = None

# ----------------------------
# CLEAN SQL
# ----------------------------

def clean_sql(sql):

    return (
        sql.replace("```sql", "")
        .replace("```", "")
        .strip()
    )

# ----------------------------
# GENERATE SQL
# ----------------------------

def generate_sql(question, table_name, columns):

    prompt = f"""
You are an expert SQLite SQL generator.

Database table name:
{table_name}

Columns:
{', '.join(columns)}

Rules:
- Return ONLY SQL query
- No explanation
- Use SQLite syntax
- Use exact column names
- Only SELECT queries allowed
- Use LIMIT 10 if needed

Question:
{question}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        temperature=0,
        max_tokens=300,
        messages=[
            {
                "role": "system",
                "content": "You generate only SQL queries."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    sql = response.choices[0].message.content

    return clean_sql(sql)

# ----------------------------
# HOME
# ----------------------------

@app.route("/")
def home():

    return jsonify({
        "message": "AI SQL Analyst Backend Running"
    })

# ----------------------------
# UPLOAD DATASET
# ----------------------------

@app.route("/upload", methods=["POST"])
def upload_file():

    global CURRENT_TABLE

    if "file" not in request.files:
        return jsonify({
            "error": "No file uploaded"
        }), 400

    file = request.files["file"]

    # Read CSV
    df = pd.read_csv(file)

    # Create table name from filename
    table_name = os.path.splitext(file.filename)[0]

    # Clean table name
    table_name = table_name.replace(" ", "_").lower()

    conn = sqlite3.connect(DB_PATH)

    # Save dataset
    df.to_sql(
        table_name,
        conn,
        if_exists="replace",
        index=False
    )

    conn.close()

    # Store latest table
    CURRENT_TABLE = table_name

    return jsonify({
        "message": "Dataset uploaded successfully",
        "table_name": table_name,
        "columns": list(df.columns)
    })

# ----------------------------
# ASK QUESTION
# ----------------------------

@app.route("/ask", methods=["POST"])
def ask_question():

    global CURRENT_TABLE

    if not CURRENT_TABLE:
        return jsonify({
            "error": "No dataset uploaded yet"
        }), 400

    data = request.json

    question = data.get("question")

    conn = sqlite3.connect(DB_PATH)

    # ----------------------------
    # GET COLUMNS
    # ----------------------------

    columns_query = f"""
    PRAGMA table_info({CURRENT_TABLE})
    """

    cols_df = pd.read_sql_query(
        columns_query,
        conn
    )

    columns = cols_df["name"].tolist()

    # ----------------------------
    # GENERATE SQL
    # ----------------------------

    sql_query = generate_sql(
        question,
        CURRENT_TABLE,
        columns
    )

    # ----------------------------
    # SECURITY CHECK
    # ----------------------------

    if not sql_query.lower().startswith("select"):

        return jsonify({
            "error": "Only SELECT queries allowed"
        }), 400

    # ----------------------------
    # EXECUTE SQL
    # ----------------------------

    result_df = pd.read_sql_query(
        sql_query,
        conn
    )

    conn.close()

    return jsonify({
        "question": question,
        "table": CURRENT_TABLE,
        "sql": sql_query,
        "columns": result_df.columns.tolist(),
        "data": result_df.to_dict(orient="records")
    })

# ----------------------------
# GET TABLES
# ----------------------------

@app.route("/tables")
def get_tables():

    conn = sqlite3.connect(DB_PATH)

    query = """
    SELECT name
    FROM sqlite_master
    WHERE type='table'
    """

    tables_df = pd.read_sql_query(query, conn)

    conn.close()

    return jsonify({
        "tables": tables_df["name"].tolist(),
        "current_table": CURRENT_TABLE
    })

# ----------------------------

if __name__ == "__main__":

    app.run(debug=True)