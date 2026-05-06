# AIScrutiny — Online Exam Script Evaluation

> MERN + Python/Flask NLP project from the SDP report by Pushadapu Kamal Teja & Modalier Subhash, VIT-AP University

---

## 🗂️ Project Structure

```
exam-eval/
├── backend/          ← Express.js API server  (Node.js)
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/         ← React.js UI
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
└── ml/               ← Python Flask NLP scoring service
    ├── model.py
    └── requirements.txt
```

---

## ⚙️ Prerequisites

| Tool        | Version    |
|-------------|------------|
| Node.js     | ≥ 18.x     |
| npm         | ≥ 9.x      |
| MongoDB     | ≥ 6.x (local or Atlas) |
| Python      | ≥ 3.9      |
| pip         | latest     |

---

## 🚀 Quick Start

### 1 — MongoDB

Start MongoDB locally:
```bash
mongod --dbpath /data/db
```
Or use MongoDB Atlas — update `MONGO_URI` in `backend/.env`.

---

### 2 — Backend (Express)

```bash
cd backend
npm install
npm start          # runs on http://localhost:5000
```

**Environment variables** (`backend/.env`):
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ExamEval
JWT_SECRET=your_secret_key_here
FLASK_URL=http://127.0.0.1:5001
```

---

### 3 — ML Service (Python Flask)

```bash
cd ml
pip install -r requirements.txt
python -m spacy download en_core_web_sm   # one-time
python model.py                            # runs on http://localhost:5001
```

> **Note:** If Java is not installed, comment out `language-tool-python` in requirements.txt — the app will still work without grammar checking.

---

### 4 — Frontend (React)

```bash
cd frontend
npm install
npm start          # opens http://localhost:3000
```

---

## 🌐 Ports Summary

| Service          | Port  |
|------------------|-------|
| React frontend   | 3000  |
| Express backend  | 5000  |
| Flask ML service | 5001  |
| MongoDB          | 27017 |

---

## 🔑 How It Works

### Student Flow
1. Sign up with VIT registration number + VIT email
2. Login → see scheduled exams
3. Open exam → upload handwritten answer images per question
4. System extracts text via OCR (external API or typed directly)
5. View results once professor publishes them

### Professor Flow
1. Sign up with 5-digit employee ID + VIT email  
2. Login → Dashboard shows all exams
3. Post new exam with subject, semester, questions, and time window
4. Upload correct answers (text) per question
5. Click **Evaluate Answers** → NLP scores all submissions
6. Review scores → click **Publish Results**

### Scoring (ML Service)
The Python service uses:
- **TF-IDF vectorization** on preprocessed text
- **Cosine similarity** (80% weight) as the primary metric
- **Sentiment analysis** via VADER (5% adjustment)
- **Grammar error penalty** via LanguageTool (optional)
- **Sentence complexity bonus** via spaCy

---

## 🛡️ Auth

- Passwords are hashed with **bcrypt**
- Sessions use **JWT tokens** (24h expiry) stored in localStorage
- Routes protected by role-based auth middleware

---

## 🔧 Development Tips

- The backend has a **JS fallback scorer** in case the Flask service is down
- Socket.IO enables **real-time exam updates** when a professor posts a new exam
- The React proxy in `package.json` routes `/api` calls to `localhost:5000`

---

## 📦 Tech Stack

**Frontend:** React 18, React Router v6, React Toastify, Socket.IO Client  
**Backend:** Express.js, Mongoose, Socket.IO, bcryptjs, JWT, Multer  
**ML:** Flask, NLTK (VADER), scikit-learn (TF-IDF + cosine), spaCy, LanguageTool  
**Database:** MongoDB (with change streams for real-time updates)

---

## 👨‍💻 Authors

- **Pushadapu Kamal Teja** (20BCE7452)  
- **Modalier Subhash** (20BCE7400)  
- Guided by **Dr. M. Mohamed Iqbal**, VIT-AP University
