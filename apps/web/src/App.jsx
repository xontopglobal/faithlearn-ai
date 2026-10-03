import React, { useEffect, useState } from "react";

const API =
  import.meta.env.VITE_API_URL || "https://faithlearn-ai.onrender.com";

const defaultProfile = {
  name: "Mary",
  age: "10",
  classLevel: "Primary 5",
  favoriteSubject: "Mathematics"
};

export default function App() {
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem("faithlearn_student_profile");
      return saved ? JSON.parse(saved) : defaultProfile;
    } catch {
      return defaultProfile;
    }
  });

  const [editingProfile, setEditingProfile] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: `Hello ${profile.name}! I'm FaithLearn AI. Ask me to teach a lesson, create a quiz, show your progress, or recommend your next lesson.`
    }
  ]);

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    localStorage.setItem(
      "faithlearn_student_profile",
      JSON.stringify(profile)
    );
  }, [profile]);

  function saveProfile() {
    setEditingProfile(false);

    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        text: `Great, ${profile.name}! I've updated your learning profile. I'll use your age, class level, and favorite subject to personalize your learning experience.`
      }
    ]);
  }

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
      const personalizedMessage = `
Student Profile:
Name: ${profile.name}
Age: ${profile.age}
Class/Level: ${profile.classLevel}
Favorite Subject: ${profile.favoriteSubject}

Student's Request:
${text}

Please personalize your response for this student. Explain concepts at an appropriate level for the student's age and class. Be encouraging, clear, educational, and practical.
      `.trim();

      const response = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: personalizedMessage
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

          <div className="profile-card">
            <div className="profile-header">
              <div>
                <b>Student Profile</b>
                <span>
                  {profile.name} • {profile.classLevel}
                </span>
              </div>

              <button onClick={() => setEditingProfile(true)}>
                Edit Profile
              </button>
            </div>

            <div className="profile-details">
              <span>
                <b>Name:</b> {profile.name}
              </span>

              <span>
                <b>Age:</b> {profile.age}
              </span>

              <span>
                <b>Level:</b> {profile.classLevel}
              </span>

              <span>
                <b>Favorite:</b> {profile.favoriteSubject}
              </span>
            </div>
          </div>

          {editingProfile && (
            <div className="profile-form">
              <h3>Personalize Your Learning</h3>

              <label>
                Student Name
                <input
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      name: e.target.value
                    })
                  }
                  placeholder="Enter student's name"
                />
              </label>

              <label>
                Age
                <input
                  type="number"
                  min="3"
                  max="100"
                  value={profile.age}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      age: e.target.value
                    })
                  }
                  placeholder="Student age"
                />
              </label>

              <label>
                Class / Level
                <input
                  value={profile.classLevel}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      classLevel: e.target.value
                    })
                  }
                  placeholder="e.g. Primary 5"
                />
              </label>

              <label>
                Favorite Subject
                <input
                  value={profile.favoriteSubject}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      favoriteSubject: e.target.value
                    })
                  }
                  placeholder="e.g. Mathematics"
                />
              </label>

              <div className="profile-actions">
                <button
                  onClick={() => setEditingProfile(false)}
                >
                  Cancel
                </button>

                <button onClick={saveProfile}>
                  Save Profile
                </button>
              </div>
            </div>
          )}
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
                setInput(
                  `Show ${profile.name}'s current learning progress`
                )
              }
            >
              Show progress
            </button>

            <button
              onClick={() =>
                setInput(
                  `Create a 3-question ${profile.favoriteSubject} quiz for ${profile.name}`
                )
              }
            >
              Create quiz
            </button>

            <button
              onClick={() =>
                setInput(
                  `Teach ${profile.name} fractions in a simple way for a ${profile.age}-year-old`
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