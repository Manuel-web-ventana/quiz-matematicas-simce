
import React, { useState, useCallback } from 'react';
import { AppView, Student, QuizResult, SectionId } from './types';
import SplashScreen from './components/SplashScreen';
import SectionSelection from './components/SectionSelection';
import Quiz from './components/Quiz';
import ResultsScreen from './components/ResultsScreen';
import { QUESTIONS, SECTIONS, QUIZ_LEVEL } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('splash');
  const [student, setStudent] = useState<Student | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<SectionId>('full');

  const handleStartQuiz = useCallback((studentInfo: Student, sectionId: SectionId) => {
    setStudent(studentInfo);
    setSelectedSectionId(sectionId);
    setCurrentView('quiz');
  }, []);
  
  const handleQuizFinish = useCallback((result: QuizResult) => {
    setQuizResult(result);
    setCurrentView('results');
  }, []);

  const handleGoToSelection = useCallback(() => {
    setQuizResult(null);
    setCurrentView('selection');
  }, []);

  const handleGoToSplash = useCallback(() => {
    setQuizResult(null);
    setStudent(null);
    setCurrentView('splash');
  }, []);

  const handleSelectSection = useCallback((sectionId: SectionId) => {
      if (student) {
          handleStartQuiz(student, sectionId);
      }
  }, [student, handleStartQuiz]);
  
  const renderView = () => {
    switch (currentView) {
      case 'splash':
        return <SplashScreen onStart={(studentInfo) => {
            setStudent(studentInfo);
            setCurrentView('selection');
        }} />;
      case 'selection':
        return <SectionSelection 
                    onSelectSection={handleSelectSection} 
                    studentName={student?.name || 'Estudiante'} 
                />;
      case 'quiz':
        if (student) {
          const questionsForQuiz = selectedSectionId === 'full' 
            ? QUESTIONS 
            : QUESTIONS.filter(q => q.section === SECTIONS[selectedSectionId.replace('section', 'section')]);
          
          const sectionTitle = selectedSectionId === 'full' ? 'Ensayo Completo' : SECTIONS[selectedSectionId.replace('section', 'section')];
            
          return (
            <Quiz
              student={student}
              questions={questionsForQuiz}
              onFinish={handleQuizFinish}
              sectionTitle={sectionTitle}
            />
          );
        }
        return <SplashScreen onStart={(studentInfo) => {
            setStudent(studentInfo);
            setCurrentView('selection');
        }}/>; // Fallback
      case 'results':
        if (quizResult) {
          return <ResultsScreen result={quizResult} onRestart={handleGoToSelection} onNewUser={handleGoToSplash} />;
        }
        return <SplashScreen onStart={(studentInfo) => {
            setStudent(studentInfo);
            setCurrentView('selection');
        }}/>; // Fallback
      default:
        return <SplashScreen onStart={(studentInfo) => {
            setStudent(studentInfo);
            setCurrentView('selection');
        }}/>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <main className="w-full max-w-4xl mx-auto">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
