import React, { useState } from "react";

const API = import.meta.env.VITE_API_URL || "https://faithlearn-ai.onrender.com";

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I'm FaithLearn AI. Ask me to teach a lesson, create a quiz, show Mary's progress, or recommend her next lesson."
    }
  ]);

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    const text = input.trim();

    if (!text || busy) return;

    setInput("");

    setMessages((m) => [
      ...m,
      {
        role: "user",
        text
      }
    ]);

    setBusy(true);

    try {
      const response = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: text
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Chat request failed");
      }

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: data.response
        }
      ]);
    } catch (error) {
      console.error(error);

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "I couldn't reach FaithLearn AI. Please make sure the API server is running."
        }
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">FL</span>

          <div>
            <strong>FaithLearn AI</strong>
            <small>Agentic Learning Companion</small>
          </div>
        </div>

        <span className="status">● AI Online</span>
      </header>

      <main className="layout">
        <section className="hero">
          <span className="eyebrow">
            ALEXA+ HACKATHON • AI EDUCATION
          </span>

          <h1>
            Learning that
            <br />
            <span>understands context.</span>
          </h1>

          <p>
            FaithLearn AI turns a simple conversation into personalized
            lessons, quizzes, progress checks, and next-step recommendations.
          </p>

          <div className="cards">
            <div>
              <b>AI Tutor</b>
              <span>Personalized lessons</span>
            </div>

            <div>
              <b>MCP Tools</b>
              <span>Actions, not just answers</span>
            </div>

            <div>
              <b>Progress</b>
              <span>Learning state</span>
            </div>
          </div>
        </section>

        <section className="chat">
          <div className="chathead">
            <div>
              <b>FaithLearn Assistant</b>
              <span>Powered by Amazon Bedrock</span>
            </div>

            <div className="avatar">AI</div>
          </div>

          <div className="messages">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`message ${m.role}`}
              >
                <span>{m.text}</span>
              </div>
            ))}

            {busy && (
              <div className="message assistant">
                <span>Thinking and using learning tools…</span>
              </div>
            )}
          </div>

          <div className="suggestions">
            <button
              onClick={() =>
                setInput("Show me Mary's current learning progress")
              }
            >
              Show progress
            </button>

            <button
              onClick={() =>
                setInput(
                  "Create a 3-question mathematics quiz for Mary about division"
                )
              }
            >
              Create quiz
            </button>

            <button
              onClick={() =>
                setInput(
                  "Teach me fractions in a simple way for a 10-year-old"
                )
              }
            >
              Teach fractions
            </button>
          </div>

          <div className="composer">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  send();
                }
              }}
              placeholder="Ask FaithLearn anything…"
              disabled={busy}
            />

            <button
              onClick={send}
              disabled={busy}
            >
              {busy ? "Thinking…" : "Send"}
            </button>
          </div>
        </section>
      </main>

      <footer>
        FaithLearn AI • Open source prototype • MCP-powered education
      </footer>
    </div>
  );
}