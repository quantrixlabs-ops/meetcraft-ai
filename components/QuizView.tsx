import React, { useState } from 'react';
import { KnowledgePackage, QuizData } from '../types';
import { generateQuiz } from '../services/geminiService';
import { BrainCircuit, CheckCircle, XCircle, RefreshCw, Award, ArrowRight } from 'lucide-react';

interface QuizViewProps {
  data: KnowledgePackage;
}

const QuizView: React.FC<QuizViewProps> = ({ data }) => {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [answers, setAnswers] = useState<{[key: number]: string}>({});
  const [submitted, setSubmitted] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setQuizData(null);
    setAnswers({});
    setSubmitted(false);
    try {
      const result = await generateQuiz(data);
      setQuizData(result);
    } catch (e) {
      console.error(e);
      alert("Failed to generate quiz. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (qIdx: number, option: string) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qIdx]: option }));
  };

  const calculateScore = () => {
    if (!quizData) return 0;
    let score = 0;
    quizData.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) score++;
    });
    return score;
  };

  if (!quizData && !isLoading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <BrainCircuit className="w-12 h-12 text-indigo-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Test Your Knowledge</h2>
        <p className="text-slate-600 mb-8 max-w-md mx-auto">
          Generate a 10-question AI quiz based strictly on the generated content. 
          Includes recall, understanding, and applied reasoning questions.
        </p>
        <button 
          onClick={handleGenerate}
          className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all flex items-center gap-2 mx-auto"
        >
          Generate Quiz
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
         <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
         <h3 className="text-xl font-bold text-slate-700">Designing Questions...</h3>
         <p className="text-slate-500">Analyzing chapters for key concepts.</p>
      </div>
    );
  }

  const score = calculateScore();

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="flex justify-between items-end mb-8 border-b border-slate-200 pb-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <Award className="w-6 h-6 text-indigo-600" />
             {quizData?.title || "Knowledge Check"}
           </h2>
           <p className="text-slate-500 text-sm mt-1">Select the best answer for each question.</p>
        </div>
        {submitted && (
           <div className="text-right">
             <div className="text-sm text-slate-500 uppercase font-bold tracking-wider">Score</div>
             <div className={`text-3xl font-black ${score >= 7 ? 'text-green-600' : 'text-amber-600'}`}>
               {score} / {quizData?.questions.length}
             </div>
           </div>
        )}
      </div>

      <div className="space-y-8">
        {quizData?.questions.map((q, idx) => {
          const isCorrect = submitted && answers[idx] === q.correctAnswer;
          const isWrong = submitted && answers[idx] !== q.correctAnswer && answers[idx] !== undefined;

          return (
            <div key={idx} className={`bg-white p-6 rounded-xl border-2 transition-all ${
              submitted 
                ? isCorrect ? 'border-green-100 bg-green-50/30' : isWrong ? 'border-red-100 bg-red-50/30' : 'border-slate-100'
                : 'border-slate-100 shadow-sm'
            }`}>
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex gap-3">
                <span className="text-slate-400 font-mono text-sm mt-1">Q{idx + 1}</span>
                {q.question}
              </h3>

              <div className="space-y-3">
                {q.options.map((opt, oIdx) => {
                  const isSelected = answers[idx] === opt;
                  const isActualCorrect = submitted && opt === q.correctAnswer;
                  
                  let btnClass = "border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700";
                  
                  if (submitted) {
                    if (isActualCorrect) btnClass = "bg-green-100 border-green-500 text-green-900 font-medium";
                    else if (isSelected && !isActualCorrect) btnClass = "bg-red-100 border-red-300 text-red-900 opacity-75";
                    else btnClass = "border-slate-100 text-slate-400 opacity-50";
                  } else if (isSelected) {
                    btnClass = "bg-indigo-50 border-indigo-500 text-indigo-900 font-medium ring-1 ring-indigo-500";
                  }

                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelect(idx, opt)}
                      disabled={submitted}
                      className={`w-full text-left p-4 rounded-lg border flex justify-between items-center transition-all ${btnClass}`}
                    >
                      <span>{opt}</span>
                      {submitted && isActualCorrect && <CheckCircle className="w-5 h-5 text-green-600" />}
                      {submitted && isSelected && !isActualCorrect && <XCircle className="w-5 h-5 text-red-500" />}
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100 text-sm text-indigo-900">
                  <span className="font-bold block mb-1">Explanation:</span>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-12 flex justify-center gap-4">
        {!submitted ? (
          <button 
            onClick={() => setSubmitted(true)}
            disabled={Object.keys(answers).length !== quizData?.questions.length}
            className="bg-indigo-600 text-white px-12 py-4 rounded-xl font-bold shadow-xl hover:bg-indigo-700 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            Submit Answers
          </button>
        ) : (
          <button 
            onClick={handleGenerate}
            className="bg-white border-2 border-slate-200 text-slate-700 px-8 py-3 rounded-xl font-bold hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            New Quiz
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizView;
