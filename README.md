
# CodeGuard AI

### Write better code. Detect bugs earlier. Build with confidence.

CodeGuard AI is an AI-powered Python code review platform that helps developers identify potential bugs, security risks, and code quality issues.

## Features

- **Code Analysis:** Analyze Python code for potential issues.
- **Security Scanner:** Detect risky patterns such as eval() and exec().
- **Code Quality Score:** Get a score based on detected issues.
- **AI Code Explanation:** Understand code issues with AI-powered explanations.
- **AI Auto-Fix:** Generate corrected code suggestions.
- **Unit Test Generator:** Generate pytest test cases automatically.
- **Review History:** View previous code reviews.

## Technology Stack

### Frontend
- React
- Vite
- Monaco Editor
- CSS

### Backend
- Python
- FastAPI
- Ruff
- Bandit
- SQLite

### AI Integration
- Groq API

## Project Structure

```text
CodeGuard-AI/
├── backend/
│   ├── main.py
│   ├── analyzer.py
│   ├── ai_reviewer.py
│   ├── database.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   └── package.json
└── README.md
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/Srivalli213/CodeGuard-AI.git
cd CodeGuard-AI
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
```

Activate the virtual environment on Windows:

```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the backend folder:

```env
GROQ_API_KEY=your_groq_api_key
```

Start the backend:

```bash
python -m uvicorn main:app --reload
```

Backend API:
http://127.0.0.1:8000

API Documentation:
http://127.0.0.1:8000/docs

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL shown in your terminal.

## Security Note

- Never upload API keys or passwords to GitHub.
- AI-powered features send submitted code to the configured Groq API.
- Do not submit confidential source code or secrets.
- Uploaded code is analyzed statically and is not directly executed by the analyzer.

## Current Limitations

- Python is currently supported.
- Code quality score is a heuristic, not a guarantee that code is bug-free.
- AI-generated fixes and tests should be reviewed before use.
- Generated unit tests are suggestions and are not automatically executed.

## Author

**Srivalli**

Built as an AI Full Stack Development Project.
