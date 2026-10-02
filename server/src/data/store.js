const students = {
  demo: {
    id: "demo",
    name: "Mary",
    age: 10,
    grade: "Basic 5",
    subjects: {
      Mathematics: { lessons: 14, score: 82, focus: "Division" },
      English: { lessons: 11, score: 88, focus: "Reading comprehension" },
      Science: { lessons: 9, score: 79, focus: "Living things" }
    }
  }
};

export function getStudent(id = "demo") {
  return students[id] ?? students.demo;
}

export function saveQuizResult(studentId, subject, score) {
  const student = getStudent(studentId);
  const current = student.subjects[subject] ?? { lessons: 0, score: 0, focus: "Practice" };
  current.lessons += 1;
  current.score = Math.round((current.score + score) / 2);
  student.subjects[subject] = current;
  return student;
}
