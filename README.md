# ExamAI — AI Based Examination Script Evaluation System

> Automated evaluation of handwritten answer scripts using OCR and NLP — instant, objective, and fair grading for every student.

**VIT-AP University | Senior Design Project 2025–26 | SDP ID: 20250566**

---

## 👨‍💻 Team

| Name | Reg. No. |
|---|---|
| Pushadapu Lalitha Sahithi | 22BCE9119 |
| Gurram Lakshmi Lasya | 22BCE9602 |
| Nadakurthy Yasasri | 22BCE20086 |

**Guide:** Mr. Bharathi V C, Professor, SCOPE, VIT-AP University

---

## 🗂️ Project Structure

```
ExamAI/
├── backend/                  ← Node.js Express REST API
│   ├── server.js             ← 12 API endpoints, JWT auth, OCR proxy
│   ├── package.json
│   └── .env
├── frontend/                 ← React.js UI
│   ├── src/
│   │   ├── App.js
│   │   ├── AuthContext.js
│   │   ├── api.js
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   └── ScoreBar.js
│   │   ├── pages/
│   │   │   ├── Home.js
│   │   │   ├── Login.js
│   │   │   ├── Signup.js
│   │   │   ├── StudentExams.js
│   │   │   ├── StudentResults.js
│   │   │   └── ProfDashboard.js
│   │   └── styles/global.css
│   └── package.json
└── ml/                       ← Python Flask NLP scoring service
    ├── model.py              ← BERT + TF-IDF dual-model scoring
    └── requirements.txt
```

---

## ⚙️ Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 18.x |
| npm | ≥ 9.x |
| MongoDB | ≥ 6.x (local or Atlas) |
| Python | ≥ 3.9 |
| pip | latest |

---

## 🚀 Quick Start

### 1 — Clone the Repository

```bash
git clone https://github.com/lalitha2410/ExamAI.git
cd ExamAI
```

### 2 — MongoDB

Start MongoDB locally:

```bash
mkdir -p C:/data/db
mongod --dbpath "C:/data/db"
```

Or use MongoDB Atlas — update `MONGO_URI` in `backend/.env`.

### 3 — Backend (Node.js Express)

```bash
cd backend
npm install
node server.js       # runs on http://localhost:5000
```

**Environment variables** (`backend/.env`):

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ExamEval
JWT_SECRET=your_secret_key_here
FLASK_URL=http://127.0.0.1:5001
```

### 4 — ML Service (Python Flask)

```bash
cd ml
pip install -r requirements.txt
python model.py      # runs on http://localhost:5001
```

> **Note:** First run will download the `all-MiniLM-L6-v2` BERT model (~80MB). This is a one-time download.

### 5 — Frontend (React)

```bash
cd frontend
npm install
npm start            # opens http://localhost:3000 or 3001
```

---

## 🌐 Ports Summary

| Service | Port |
|---|---|
| React Frontend | 3000 / 3001 |
| Express Backend | 5000 |
| Flask ML Service | 5001 |
| MongoDB | 27017 |

---

## 🔑 How It Works

### Student Flow
1. Sign up with VIT-AP registration number + `@vitapstudent.ac.in` email
2. Login → view scheduled active examinations
3. Open exam → upload handwritten answer image per question
4. System extracts text via OCR (Google Vision API via backend proxy)
5. Review extracted text → submit answer
6. View scores and PASSED / FAILED badge once professor publishes results

### Professor Flow
1. Sign up with employee ID + `@vitap.ac.in` email
2. Login → Dashboard shows all posted examinations with submission counts
3. Post new exam with subject, semester, questions, and active time window
4. Upload reference answers (typed text or image via OCR) per question
5. Click **Evaluate Answers** → AI scores all student submissions instantly
6. Review AI-generated scores → click **Publish Results**

---

## 🧠 Scoring Algorithm (ML Service)

The Python Flask service uses a **dual-model NLP scoring pipeline**:

```
Score = (0.40 × TF-IDF Cosine Similarity + 0.60 × BERT Semantic Similarity) × 100
```

| Component | Weight | Library | Purpose |
|---|---|---|---|
| TF-IDF Cosine Similarity | 40% | scikit-learn | Lexical overlap matching |
| BERT Semantic Similarity | 60% | Sentence Transformers (all-MiniLM-L6-v2) | Semantic meaning matching |

### Preprocessing Steps
1. Convert text to lowercase
2. Remove punctuation
3. Remove English stopwords (NLTK)
4. Preprocessed text → TF-IDF scoring
5. Original text → BERT encoding (preserves context)

### Feedback Bands

| Score Range | Feedback |
|---|---|
| ≥ 75% | Excellent Answer |
| 50 – 74% | Good Answer |
| 30 – 49% | Average Answer |
| 10 – 29% | Poor Answer |
| < 10% | Incorrect Answer |

---

## 🛡️ Authentication & Security

- Passwords hashed with **bcryptjs** (salt factor: 10)
- Sessions use **JWT tokens** (24h expiry) stored in localStorage
- All routes (except `/signup` and `/login`) protected by `authMiddleware`
- **Role-based access control**: Professor and Student roles
- Student email must contain registration number as substring
- Student email domain: `@vitapstudent.ac.in`
- Professor email domain: `@vitap.ac.in`
- Password rules: min 9 chars, uppercase + lowercase + digit + special char

---

## 🖼️ OCR Integration

Handwritten answer images are processed via **Google Vision OCR API**.

The backend acts as a proxy (`/ocr` endpoint) to bypass browser CORS restrictions:

```
Frontend → POST /ocr (image) → Node.js Backend → OCR API → extracted text → Frontend
```

If OCR fails, users can type the answer manually (graceful degradation).

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js 18, React Router v6, React Toastify |
| UI Design | Custom CSS, DM Sans, Space Mono, Dark Theme |
| Backend | Node.js, Express.js 4, Multer, JWT, bcryptjs |
| ML Service | Python, Flask, Sentence Transformers, scikit-learn, NLTK |
| Database | MongoDB, Mongoose ODM |
| OCR | Google Vision API (via backend proxy) |
| Deployment | Vercel (frontend), Render (backend + ML), MongoDB Atlas |

---

## 🔗 Repository

[https://github.com/lalitha2410/ExamAI](https://github.com/lalitha2410/ExamAI)

---

## 📋 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /signup | Register new user |
| POST | /login | Authenticate and get JWT |
| POST | /addexam | Create new examination |
| GET | /examsSchedule | Get active examinations |
| GET | /previousExams | Get closed examinations |
| POST | /getProfessorExams | Get professor's exams |
| POST | /upload | Submit student answer |
| POST | /profupload | Submit reference answer |
| POST | /ocr | Extract text from image |
| POST | /evaluate | Run AI evaluation |
| POST | /postResult | Publish results |
| POST | /getUserResults | Get student results |

---

## 📄 License

This project was developed as part of the Senior Design Project at VIT-AP University. All rights reserved by the authors.
