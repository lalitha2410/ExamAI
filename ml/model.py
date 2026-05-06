"""
Online Exam Script Evaluation — ML Service (Flask)
Runs on port 5001
Scoring: 40% TF-IDF cosine + 60% BERT semantic similarity
"""

import string
from flask import Flask, jsonify, request
from flask_cors import CORS

# ── sklearn ───────────────────────────────────────────────────────────────────
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ── NLTK stopwords ────────────────────────────────────────────────────────────
try:
    import nltk
    from nltk.corpus import stopwords
    nltk.download("stopwords", quiet=True)
    STOP_WORDS = set(stopwords.words("english"))
except Exception:
    STOP_WORDS = set(["the","a","an","is","are","was","were","and","or",
                      "but","in","on","at","to","for","of","with","by"])

# ── SentenceTransformer (BERT) ────────────────────────────────────────────────
try:
    from sentence_transformers import SentenceTransformer
    bert_model = SentenceTransformer("all-MiniLM-L6-v2")
    BERT_OK = True
    print("✅ BERT model loaded")
except Exception as e:
    BERT_OK = False
    bert_model = None
    print(f"⚠️  BERT not available ({e}), using TF-IDF only")

# ─────────────────────────────────────────────────────────────────────────────

app = Flask(__name__)
CORS(app)


def clean_text(text: str) -> str:
    """Lowercase, remove punctuation and stopwords."""
    text = (text or "").lower().strip()
    text = "".join(c for c in text if c not in string.punctuation)
    words = [w for w in text.split() if w not in STOP_WORDS]
    return " ".join(words)


def calculate_score(student_text: str, model_answer: str) -> float:
    """
    Returns a score 0-100.
    Uses TF-IDF (40%) + BERT (60%) if available, else TF-IDF only.
    """
    student_clean = clean_text(student_text)
    answer_clean  = clean_text(model_answer)

    # ── TF-IDF cosine similarity ──
    try:
        vec   = TfidfVectorizer()
        tfidf = vec.fit_transform([student_clean, answer_clean])
        tfidf_score = float(cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0])
    except Exception:
        tfidf_score = 0.0
    tfidf_score = max(0.0, tfidf_score)

    # ── BERT semantic similarity ──
    if BERT_OK and bert_model:
        try:
            emb1       = bert_model.encode(student_text)
            emb2       = bert_model.encode(model_answer)
            bert_score = float(cosine_similarity([emb1], [emb2])[0][0])
        except Exception:
            bert_score = tfidf_score  # fallback
    else:
        bert_score = tfidf_score

    bert_score = max(0.0, bert_score)

    # ── Weighted final score ──
    if BERT_OK:
        final = 0.4 * tfidf_score + 0.6 * bert_score
    else:
        final = tfidf_score

    return round(max(0.0, final) * 100, 2)


def assign_marks(score: float, total_marks: int = 10) -> float:
    if score < 10:
        return 0
    return round((score / 100) * total_marks, 2)


def get_feedback(score: float) -> str:
    if score >= 75: return "Excellent answer"
    if score >= 50: return "Good answer"
    if score >= 30: return "Average answer"
    if score >= 10: return "Poor answer"
    return "Incorrect answer"


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return jsonify({
        "status":  "ok",
        "message": "ExamEval ML service running",
        "bert":    BERT_OK,
    })


@app.route("/health")
def health():
    return jsonify({"bert": BERT_OK, "sklearn": True, "nltk": True})


@app.route("/evaluateScore", methods=["POST"])
def evaluate_score():
    data          = request.get_json()
    prof_answers  = data.get("profanswers", {})
    student_list  = data.get("useranswers", [])

    final_result = {}

    for student in student_list:
        uname   = student.get("username", "unknown")
        scripts = student.get("script", {})
        final_result[uname] = {}

        for q_key, stu_text in scripts.items():
            prof_text = (prof_answers.get("script") or {}).get(q_key, "")

            if not prof_text or not stu_text:
                final_result[uname][q_key] = 0.0
                continue

            score    = calculate_score(stu_text, prof_text)
            marks    = assign_marks(score)
            feedback = get_feedback(score)

            # Return score as the main value (frontend expects a number)
            final_result[uname][q_key] = score
            # Also store details under a separate key for reference
            final_result[uname][f"{q_key}_details"] = {
                "score":    score,
                "marks":    f"{marks}/10",
                "feedback": feedback,
            }

    return jsonify(final_result)


@app.route("/scorePair", methods=["POST"])
def score_pair():
    """Debug endpoint: POST {student_text, prof_text}"""
    data  = request.get_json()
    score = calculate_score(
        data.get("student_text", ""),
        data.get("prof_text",    "")
    )
    return jsonify({
        "score":    score,
        "marks":    f"{assign_marks(score)}/10",
        "feedback": get_feedback(score),
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)