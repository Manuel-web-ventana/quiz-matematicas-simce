
export interface Question {
  id: number;
  question: string;
  image?: string;
  options: { [key: string]: string };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  section: string;
}

export interface Student {
  name: string;
  course: string;
}

export type Answers = {
  [questionId: number]: 'A' | 'B' | 'C' | 'D' | null;
};

export enum Medal {
  None = 'None',
  Bronze = 'Bronze',
  Silver = 'Silver',
  Gold = 'Gold',
  Diamond = 'Diamond',
}

export interface QuizResult {
  student: Student;
  questions: Question[];
  answers: Answers;
  score: number;
  percentage: number;
  timeTaken: number; // in seconds
  medal: Medal;
  date: string;
  section: string;
}

export type AppView = 'splash' | 'selection' | 'quiz' | 'results';
export type SectionId = 'full' | 'section1' | 'section2' | 'section3' | 'section4';
