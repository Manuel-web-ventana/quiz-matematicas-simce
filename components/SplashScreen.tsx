
import React from 'react';

const Confetti: React.FC = () => {
  const confettiCount = 50;
  const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-50">
      {Array.from({ length: confettiCount }).map((_, i) => {
        const style = {
          left: `${Math.random() * 100}%`,
          backgroundColor: colors[Math.floor(Math.random() * colors.length)],
          animation: `fall ${Math.random() * 3 + 2}s linear ${Math.random() * 2}s infinite`,
          transform: `rotate(${Math.random() * 360}deg)`
        };
        const keyframes = `
          @keyframes fall {
            from { top: -10px; }
            to { top: 100%; }
          }
        `;
        return (
          <React.Fragment key={i}>
            <style>{keyframes}</style>
            <div
              className="absolute w-2 h-4 rounded-full"
              style={style}
            ></div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Confetti;

import React from 'react';
import { Medal } from '../types';
import Confetti from './Confetti';

interface MedalPopupProps {
  medal: Medal;
  'on-close': () => void;
}

const medalDetails: { [key in Medal]: { name: string; icon: string; color: string } } = {
  [Medal.Bronze]: { name: 'Bronce', icon: '🥉', color: 'from-amber-700 to-amber-500' },
  [Medal.Silver]: { name: 'Plata', icon: '🥈', color: 'from-slate-500 to-slate-300' },
  [Medal.Gold]: { name: 'Oro', icon: '🥇', color: 'from-yellow-500 to-yellow-300' },
  [Medal.Diamond]: { name: 'Diamante', icon: '💎', color: 'from-cyan-400 to-sky-200' },
  [Medal.None]: { name: '', icon: '', color: '' },
};

const MedalPopup: React.FC<MedalPopupProps> = ({ medal, 'on-close': onClose }) => {
  if (medal === Medal.None) return null;

  const details = medalDetails[medal];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate__animated animate__fadeIn" onClick={onClose}>
      <Confetti />
      <div
        className="relative bg-slate-800 border-2 border-slate-600 rounded-2xl p-8 text-center shadow-2xl animate__animated animate__zoomIn"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-3xl font-bold mb-2">¡Logro Desbloqueado!</h2>
        <div className={`text-8xl my-6 bg-clip-text text-transparent bg-gradient-to-br ${details.color}`}>{details.icon}</div>
        <p className="text-2xl font-semibold">Has ganado la medalla de <span className="font-extrabold">{details.name}</span></p>
        <button
          onClick={onClose}
          className="mt-8 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-lg transition-all"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default MedalPopup;
import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="w-full bg-slate-700 rounded-full h-4">
      <div
        className="bg-gradient-to-r from-cyan-500 to-teal-400 h-4 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${percentage}%` }}
      ></div>
      <span className="text-xs absolute w-full text-center -mt-4 text-white font-semibold">{current} / {total} Respondidas</span>
    </div>
  );
};

export default ProgressBar;

import React from 'react';
import { Question, Answers } from '../types';

interface QuestionNavigatorProps {
  questions: Question[];
  answers: Answers;
  currentIndex: number;
  onSelectQuestion: (index: number) => void;
}

const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({ questions, answers, currentIndex, onSelectQuestion }) => {

  const getStatusClass = (question: Question, index: number) => {
    const userAnswer = answers[question.id];
    if (index === currentIndex) {
      return 'bg-cyan-500 ring-2 ring-cyan-300';
    }
    if (userAnswer === null) {
      return 'bg-slate-600 hover:bg-slate-500';
    }
    if (userAnswer === question.correctAnswer) {
      return 'bg-green-600 hover:bg-green-500';
    }
    return 'bg-red-600 hover:bg-red-500';
  };

  return (
    <div className="p-4 bg-slate-700/50 rounded-lg">
      <h4 className="font-bold mb-4 text-center">Navegación</h4>
      <div className="grid grid-cols-5 gap-2">
        {questions.map((q, index) => (
          <button
            key={q.id}
            onClick={() => onSelectQuestion(index)}
            className={`w-10 h-10 flex items-center justify-center rounded-md font-bold text-white transition-all duration-200 ${getStatusClass(q, index)}`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuestionNavigator;

import React, { useState, useEffect, useCallback, useReducer } from 'react';
import { Question, Student, Answers, QuizResult, Medal } from '../types';
import { CONGRATULATORY_MESSAGES, MEDAL_THRESHOLDS } from '../constants';
import QuizQuestion from './QuizQuestion';
import Timer from './Timer';
import ProgressBar from './ProgressBar';
import QuestionNavigator from './QuestionNavigator';
import MedalPopup from './MedalPopup';
import Confetti from './Confetti';
import useAudio from '../hooks/useAudio';

interface QuizProps {
  student: Student;
  questions: Question[];
  onFinish: (result: QuizResult) => void;
  sectionTitle: string;
}

type QuizAction = 
  | { type: 'ANSWER_QUESTION'; payload: { questionId: number; answer: 'A' | 'B' | 'C' | 'D' } }
  | { type: 'SET_CURRENT_QUESTION'; payload: number }
  | { type: 'FINISH_QUIZ'; payload: { timeTaken: number } }
  | { type: 'SET_FEEDBACK'; payload: { questionId: number; feedback: string | null }};

interface QuizState {
  currentQuestionIndex: number;
  answers: Answers;
  isFinished: boolean;
  score: number;
  timeTaken: number;
  feedback: { [key: number]: string | null };
}

const initialState: QuizState = {
  currentQuestionIndex: 0,
  answers: {},
  isFinished: false,
  score: 0,
  timeTaken: 0,
  feedback: {},
};

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'ANSWER_QUESTION': {
      const { questionId, answer } = action.payload;
      return {
        ...state,
        answers: { ...state.answers, [questionId]: answer },
      };
    }
    case 'SET_CURRENT_QUESTION':
      return { ...state, currentQuestionIndex: action.payload };
    case 'FINISH_QUIZ':
        return { ...state, isFinished: true, timeTaken: action.payload.timeTaken };
    case 'SET_FEEDBACK':
        return { ...state, feedback: {...state.feedback, [action.payload.questionId]: action.payload.feedback} };
    default:
      return state;
  }
}


const Quiz: React.FC<QuizProps> = ({ student, questions, onFinish, sectionTitle }) => {
  const [state, dispatch] = useReducer(quizReducer, {
      ...initialState,
      answers: questions.reduce((acc, q) => ({...acc, [q.id]: null}), {})
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const playCorrectSound = useAudio('https://www.soundjay.com/buttons/sounds/button-3.mp3');
  const playIncorrectSound = useAudio('https://www.soundjay.com/buttons/sounds/button-10.mp3');

  const quizDuration = questions.length * 30; // 30 seconds per question

  const finishQuiz = useCallback(() => {
    let finalScore = 0;
    for (const q of questions) {
        if (state.answers[q.id] === q.correctAnswer) {
            finalScore++;
        }
    }
    const percentage = Math.round((finalScore / questions.length) * 100);
    
    let medal = Medal.None;
    if (percentage === 100) medal = Medal.Diamond;
    else if (percentage >= MEDAL_THRESHOLDS.Gold) medal = Medal.Gold;
    else if (percentage >= MEDAL_THRESHOLDS.Silver) medal = Medal.Silver;
    else if (percentage >= MEDAL_THRESHOLDS.Bronze) medal = Medal.Bronze;
    
    const result: QuizResult = {
        student,
        questions,
        answers: state.answers,
        score: finalScore,
        percentage,
        timeTaken: quizDuration - timeRemaining,
        medal,
        date: new Date().toLocaleString('es-CL'),
        section: sectionTitle,
    };
    onFinish(result);
  }, [state.answers, questions, student, onFinish, sectionTitle, quizDuration]);
  
  const [timeRemaining, setTimeRemaining] = useState(quizDuration);
  useEffect(() => {
      const timer = setInterval(() => {
          setTimeRemaining(prev => {
              if (prev <= 1) {
                  clearInterval(timer);
                  finishQuiz();
                  return 0;
              }
              return prev - 1;
          });
      }, 1000);
      return () => clearInterval(timer);
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnswer = useCallback((questionId: number, answer: 'A' | 'B' | 'C' | 'D') => {
    if (state.answers[questionId] !== null) return;
    
    dispatch({ type: 'ANSWER_QUESTION', payload: { questionId, answer } });
    
    const question = questions.find(q => q.id === questionId);
    if (question) {
        if (answer === question.correctAnswer) {
            playCorrectSound();
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
            const randomMsg = CONGRATULATORY_MESSAGES[Math.floor(Math.random() * CONGRATULATORY_MESSAGES.length)];
            dispatch({ type: 'SET_FEEDBACK', payload: { questionId, feedback: randomMsg } });
        } else {
            playIncorrectSound();
            dispatch({ type: 'SET_FEEDBACK', payload: { questionId, feedback: null } });
        }
    }
  }, [state.answers, questions, playCorrectSound, playIncorrectSound]);

  const handleNext = () => {
    if (state.currentQuestionIndex < questions.length - 1) {
      dispatch({ type: 'SET_CURRENT_QUESTION', payload: state.currentQuestionIndex + 1 });
    }
  };

  const handlePrev = () => {
    if (state.currentQuestionIndex > 0) {
      dispatch({ type: 'SET_CURRENT_QUESTION', payload: state.currentQuestionIndex - 1 });
    }
  };

  const handleSkip = () => {
    handleNext(); // Same as next for now
  };

  const handleSelectQuestion = (index: number) => {
    dispatch({ type: 'SET_CURRENT_QUESTION', payload: index });
  };
  
  const answeredCount = Object.values(state.answers).filter(a => a !== null).length;

  return (
    <div className="w-full relative">
      {showConfetti && <Confetti />}
      <div className="bg-slate-800 rounded-xl p-4 md:p-8 shadow-2xl border border-slate-700">
        <header className="mb-4">
          <div className="flex justify-between items-center mb-4 flex-wrap">
              <h2 className="text-xl font-bold text-cyan-400">{sectionTitle}</h2>
              <Timer initialTime={quizDuration} onTimeUp={finishQuiz} />
          </div>
          <ProgressBar current={answeredCount} total={questions.length} />
        </header>
        
        <div className="md:flex md:space-x-8">
            <div className="w-full md:w-3/4">
              <QuizQuestion
                question={questions[state.currentQuestionIndex]}
                userAnswer={state.answers[questions[state.currentQuestionIndex].id]}
                onAnswer={handleAnswer}
                feedbackMessage={state.feedback[questions[state.currentQuestionIndex].id]}
              />
            </div>
            <aside className="w-full md:w-1/4 mt-6 md:mt-0">
                <QuestionNavigator 
                    questions={questions}
                    answers={state.answers}
                    currentIndex={state.currentQuestionIndex}
                    onSelectQuestion={handleSelectQuestion}
                />
            </aside>
        </div>
        
        <footer className="mt-8 pt-6 border-t border-slate-700 flex flex-wrap justify-between items-center gap-4">
            <div>
                <button onClick={handlePrev} disabled={state.currentQuestionIndex === 0} className="bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white font-bold py-2 px-4 rounded transition">Anterior</button>
                <button onClick={handleNext} disabled={state.currentQuestionIndex === questions.length - 1} className="ml-2 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white font-bold py-2 px-4 rounded transition">Siguiente</button>
                <button onClick={handleSkip} className="ml-2 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded transition">Saltar</button>
            </div>
            <button onClick={finishQuiz} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition">Finalizar Ensayo</button>
        </footer>
      </div>
    </div>
  );
};

export default Quiz;

import React, { useState, useEffect } from 'react';
import { Question } from '../types';

interface QuizQuestionProps {
  question: Question;
  userAnswer: 'A' | 'B' | 'C' | 'D' | null;
  onAnswer: (questionId: number, answer: 'A' | 'B' | 'C' | 'D') => void;
  feedbackMessage: string | null;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({ question, userAnswer, onAnswer, feedbackMessage }) => {
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [showScorePopup, setShowScorePopup] = useState(false);
  
  useEffect(() => {
    setSelectedOption(userAnswer);
  }, [question, userAnswer]);

  const handleOptionClick = (option: 'A' | 'B' | 'C' | 'D') => {
    if (userAnswer !== null) return;
    setSelectedOption(option);
    onAnswer(question.id, option);
    if (option === question.correctAnswer) {
      setShowScorePopup(true);
      setTimeout(() => setShowScorePopup(false), 1000);
    }
  };

  const getOptionClass = (option: 'A' | 'B' | 'C' | 'D') => {
    if (userAnswer === null) {
      return 'hover:bg-slate-600 hover:border-cyan-500';
    }
    if (option === question.correctAnswer) {
      return 'bg-green-500/30 border-green-500 animate-pulse-green';
    }
    if (option === userAnswer && option !== question.correctAnswer) {
      return 'bg-red-500/30 border-red-500 animate-shake-red';
    }
    return 'opacity-50';
  };

  return (
    <div className="p-4 rounded-lg bg-slate-700/50 min-h-[400px] flex flex-col justify-between">
      <div>
        <h3 className="text-xl md:text-2xl font-semibold mb-4 text-slate-100">{question.id}. {question.question}</h3>
        {question.image && <img src={question.image} alt={`Visual for question ${question.id}`} className="my-4 mx-auto max-h-48 rounded-lg" />}
        <div className="space-y-3">
          {Object.keys(question.options).map(key => (
            <button
              key={key}
              onClick={() => handleOptionClick(key as 'A' | 'B' | 'C' | 'D')}
              disabled={userAnswer !== null}
              className={`relative w-full text-left p-4 rounded-lg border-2 border-slate-600 transition-all duration-300 ${getOptionClass(key as 'A'|'B'|'C'|'D')}`}
            >
              <span className="font-bold mr-2">{key})</span> {question.options[key]}
              {key === question.correctAnswer && showScorePopup && <span className="absolute top-2 right-2 text-green-400 font-bold animate-float-up">+1 Punto</span>}
            </button>
          ))}
        </div>
      </div>
      {userAnswer !== null && (
        <div className="mt-4 p-4 rounded-lg bg-slate-800 animate__animated animate__fadeInUp">
          <p className="font-bold text-cyan-400">
            {feedbackMessage || (userAnswer === question.correctAnswer ? '¡Correcto!' : 'Incorrecto.')}
          </p>
          <p className="text-slate-300">
            <span className="font-semibold">Explicación:</span> {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
};

export default QuizQuestion;

import React, { useState, useEffect } from 'react';
import { QuizResult, Medal } from '../types';
import { generatePdf } from '../services/pdfGenerator';
import MedalPopup from './MedalPopup';

interface ResultsScreenProps {
  result: QuizResult;
  onRestart: () => void;
  onNewUser: () => void;
}

const PerformanceIndicator: React.FC<{ percentage: number }> = ({ percentage }) => {
    let level = 'INSUFICIENTE';
    let color = 'bg-red-500';
    if (percentage >= 90) {
        level = 'EXCELENTE';
        color = 'bg-green-500';
    } else if (percentage >= 75) {
        level = 'BUENO';
        color = 'bg-sky-500';
    } else if (percentage >= 60) {
        level = 'SATISFACTORIO';
        color = 'bg-yellow-500';
    }
    return (
        <div>
            <p className="text-sm text-slate-400">Nivel de Desempeño</p>
            <p className={`text-lg font-bold px-3 py-1 mt-1 rounded-full inline-block ${color}`}>{level}</p>
        </div>
    );
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ result, onRestart, onNewUser }) => {
  const { student, score, percentage, timeTaken, questions, answers, medal, section } = result;
  const [showMedal, setShowMedal] = useState(false);
  
  useEffect(() => {
    if (medal !== Medal.None) {
      const timer = setTimeout(() => setShowMedal(true), 500);
      return () => clearTimeout(timer);
    }
  }, [medal]);

  const handleDownloadPdf = () => {
    generatePdf(result);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 animate__animated animate__fadeIn">
      {showMedal && <MedalPopup medal={medal} on-close={() => setShowMedal(false)} />}
      
      <div className="text-center mb-6">
        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500">Resultados del Ensayo</h2>
        <p className="text-lg text-slate-300 mt-1">{student.name} - {student.course}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6 text-center bg-slate-700/50 p-4 rounded-lg">
        <div className="bg-slate-800 p-4 rounded-lg">
          <p className="text-sm text-slate-400">Puntaje</p>
          <p className="text-3xl font-bold text-cyan-400">{score} <span className="text-xl">/ {questions.length}</span></p>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <p className="text-sm text-slate-400">Porcentaje</p>
          <p className="text-3xl font-bold text-cyan-400">{percentage}%</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <p className="text-sm text-slate-400">Tiempo Utilizado</p>
          <p className="text-3xl font-bold text-cyan-400">{Math.floor(timeTaken / 60)}m {timeTaken % 60}s</p>
        </div>
      </div>
      
      <div className="text-center mb-8">
        <PerformanceIndicator percentage={percentage} />
      </div>

      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-4 text-center">Análisis de Respuestas</h3>
        <div className="max-h-60 overflow-y-auto p-4 bg-slate-900/70 rounded-lg">
          {questions.filter(q => answers[q.id] !== q.correctAnswer).length > 0 ? (
            questions.filter(q => answers[q.id] !== q.correctAnswer).map((q, index) => (
              <div key={q.id} className="mb-4 p-3 bg-slate-800 rounded-md border-l-4 border-red-500">
                <p className="font-semibold text-slate-200">{q.id}. {q.question}</p>
                <p className="text-sm text-red-400">Tu respuesta: {answers[q.id] ? `${answers[q.id]}) ${q.options[answers[q.id]!]}` : 'No respondida'}</p>
                <p className="text-sm text-green-400">Correcta: {q.correctAnswer}) {q.options[q.correctAnswer]}</p>
              </div>
            ))
          ) : (
            <div className="text-center p-6">
                <p className="text-xl text-green-400 font-bold">¡Felicidades! ¡Respondiste todo correctamente!</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mt-8">
        <button onClick={handleDownloadPdf} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300">Descargar Informe PDF</button>
        <button onClick={onRestart} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300">Volver a Secciones</button>
        <button onClick={onNewUser} className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300">Otro Estudiante</button>
      </div>
    </div>
  );
};

export default ResultsScreen;

import React from 'react';
import { SectionId } from '../types';
import { SECTIONS } from '../constants';

interface SectionSelectionProps {
  onSelectSection: (sectionId: SectionId) => void;
  studentName: string;
}

const SectionCard: React.FC<{ title: string; description: string; onClick: () => void; isFull?: boolean }> = ({ title, description, onClick, isFull }) => (
    <button
        onClick={onClick}
        className={`p-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-cyan-500/30 border border-slate-700 text-left
        ${isFull ? 'bg-gradient-to-br from-cyan-600 to-teal-700 col-span-1 md:col-span-2' : 'bg-slate-800'}`}
    >
        <h3 className="text-2xl font-bold text-white">{title}</h3>
        <p className="text-slate-300 mt-2">{description}</p>
    </button>
);

const SectionSelection: React.FC<SectionSelectionProps> = ({ onSelectSection, studentName }) => {
  const sectionKeys = Object.keys(SECTIONS);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-slate-800/50 rounded-2xl shadow-2xl border border-slate-700 animate__animated animate__fadeIn">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white">¡Hola, {studentName}!</h2>
        <p className="text-lg text-slate-300 mt-2">Elige cómo quieres practicar hoy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard 
            title="Ensayo Completo"
            description="Realiza el quiz completo con 40 preguntas de todas las secciones. (20 min)"
            onClick={() => onSelectSection('full')}
            isFull={true}
        />
        {sectionKeys.map((key, index) => (
            <SectionCard
                key={key}
                title={`Sección ${index + 1}: ${SECTIONS[key]}`}
                description="10 preguntas enfocadas en este tema. (5 min)"
                onClick={() => onSelectSection(`section${index + 1}` as SectionId)}
            />
        ))}
      </div>
    </div>
  );
};

export default SectionSelection;

import React from 'react';
import { SectionId } from '../types';
import { SECTIONS } from '../constants';

interface SectionSelectionProps {
  onSelectSection: (sectionId: SectionId) => void;
  studentName: string;
}

const SectionCard: React.FC<{ title: string; description: string; onClick: () => void; isFull?: boolean }> = ({ title, description, onClick, isFull }) => (
    <button
        onClick={onClick}
        className={`p-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-cyan-500/30 border border-slate-700 text-left
        ${isFull ? 'bg-gradient-to-br from-cyan-600 to-teal-700 col-span-1 md:col-span-2' : 'bg-slate-800'}`}
    >
        <h3 className="text-2xl font-bold text-white">{title}</h3>
        <p className="text-slate-300 mt-2">{description}</p>
    </button>
);

const SectionSelection: React.FC<SectionSelectionProps> = ({ onSelectSection, studentName }) => {
  const sectionKeys = Object.keys(SECTIONS);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-slate-800/50 rounded-2xl shadow-2xl border border-slate-700 animate__animated animate__fadeIn">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white">¡Hola, {studentName}!</h2>
        <p className="text-lg text-slate-300 mt-2">Elige cómo quieres practicar hoy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard 
            title="Ensayo Completo"
            description="Realiza el quiz completo con 40 preguntas de todas las secciones. (20 min)"
            onClick={() => onSelectSection('full')}
            isFull={true}
        />
        {sectionKeys.map((key, index) => (
            <SectionCard
                key={key}
                title={`Sección ${index + 1}: ${SECTIONS[key]}`}
                description="10 preguntas enfocadas en este tema. (5 min)"
                onClick={() => onSelectSection(`section${index + 1}` as SectionId)}
            />
        ))}
      </div>
    </div>
  );
};

export default SectionSelection;

import React from 'react';
import { SectionId } from '../types';
import { SECTIONS } from '../constants';

interface SectionSelectionProps {
  onSelectSection: (sectionId: SectionId) => void;
  studentName: string;
}

const SectionCard: React.FC<{ title: string; description: string; onClick: () => void; isFull?: boolean }> = ({ title, description, onClick, isFull }) => (
    <button
        onClick={onClick}
        className={`p-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-cyan-500/30 border border-slate-700 text-left
        ${isFull ? 'bg-gradient-to-br from-cyan-600 to-teal-700 col-span-1 md:col-span-2' : 'bg-slate-800'}`}
    >
        <h3 className="text-2xl font-bold text-white">{title}</h3>
        <p className="text-slate-300 mt-2">{description}</p>
    </button>
);

const SectionSelection: React.FC<SectionSelectionProps> = ({ onSelectSection, studentName }) => {
  const sectionKeys = Object.keys(SECTIONS);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-slate-800/50 rounded-2xl shadow-2xl border border-slate-700 animate__animated animate__fadeIn">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white">¡Hola, {studentName}!</h2>
        <p className="text-lg text-slate-300 mt-2">Elige cómo quieres practicar hoy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard 
            title="Ensayo Completo"
            description="Realiza el quiz completo con 40 preguntas de todas las secciones. (20 min)"
            onClick={() => onSelectSection('full')}
            isFull={true}
        />
        {sectionKeys.map((key, index) => (
            <SectionCard
                key={key}
                title={`Sección ${index + 1}: ${SECTIONS[key]}`}
                description="10 preguntas enfocadas en este tema. (5 min)"
                onClick={() => onSelectSection(`section${index + 1}` as SectionId)}
            />
        ))}
      </div>
    </div>
  );
};

export default SectionSelection;

import React from 'react';
import { SectionId } from '../types';
import { SECTIONS } from '../constants';

interface SectionSelectionProps {
  onSelectSection: (sectionId: SectionId) => void;
  studentName: string;
}

const SectionCard: React.FC<{ title: string; description: string; onClick: () => void; isFull?: boolean }> = ({ title, description, onClick, isFull }) => (
    <button
        onClick={onClick}
        className={`p-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-cyan-500/30 border border-slate-700 text-left
        ${isFull ? 'bg-gradient-to-br from-cyan-600 to-teal-700 col-span-1 md:col-span-2' : 'bg-slate-800'}`}
    >
        <h3 className="text-2xl font-bold text-white">{title}</h3>
        <p className="text-slate-300 mt-2">{description}</p>
    </button>
);

const SectionSelection: React.FC<SectionSelectionProps> = ({ onSelectSection, studentName }) => {
  const sectionKeys = Object.keys(SECTIONS);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-slate-800/50 rounded-2xl shadow-2xl border border-slate-700 animate__animated animate__fadeIn">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white">¡Hola, {studentName}!</h2>
        <p className="text-lg text-slate-300 mt-2">Elige cómo quieres practicar hoy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard 
            title="Ensayo Completo"
            description="Realiza el quiz completo con 40 preguntas de todas las secciones. (20 min)"
            onClick={() => onSelectSection('full')}
            isFull={true}
        />
        {sectionKeys.map((key, index) => (
            <SectionCard
                key={key}
                title={`Sección ${index + 1}: ${SECTIONS[key]}`}
                description="10 preguntas enfocadas en este tema. (5 min)"
                onClick={() => onSelectSection(`section${index + 1}` as SectionId)}
            />
        ))}
      </div>
    </div>
  );
};

export default SectionSelection;
import React from 'react';
import { SectionId } from '../types';
import { SECTIONS } from '../constants';

interface SectionSelectionProps {
  onSelectSection: (sectionId: SectionId) => void;
  studentName: string;
}

const SectionCard: React.FC<{ title: string; description: string; onClick: () => void; isFull?: boolean }> = ({ title, description, onClick, isFull }) => (
    <button
        onClick={onClick}
        className={`p-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-cyan-500/30 border border-slate-700 text-left
        ${isFull ? 'bg-gradient-to-br from-cyan-600 to-teal-700 col-span-1 md:col-span-2' : 'bg-slate-800'}`}
    >
        <h3 className="text-2xl font-bold text-white">{title}</h3>
        <p className="text-slate-300 mt-2">{description}</p>
    </button>
);

const SectionSelection: React.FC<SectionSelectionProps> = ({ onSelectSection, studentName }) => {
  const sectionKeys = Object.keys(SECTIONS);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-slate-800/50 rounded-2xl shadow-2xl border border-slate-700 animate__animated animate__fadeIn">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white">¡Hola, {studentName}!</h2>
        <p className="text-lg text-slate-300 mt-2">Elige cómo quieres practicar hoy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard 
            title="Ensayo Completo"
            description="Realiza el quiz completo con 40 preguntas de todas las secciones. (20 min)"
            onClick={() => onSelectSection('full')}
            isFull={true}
        />
        {sectionKeys.map((key, index) => (
            <SectionCard
                key={key}
                title={`Sección ${index + 1}: ${SECTIONS[key]}`}
                description="10 preguntas enfocadas en este tema. (5 min)"
                onClick={() => onSelectSection(`section${index + 1}` as SectionId)}
            />
        ))}
      </div>
    </div>
  );
};

export default SectionSelection;
import React, { useState, useCallback } from 'react';
import { Student } from '../types';
import { QUIZ_TITLE, QUIZ_LEVEL, QUESTIONS } from '../constants';

interface SplashScreenProps {
  onStart: (student: Student) => void;
}

const InfoCard: React.FC<{ icon: React.ReactNode; title: string; value: string }> = ({ icon, title, value }) => (
    <div className="bg-slate-800 rounded-lg p-4 flex items-center space-x-4">
        <div className="text-3xl text-cyan-400">{icon}</div>
        <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className="text-lg font-bold">{value}</p>
        </div>
    </div>
);

const SplashScreen: React.FC<SplashScreenProps> = ({ onStart }) => {
  const [name, setName] = useState('');
  const [course, setCourse] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && course.trim()) {
      onStart({ name: name.trim(), course: course.trim() });
    }
  }, [name, course, onStart]);

  const isFormValid = name.trim() !== '' && course.trim() !== '';

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-slate-800/50 rounded-2xl shadow-2xl border border-slate-700 animate__animated animate__fadeIn">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500">{QUIZ_TITLE}</h1>
        <p className="text-xl text-slate-300 mt-2">{QUIZ_LEVEL}</p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-4 mb-8 text-center">
        <InfoCard icon={<ClockIcon />} title="Duración" value="20 Minutos" />
        <InfoCard icon={<QuestionMarkCircleIcon />} title="Preguntas" value={`${QUESTIONS.length}`} />
        <InfoCard icon={<ChartBarIcon />} title="Modalidad" value="Por Secciones" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre Completo"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-300"
              required
            />
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="Curso (ej: 8vo Básico A)"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-300"
              required
            />
        </div>
        <button
          type="submit"
          disabled={!isFormValid}
          className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg text-xl transition-all duration-300 transform hover:scale-105"
        >
          Comenzar
        </button>
      </form>
    </div>
  );
};

// Icons
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const QuestionMarkCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>;
const ChartBarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>;

export default SplashScreen;
import React, { useState, useEffect } from 'react';

interface TimerProps {
  initialTime: number; // in seconds
  onTimeUp: () => void;
}

const Timer: React.FC<TimerProps> = ({ initialTime, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearInterval(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const timeColorClass = timeLeft <= 60 ? 'text-red-500' : 'text-slate-300';

  return (
    <div className={`text-xl font-bold p-2 rounded-lg bg-slate-700/50 ${timeColorClass}`}>
      <span>Tiempo: </span>
      <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
    </div>
  );
};

export default Timer;
