import { getStudent, saveQuizResult } from "../data/store.js";

export const tools = [
  {
    name: "get_student_progress",
    description: "Get a student's learning progress, scores, and focus areas.",
    inputSchema: {
      type: "object",
      properties: { studentId: { type: "string" } }
    }
  },
  {
    name: "get_lesson",
    description: "Get a short age-appropriate lesson.",
    inputSchema: {
      type: "object",
      properties: {
        subject: { type: "string" },
        topic: { type: "string" },
        age: { type: "number" }
      },
      required: ["subject", "topic"]
    }
  },
  {
    name: "create_quiz",
    description: "Create a short practice quiz.",
    inputSchema: {
      type: "object",
      properties: {
        subject: { type: "string" },
        topic: { type: "string" },
        count: { type: "number" }
      },
      required: ["subject", "topic"]
    }
  },
  {
    name: "grade_answer",
    description: "Grade a simple answer and return feedback.",
    inputSchema: {
      type: "object",
      properties: {
        answer: { type: "string" },
        expected: { type: "string" },
        studentId: { type: "string" },
        subject: { type: "string" }
      },
      required: ["answer", "expected"]
    }
  },
  {
    name: "recommend_lesson",
    description: "Recommend the next lesson from student progress.",
    inputSchema: {
      type: "object",
      properties: { studentId: { type: "string" } }
    }
  }
];

export async function callTool(name, args = {}) {
  switch (name) {
    case "get_student_progress": {
      const student = getStudent(args.studentId);
      return {
        student: student.name,
        grade: student.grade,
        subjects: student.subjects,
        summary: "Mary is progressing well. Division is the main mathematics focus."
      };
    }
    case "get_lesson":
      return {
        subject: args.subject,
        topic: args.topic,
        title: `${args.topic}: a quick lesson`,
        explanation: `Let's learn ${args.topic} step by step. We will use simple examples and then practice.`,
        example: "If 20 sweets are shared equally between 2 children, each child gets 10 sweets.",
        challenge: "What is one-half of 20?"
      };
    case "create_quiz":
      return {
        subject: args.subject,
        topic: args.topic,
        questions: [
          { id: 1, question: "What is one-half of 20?", answer: "10" },
          { id: 2, question: "What is 20 divided by 5?", answer: "4" },
          { id: 3, question: "What is 3 × 4?", answer: "12" }
        ].slice(0, Math.max(1, Math.min(args.count || 3, 3)))
      };
    case "grade_answer": {
      const correct = String(args.answer).trim().toLowerCase() === String(args.expected).trim().toLowerCase();
      if (args.studentId && args.subject) saveQuizResult(args.studentId, args.subject, correct ? 100 : 50);
      return {
        correct,
        score: correct ? 100 : 50,
        feedback: correct ? "Correct! Great work." : `Not quite. The expected answer is ${args.expected}.`
      };
    }
    case "recommend_lesson": {
      const student = getStudent(args.studentId);
      const weakest = Object.entries(student.subjects).sort((a,b) => a[1].score - b[1].score)[0];
      return {
        subject: weakest[0],
        topic: weakest[1].focus,
        reason: `${weakest[0]} currently has the lowest practice score.`,
        duration: "10 minutes"
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
