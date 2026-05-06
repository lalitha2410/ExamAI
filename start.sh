#!/bin/bash
# start.sh — Start all services for AIScrutiny

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "╔═══════════════════════════════════════╗"
echo "║   AIScrutiny — Starting All Services  ║"
echo "╚═══════════════════════════════════════╝"

# ── 1. Check MongoDB ──────────────────────────────────────────────────────────
if ! pgrep mongod > /dev/null; then
  echo ""
  echo "⚠️  MongoDB is not running."
  echo "   Start it with: mongod --dbpath /data/db"
  echo "   Or update MONGO_URI in backend/.env to use Atlas."
fi

# ── 2. Install backend deps if needed ────────────────────────────────────────
echo ""
echo "📦 Installing backend dependencies..."
cd "$ROOT/backend" && npm install --silent

# ── 3. Install frontend deps if needed ───────────────────────────────────────
echo "📦 Installing frontend dependencies..."
cd "$ROOT/frontend" && npm install --silent

# ── 4. Install Python deps if needed ─────────────────────────────────────────
echo "🐍 Installing Python dependencies..."
cd "$ROOT/ml" && pip install -q -r requirements.txt

# ── 5. Start services in background ──────────────────────────────────────────
echo ""
echo "🚀 Starting Express backend on port 5000..."
cd "$ROOT/backend" && node server.js &
BACKEND_PID=$!

echo "🧠 Starting Flask ML service on port 5001..."
cd "$ROOT/ml" && python model.py &
FLASK_PID=$!

echo "⚛️  Starting React frontend on port 3000..."
cd "$ROOT/frontend" && npm start &
REACT_PID=$!

echo ""
echo "✅ All services started!"
echo "   Frontend  → http://localhost:3000"
echo "   Backend   → http://localhost:5000"
echo "   ML API    → http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop all services."

# Cleanup on exit
trap "kill $BACKEND_PID $FLASK_PID $REACT_PID 2>/dev/null; echo 'Stopped.'" EXIT
wait
