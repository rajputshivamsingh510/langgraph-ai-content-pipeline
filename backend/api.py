import os
from typing import TypedDict

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, START, END

load_dotenv()


# ─────────────────────────────────────────────────────────────────────────────
# LangGraph state
# ─────────────────────────────────────────────────────────────────────────────

class PipelineState(TypedDict):
    raw_input: str
    edited_text: str
    script_text: str
    final_output: str


# ─────────────────────────────────────────────────────────────────────────────
# LLM
# ─────────────────────────────────────────────────────────────────────────────

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise RuntimeError(
        "GROQ_API_KEY is missing. Add it to backend/.env before starting the API."
    )

llm = ChatGroq(
    model="openai/gpt-oss-20b",
    temperature=0.7,
)


# ─────────────────────────────────────────────────────────────────────────────
# LangGraph nodes
# ─────────────────────────────────────────────────────────────────────────────

def editor_node(state: PipelineState) -> dict:
    prompt = (
        "You are an expert copyeditor. Clean up the following raw text. "
        "Fix any grammatical errors, spelling mistakes, and smooth out the "
        "transition flow while keeping the core message intact. "
        "Return only the edited text.\n\n"
        f"Text:\n{state['raw_input']}"
    )

    response = llm.invoke(prompt)

    return {"edited_text": response.content.strip()}


def scriptwriter_node(state: PipelineState) -> dict:
    prompt = (
        "You are a charismatic YouTube content creator. Take this edited text "
        "and transform it into a highly engaging, punchy, conversational video "
        "script hook. Make it sound like a real person speaking passionately. "
        "Return only the script content.\n\n"
        f"Edited Text:\n{state['edited_text']}"
    )

    response = llm.invoke(prompt)

    return {"script_text": response.content.strip()}


def translator_node(state: PipelineState) -> dict:
    prompt = (
        "You are an expert content localizer for the Indian market. Take the "
        "following script and convert it into natural, flowing 'Hinglish'. "
        "Do not simply translate it sentence-by-sentence or repeat information. "
        "Alternate comfortably between Hindi and English phrases just like an "
        "intellectual tech educator would speak naturally on a live stream. "
        "Keep the energy high. Return only the final Hinglish text.\n\n"
        f"Script:\n{state['script_text']}"
    )

    response = llm.invoke(prompt)

    return {"final_output": response.content.strip()}


# ─────────────────────────────────────────────────────────────────────────────
# Build graph
# ─────────────────────────────────────────────────────────────────────────────

graph = StateGraph(PipelineState)

graph.add_node("editor", editor_node)
graph.add_node("scriptwriter", scriptwriter_node)
graph.add_node("translator", translator_node)

graph.add_edge(START, "editor")
graph.add_edge("editor", "scriptwriter")
graph.add_edge("scriptwriter", "translator")
graph.add_edge("translator", END)

app_graph = graph.compile()


# ─────────────────────────────────────────────────────────────────────────────
# FastAPI
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="ScriptFlow AI API",
    description="FastAPI backend for the LangGraph sequential content pipeline.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://[::1]:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    raw_input: str = Field(
        ...,
        min_length=1,
        description="Raw content to process through the LangGraph pipeline.",
    )


class GenerateResponse(BaseModel):
    raw_input: str
    edited_text: str
    script_text: str
    final_output: str


@app.get("/")
def root():
    return {
        "name": "ScriptFlow AI API",
        "status": "online",
        "workflow": "editor -> scriptwriter -> translator",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/api/generate", response_model=GenerateResponse)
def generate(request: GenerateRequest):
    raw_input = request.raw_input.strip()

    if not raw_input:
        raise HTTPException(
            status_code=400,
            detail="raw_input cannot be empty.",
        )

    try:
        result = app_graph.invoke(
            {
                "raw_input": raw_input,
                "edited_text": "",
                "script_text": "",
                "final_output": "",
            }
        )

        return GenerateResponse(
            raw_input=raw_input,
            edited_text=result["edited_text"],
            script_text=result["script_text"],
            final_output=result["final_output"],
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Pipeline execution failed: {str(exc)}",
        ) from exc


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True)