# HireIn - AI Recruitment Platform

HireIn is a full-stack AI-powered recruitment platform designed to automate resume screening, candidate ranking, recruiter assistance, interview analysis, and hiring analytics. The platform combines modern web technologies with Natural Language Processing (NLP), semantic search, and machine learning techniques to streamline the recruitment process and reduce manual screening effort.

## Live Deployment

### Frontend
🌐 https://hire-in-fwc.vercel.app/

### Backend API
🔗 https://hire-in-fwc-1.onrender.com/

### AI Engine
🤖 https://hire-in-fwc-2.onrender.com/

## Key Highlights

* AI-powered resume screening and candidate ranking.
* Semantic matching using transformer-based embeddings.
* Retrieval-Augmented Generation (RAG) based recruiter assistant.
* Interview transcript and video analysis.
* Bulk resume screening for recruiters.
* Role-based recruiter and candidate dashboards.
* Full-stack architecture using React, Node.js, PostgreSQL, and FastAPI.

## Features

### Candidate Features

* Register and authenticate securely.
* Browse and search available job postings.
* Apply to active job openings.
* Upload, replace, or delete resumes before application deadlines.
* Track application status and screening results.
* View detailed application information and recruiter feedback.
* Manage profile information and application history.

### Recruiter Features

* Create and manage job postings.
* Review candidate applications.
* Screen resumes using AI-powered evaluation.
* Compare candidates based on screening results.
* Perform bulk resume screening.
* Access ranked candidate lists.
* Use a recruiter assistant for candidate discovery.
* Analyze interview transcripts and videos.
* View hiring analytics and recruitment insights.

## System Architecture

```text
Candidate / Recruiter
          │
          ▼
Frontend (React + Vite)
          │
          ▼
Backend (Node.js + Express)
          │
 ┌────────┴────────┐
 ▼                 ▼
PostgreSQL      FastAPI AI Engine
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
 Resume Screening  RAG Search  Interview Analysis
```

### Frontend

* Provides dedicated dashboards for recruiters and candidates.
* Handles authentication, routing, forms, and user interactions.
* Displays candidate rankings, analytics, and screening results.
* Integrates with backend APIs through a centralized service layer.

### Backend

* Manages authentication and authorization.
* Handles job creation and application workflows.
* Stores application and resume data in PostgreSQL.
* Coordinates communication with the AI engine.
* Manages resume and interview file uploads.
* Enforces role-based access control and application rules.

### AI Engine

* Extracts and processes resume content.
* Performs skill extraction and normalization.
* Computes semantic similarity between resumes and job descriptions.
* Generates candidate scores and rankings.
* Supports recruiter search and retrieval.
* Analyzes interview transcripts and videos.
* Generates AI-driven candidate insights and explanations.

## AI Screening Workflow

1. A candidate uploads a resume in PDF format.
2. Resume text is extracted using PyMuPDF.
3. Skills are identified and normalized using a predefined skill dictionary.
4. Sentence embeddings are generated using the BAAI/bge-small-en-v1.5 model.
5. Resume content is compared against the job description.
6. Experience information is extracted and evaluated.
7. Skill coverage, semantic similarity, and experience fit are calculated.
8. A final candidate score is generated.
9. Matched skills, missing skills, and candidate insights are returned.

## Recruiter Assistant

The recruiter assistant implements a Retrieval-Augmented Generation (RAG) workflow to help recruiters discover suitable candidates using natural language queries.

### Capabilities

* Search candidates using natural language.
* Retrieve candidates based on skills and experience.
* Perform semantic matching across candidate profiles.
* Provide evidence-based candidate recommendations.
* Support recruiter decision-making during shortlisting.

### Example Queries

* Find candidates with Python and SQL experience.
* Show candidates suitable for backend development roles.
* Identify candidates with machine learning experience.
* Find shortlisted candidates with FastAPI and PostgreSQL skills.

## Interview Analysis

The platform supports both transcript-based and video-based interview evaluation.

### Features

* Automated transcript analysis.
* Video interview transcription using Faster-Whisper.
* Communication quality assessment.
* Technical relevance evaluation.
* Confidence scoring.
* Automated recruiter feedback generation.

### Evaluation Parameters

* Technical relevance.
* Communication effectiveness.
* Vocabulary diversity.
* Confidence indicators.
* Filler word analysis.
* Overall interview performance.

## Technology Stack

### Frontend

* React
* Vite
* React Router
* Recharts
* Lucide React
* CSS

### Backend

* Node.js
* Express.js
* PostgreSQL
* JWT Authentication
* Multer
* Axios
* Bcrypt

### AI / Machine Learning

* FastAPI
* Sentence Transformers
* BAAI/bge-small-en-v1.5
* Scikit-learn
* NumPy
* PyMuPDF
* Faster-Whisper
* Gemini API
* OpenAI API

## Core Modules

### Resume Screening Engine

* Resume parsing and text extraction.
* Skill identification and normalization.
* Semantic similarity computation.
* Candidate scoring and ranking.

### Candidate Ranking System

* Skill coverage analysis.
* Experience evaluation.
* Semantic alignment scoring.
* Candidate comparison.

### Recruiter Assistant

* Semantic search.
* Candidate retrieval.
* Natural language querying.
* Context-aware recommendations.

### Interview Analysis System

* Transcript processing.
* Video transcription.
* Interview scoring.
* Feedback generation.

### Analytics Dashboard

* Candidate score distribution.
* Application volume trends.
* Hiring funnel insights.
* Skill gap analysis.

## Database Design

The platform uses PostgreSQL as the primary database.

### Core Tables

* Users
* Jobs
* Applications
* Resumes
* Bulk Screening Runs
* Bulk Screening Results
* Interview Results

### Stored Information

* User accounts and roles.
* Job descriptions and requirements.
* Candidate applications.
* Resume metadata.
* Screening results.
* Interview evaluations.
* Analytics data.

## Project Structure

```text
HireIn/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   ├── uploads/
│   ├── scripts/
│   └── package.json
│
├── ai-engine/
│   ├── main.py
│   ├── models.py
│   ├── resume_matcher.py
│   ├── resume_parser.py
│   ├── skills.py
│   └── requirements.txt
│
└── database/
```

## Setup

### Clone Repository

```bash
git clone <repository-url>
cd HireIn
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

### AI Engine Setup

```bash
cd ai-engine

python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux / macOS
source .venv/bin/activate

pip install -r requirements.txt

uvicorn main:app --reload --port 8000
```

## Environment Variables

### Backend

```env
PORT=5000

DB_USER=postgres
DB_HOST=localhost
DB_NAME=talent_find
DB_PASSWORD=your_password
DB_PORT=5432

JWT_SECRET=your_secret_key

AI_ENGINE_URL=http://localhost:8000
```

### AI Engine

```env
EMBEDDING_MODEL_NAME=BAAI/bge-small-en-v1.5

GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-2.5-flash

OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4o-mini
```

## Future Enhancements

* Integrate vector databases such as FAISS, Chroma, or pgvector.
* Add OCR support for scanned resumes.
* Implement cloud-based file storage.
* Add benchmark-driven evaluation metrics.
* Introduce background processing for large screening tasks.
* Expand recruiter analytics and reporting capabilities.
* Add email notification workflows.
* Improve candidate recommendation accuracy through model evaluation.
