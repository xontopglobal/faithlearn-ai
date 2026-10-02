# FaithLearn AI

FaithLearn AI is an agentic learning companion for children, parents, teachers, and community educators.

## Hackathon track

- Primary: Alexa+
- Mini challenge: AWS Builder
- Open-source project: MIT licensed

## Architecture

React/Vite web app → Node.js API → MCP server (Streamable HTTP) → learning tools → in-memory demo data.

The first demo intentionally works without external credentials. Add an AWS/Bedrock adapter later through the documented environment variables.

## Requirements

- Node.js 20+
- npm 10+

## Run

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

The API runs on http://localhost:8787.

## MCP endpoint

```text
http://localhost:8787/mcp
```

The server exposes learning tools including:

- `get_student_progress`
- `get_lesson`
- `create_quiz`
- `grade_answer`
- `recommend_lesson`

## Environment

Copy `.env.example` to `.env`.

The demo does not require an API key.

## Project structure

```text
faithlearn-ai/
├── apps/
│   └── web/
├── server/
│   ├── src/
│   │   ├── data/
│   │   ├── mcp/
│   │   └── index.js
│   └── package.json
├── .env.example
├── LICENSE
├── package.json
└── README.md
```

## Open source

Released under the MIT License.
