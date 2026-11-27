
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from analyzer import analyze_code
from ai_reviewer import (
    explain_code,
    auto_fix_code,
    generate_unit_tests
)

from database import (
    initialize_database,
    save_review,
    get_all_reviews,
    get_review_by_id
)


app = FastAPI(
    title="CodeGuard AI",
    description="AI-powered Code Review and Bug Prediction System",
    version="1.0.0"
)


# Allow frontend websites to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "https://code-guard-ai-elow.vercel.app",
        "https://code-guard-ai-elow-ozkbvxx2p-nelapati-srivallis-projects.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


class CodeRequest(BaseModel):
    code: str = Field(min_length=1, max_length=50000)
    language: str = "python"


@app.on_event("startup")
def startup():
    initialize_database()


@app.get("/")
def home():
    return {
        "message": "Welcome to CodeGuard AI",
        "status": "Running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "application": "CodeGuard AI"
    }


# Static Code Review
@app.post("/review")
def review_code(request: CodeRequest):

    if request.language.lower() != "python":
        raise HTTPException(
            status_code=400,
            detail="Currently only Python is supported."
        )

    if not request.code.strip():
        raise HTTPException(
            status_code=400,
            detail="Code cannot be empty."
        )

    result = analyze_code(request.code)

    history_id = save_review(
        request.code,
        request.language,
        result
    )

    return {
        "project": "CodeGuard AI",
        "language": request.language,
        "review": result,
        "history_id": history_id
    }


# AI Code Explanation
@app.post("/ai-explain")
def ai_explain_code(request: CodeRequest):

    if request.language.lower() != "python":
        raise HTTPException(
            status_code=400,
            detail="Currently only Python is supported."
        )

    if not request.code.strip():
        raise HTTPException(
            status_code=400,
            detail="Code cannot be empty."
        )

    static_result = analyze_code(request.code)

    try:
        explanation = explain_code(
            request.code,
            static_result
        )

        history_id = save_review(
            request.code,
            request.language,
            static_result
        )

        return {
            "project": "CodeGuard AI",
            "language": request.language,
            "static_review": static_result,
            "ai_explanation": explanation,
            "history_id": history_id
        }

    except RuntimeError:
        raise HTTPException(
            status_code=503,
            detail="Groq API key is missing or AI response failed."
        )

    except Exception:
        raise HTTPException(
            status_code=502,
            detail="AI review failed. Check your Groq API configuration."
        )


# AI Auto Fix
@app.post("/auto-fix")
def fix_code(request: CodeRequest):

    if request.language.lower() != "python":
        raise HTTPException(
            status_code=400,
            detail="Currently only Python is supported."
        )

    if not request.code.strip():
        raise HTTPException(
            status_code=400,
            detail="Code cannot be empty."
        )

    static_result = analyze_code(request.code)

    try:
        fix_result = auto_fix_code(
            request.code,
            static_result
        )

        history_id = save_review(
            request.code,
            request.language,
            static_result
        )

        return {
            "project": "CodeGuard AI",
            "language": request.language,
            "original_code": request.code,
            "static_review": static_result,
            "auto_fix": fix_result,
            "history_id": history_id
        }

    except RuntimeError as error:
        raise HTTPException(
            status_code=502,
            detail=str(error)
        )

    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Auto-fix failed. Please try again."
        )


# AI Unit Test Generator
@app.post("/generate-tests")
def create_unit_tests(request: CodeRequest):

    if request.language.lower() != "python":
        raise HTTPException(
            status_code=400,
            detail="Currently only Python is supported."
        )

    if not request.code.strip():
        raise HTTPException(
            status_code=400,
            detail="Code cannot be empty."
        )

    try:
        tests = generate_unit_tests(request.code)

        return {
            "project": "CodeGuard AI",
            "language": request.language,
            "generated_tests": tests,
            "framework": "pytest"
        }

    except RuntimeError as error:
        raise HTTPException(
            status_code=502,
            detail=str(error)
        )

    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Unit test generation failed. Please try again."
        )


# Review History
@app.get("/history")
def review_history():

    reviews = get_all_reviews()

    return {
        "total_reviews": len(reviews),
        "history": reviews
    }


# Individual Review History
@app.get("/history/{review_id}")
def review_history_details(review_id: int):

    review = get_review_by_id(review_id)

    if review is None:
        raise HTTPException(
            status_code=404,
            detail="Review history not found."
        )

    return review

