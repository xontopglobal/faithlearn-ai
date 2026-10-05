import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const API =
  import.meta.env.VITE_API_URL || "https://faithlearn-ai.onrender.com";

/* =========================================================
   SUPABASE
   ========================================================= */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    flowType: "pkce",
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});

/* =========================================================
   DEFAULT STUDENT PROFILE
   ========================================================= */

const defaultProfile = {
  name: "Mary",
  age: "10",
  classLevel: "Primary 5",
  favoriteSubject: "Mathematics",
};

/* =========================================================
   APP
   ========================================================= */

export default function App() {
  /* =======================================================
     AUTH STATE
     ======================================================= */

  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  /* =======================================================
     FACEBOOK LOGIN
     ======================================================= */

  const signInWithFacebook = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        console.error("Facebook login error:", error);
        alert(error.message);
      }
    } catch (error) {
      console.error("Facebook login exception:", error);
      alert("Facebook login failed. Please try again.");
    }
  };

  /* =======================================================
     LOAD SESSION + LISTEN FOR AUTH CHANGES
     ======================================================= */

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Get session error:", error);
        }

        if (mounted) {
          setSession(session);
          setAuthLoading(false);
        }
      } catch (error) {
        console.error("Session loading error:", error);

        if (mounted) {
          setSession(null);
          setAuthLoading(false);
        }
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("SUPABASE AUTH EVENT:", event);

      if (mounted) {
        setSession(newSession);
        setAuthLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /* =======================================================
     SIGN OUT
     ======================================================= */

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut({
        scope: "local",
      });

      if (error) {
        console.error("Sign out error:", error);
        alert(error.message);
        return;
      }

      setSession(null);

      // Immediately leave the protected application view
      window.location.replace(window.location.origin);
    } catch (error) {
      console.error("Sign out exception:", error);
      alert("Sign out failed. Please try again.");
    }
  };
  /* =======================================================
     STUDENT PROFILE
     ======================================================= */

  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem("faithlearn_student_profile");
      return saved ? JSON.parse(saved) : defaultProfile;
    } catch {
      return defaultProfile;
    }
  });

  const [editingProfile, setEditingProfile] = useState(false);

  /* =======================================================
     CHAT
     ======================================================= */

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: `Hello ${profile.name}! I'm FaithLearn AI. Ask me to teach a lesson, create a quiz, show your progress, or recommend your next lesson.`,
    },
  ]);

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  /* =======================================================
     SAVE PROFILE TO LOCAL STORAGE
     ======================================================= */

  useEffect(() => {
    try {
      localStorage.setItem(
        "faithlearn_student_profile",
        JSON.stringify(profile)
      );
    } catch (error) {
      console.error("Could not save student profile:", error);
    }
  }, [profile]);

  /* =======================================================
     SAVE PROFILE
     ======================================================= */

  function saveProfile() {
    setEditingProfile(false);

    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        text: `Great, ${profile.name}! I've updated your learning profile. I'll use your age, class level, and favorite subject to personalize your learning experience.`,
      },
    ]);
  }

  /* =======================================================
     DASHBOARD ACTION HELPER
     ======================================================= */

  function startLearning(prompt) {
    setInput(prompt);

    window.setTimeout(() => {
      document.querySelector(".composer input")?.focus();
    }, 0);
  }

  /* =======================================================
     SEND CHAT MESSAGE
     ======================================================= */

  async function send() {
    const text = input.trim();

    if (!text || busy) return;

    setInput("");

    setMessages((m) => [
      ...m,
      {
        role: "user",
        text,
      },
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

Please personalize your response for this student.
Explain concepts at an appropriate level for the student's age and class.
Be encouraging, clear, educational, and practical.
      `.trim();

      const response = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: personalizedMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Chat request failed");
      }

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: data.response,
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "I couldn't reach FaithLearn AI. Please make sure the API server is running.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  /* =======================================================
     LOADING AUTH
     ======================================================= */

  if (authLoading) {
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

          <span className="status">● Checking login...</span>
        </header>

        <main className="layout">
          <section className="hero">
            <h1>
              Learning that
              <br />
              <span>understands context.</span>
            </h1>

            <p>Checking your secure Facebook session...</p>
          </section>
        </main>
      </div>
    );
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

        {session ? (
          <div className="auth-area">
            <span>Logged in with Facebook</span>

            <button type="button" onClick={signOut}>
              Sign out
            </button>
          </div>
        ) : (
          <button type="button" onClick={signInWithFacebook}>
            Continue with Facebook
          </button>
        )}
      </header>

      <main className="layout">
        {/* =================================================
            HERO
            ================================================= */}

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

          {/* =================================================
              STUDENT LEARNING DASHBOARD
              ================================================= */}

          <section className="learning-dashboard">
            <div className="dashboard-welcome">
              <div>
                <span className="dashboard-eyebrow">
                  YOUR LEARNING JOURNEY
                </span>

                <h2>Welcome back, {profile.name}! 👋</h2>

                <p>
                  Keep learning, keep growing, and let FaithLearn AI
                  guide you to your next breakthrough.
                </p>
              </div>

              <div className="learning-badge">
                <span>🎓</span>
                <div>
                  <strong>{profile.classLevel}</strong>
                  <small>Current Level</small>
                </div>
              </div>
            </div>

            <div className="dashboard-stats">
              <div className="dashboard-stat">
                <div className="stat-icon">📚</div>

                <div className="stat-copy">
                  <strong>68%</strong>
                  <span>Learning Progress</span>
                </div>

                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: "68%" }}
                  />
                </div>
              </div>

              <div className="dashboard-stat">
                <div className="stat-icon">🔥</div>

                <div className="stat-copy">
                  <strong>5 Days</strong>
                  <span>Learning Streak</span>
                </div>

                <small>Keep it going!</small>
              </div>

              <div className="dashboard-stat">
                <div className="stat-icon">🎯</div>

                <div className="stat-copy">
                  <strong>{profile.favoriteSubject}</strong>
                  <span>Subject Focus</span>
                </div>

                <small>Your favorite subject</small>
              </div>
            </div>

            <div className="next-lesson">
              <div className="next-lesson-content">
                <span className="lesson-label">
                  ✨ RECOMMENDED NEXT LESSON
                </span>

                <h3>
                  Master {profile.favoriteSubject}
                </h3>

                <p>
                  Let FaithLearn AI create a personalized lesson
                  based on your current level and learning goals.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    startLearning(
                      `Recommend the next ${profile.favoriteSubject} lesson for ${profile.name} based on ${profile.classLevel}. Teach the lesson step by step.`
                    )
                  }
                >
                  Start Next Lesson →
                </button>
              </div>

              <div className="lesson-illustration">🚀</div>
            </div>

            <div className="quick-learning">
              <div className="quick-learning-header">
                <div>
                  <span className="dashboard-eyebrow">
                    QUICK LEARNING
                  </span>

                  <h3>What would you like to do?</h3>
                </div>
              </div>

              <div className="quick-learning-grid">
                <button
                  type="button"
                  onClick={() =>
                    startLearning(
                      `Teach ${profile.name} an interesting ${profile.favoriteSubject} lesson appropriate for ${profile.classLevel}.`
                    )
                  }
                >
                  <span>📖</span>
                  <strong>Teach Me</strong>
                  <small>Start a personalized lesson</small>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    startLearning(
                      `Create a 5-question ${profile.favoriteSubject} quiz for ${profile.name} at ${profile.classLevel} level.`
                    )
                  }
                >
                  <span>🧠</span>
                  <strong>Create Quiz</strong>
                  <small>Test what you know</small>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    startLearning(
                      `Show ${profile.name}'s current learning progress and explain what ${profile.name} should improve next.`
                    )
                  }
                >
                  <span>📊</span>
                  <strong>My Progress</strong>
                  <small>See your learning journey</small>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    startLearning(
                      `Recommend the next lesson for ${profile.name}. Consider the student's age ${profile.age}, level ${profile.classLevel}, and favorite subject ${profile.favoriteSubject}.`
                    )
                  }
                >
                  <span>🎯</span>
                  <strong>Next Lesson</strong>
                  <small>Get your next challenge</small>
                </button>
              </div>
            </div>
          </section>

          {/* =================================================
              STUDENT PROFILE
              ================================================= */}

          <div className="profile-card">
            <div className="profile-header">
              <div>
                <b>Student Profile</b>

                <span>
                  {profile.name} • {profile.classLevel}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setEditingProfile(true)}
              >
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

          {/* =================================================
              PROFILE EDITOR
              ================================================= */}

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
                      name: e.target.value,
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
                      age: e.target.value,
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
                      classLevel: e.target.value,
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
                      favoriteSubject: e.target.value,
                    })
                  }
                  placeholder="e.g. Mathematics"
                />
              </label>

              <div className="profile-actions">
                <button
                  type="button"
                  onClick={() => setEditingProfile(false)}
                >
                  Cancel
                </button>

                <button type="button" onClick={saveProfile}>
                  Save Profile
                </button>
              </div>
            </div>
          )}
        </section>

        {/* =================================================
            CHAT
            ================================================= */}

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
              type="button"
              onClick={() =>
                setInput(
                  `Show ${profile.name}'s current learning progress`
                )
              }
            >
              Show progress
            </button>

            <button
              type="button"
              onClick={() =>
                setInput(
                  `Create a 3-question ${profile.favoriteSubject} quiz for ${profile.name}`
                )
              }
            >
              Create quiz
            </button>

            <button
              type="button"
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
              type="button"
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

      <style>{`
        .learning-dashboard {
          margin: 32px 0;
          padding: 28px;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          background: linear-gradient(145deg, rgba(20,30,55,0.96), rgba(12,18,35,0.96));
          box-shadow: 0 20px 50px rgba(0,0,0,0.18);
        }

        .dashboard-welcome {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 24px;
        }

        .dashboard-eyebrow {
          display: inline-block;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
          opacity: 0.7;
          margin-bottom: 8px;
        }

        .dashboard-welcome h2 {
          margin: 0 0 8px;
          font-size: clamp(24px, 4vw, 36px);
        }

        .dashboard-welcome p {
          margin: 0;
          max-width: 650px;
          line-height: 1.6;
          opacity: 0.75;
        }

        .learning-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          border-radius: 16px;
          background: rgba(255,255,255,0.07);
          white-space: nowrap;
        }

        .learning-badge > span {
          font-size: 28px;
        }

        .learning-badge div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .learning-badge small,
        .dashboard-stat small,
        .quick-learning-grid small {
          opacity: 0.65;
        }

        .dashboard-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }

        .dashboard-stat {
          position: relative;
          min-height: 120px;
          padding: 20px;
          border-radius: 18px;
          background: rgba(255,255,255,0.055);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .stat-icon {
          font-size: 25px;
          margin-bottom: 12px;
        }

        .stat-copy {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-copy strong {
          font-size: 22px;
        }

        .stat-copy span {
          opacity: 0.68;
          font-size: 13px;
        }

        .dashboard-stat > small {
          display: block;
          margin-top: 10px;
          font-size: 12px;
        }

        .progress-bar {
          height: 7px;
          margin-top: 13px;
          overflow: hidden;
          border-radius: 99px;
          background: rgba(255,255,255,0.1);
        }

        .progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #6ee7b7, #60a5fa);
        }

        .next-lesson {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding: 24px;
          margin-bottom: 24px;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(96,165,250,0.14), rgba(110,231,183,0.08));
          border: 1px solid rgba(96,165,250,0.18);
        }

        .lesson-label {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.3px;
          opacity: 0.75;
        }

        .next-lesson h3 {
          margin: 8px 0;
          font-size: 25px;
        }

        .next-lesson p {
          max-width: 650px;
          line-height: 1.6;
          opacity: 0.72;
          margin-bottom: 16px;
        }

        .next-lesson button {
          border: 0;
          border-radius: 12px;
          padding: 12px 18px;
          cursor: pointer;
          font-weight: 800;
          background: #fff;
          color: #111827;
        }

        .lesson-illustration {
          font-size: 72px;
          padding: 20px;
        }

        .quick-learning-header h3 {
          margin: 0 0 16px;
          font-size: 20px;
        }

        .quick-learning-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .quick-learning-grid button {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 7px;
          text-align: left;
          padding: 18px;
          min-height: 135px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.045);
          color: inherit;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease;
        }

        .quick-learning-grid button:hover {
          transform: translateY(-3px);
          background: rgba(255,255,255,0.09);
        }

        .quick-learning-grid button > span {
          font-size: 27px;
        }

        .quick-learning-grid strong {
          font-size: 15px;
        }

        .quick-learning-grid small {
          line-height: 1.4;
        }

        @media (max-width: 900px) {
          .dashboard-stats,
          .quick-learning-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .dashboard-welcome,
          .next-lesson {
            align-items: flex-start;
          }
        }

        @media (max-width: 600px) {
          .learning-dashboard {
            padding: 18px;
            border-radius: 18px;
          }

          .dashboard-welcome,
          .next-lesson {
            flex-direction: column;
          }

          .learning-badge {
            width: 100%;
            box-sizing: border-box;
          }

          .dashboard-stats,
          .quick-learning-grid {
            grid-template-columns: 1fr;
          }

          .lesson-illustration {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
