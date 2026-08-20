# ScriptFlow AI — FastAPI Backend

FastAPI backend for the LangGraph sequential content transformation pipeline.

## Workflow

Raw Input → Editor → Scriptwriter → Hinglish Translator → Final Output

## Setup

```powershell
cd ..
python -m venv venv
venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Create `.env` from `.env.example` and add your Groq API key:

```env
GROQ_API_KEY=your_key_here
```

## Run

```powershell
cd backend
python -m uvicorn api:app --reload --host 127.0.0.1 --port 8000
```

API:
- GET `/`
- GET `/health`
- POST `/api/generate`

Swagger documentation:
`http://127.0.0.1:8000/docs`
