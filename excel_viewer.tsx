import React, { useState } from 'react';
import { Upload, FileSpreadsheet, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ExcelToQuiz() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [studentInfo, setStudentInfo] = useState({
    name: '',
    date: '',
    period: ''
  });
  const [fileLoaded, setFileLoaded] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Parse Excel data into questions
      const parsedQuestions = jsonData.map((row, index) => {
        // Get all column keys
        const keys = Object.keys(row);
        
        // Try to identify question ID/number
        const idKey = keys.find(k => 
          k.toLowerCase().includes('question') || 
          k.toLowerCase().includes('id') ||
          k.toLowerCase().includes('number') ||
          k.toLowerCase() === 'no'
        );
        
        // Try to identify question text
        const textKey = keys.find(k => 
          k.toLowerCase().includes('text') || 
          k.toLowerCase().includes('question') ||
          k.toLowerCase().includes('prompt')
        );
        
        // Try to identify image URL
        const imageKey = keys.find(k => 
          k.toLowerCase().includes('image') || 
          k.toLowerCase().includes('url') ||
          k.toLowerCase().includes('img')
        );
        
        // Try to identify note
        const noteKey = keys.find(k => 
          k.toLowerCase().includes('note') || 
          k.toLowerCase().includes('hint')
        );
        
        // Find option columns (A, B, C, D or Option_A, etc.)
        const optionKeys = keys.filter(k => {
          const lower = k.toLowerCase();
          return lower.includes('option') || 
                 lower === 'a' || lower === 'b' || lower === 'c' || lower === 'd' ||
                 lower.startsWith('choice');
        }).sort();
        
        // Build options array
        const options = [];
        const letters = ['A', 'B', 'C', 'D'];
        
        if (optionKeys.length >= 4) {
          // Use found option keys
          optionKeys.slice(0, 4).forEach((key, idx) => {
            options.push({
              letter: letters[idx],
              text: row[key] || ''
            });
          });
        } else {
          // Fallback: look for any keys that might be options
          letters.forEach((letter, idx) => {
            const key = keys.find(k => 
              k.toLowerCase() === letter.toLowerCase() ||
              k.toLowerCase() === `option_${letter.toLowerCase()}` ||
              k.toLowerCase() === `option${letter.toLowerCase()}`
            );
            options.push({
              letter: letter,
              text: key ? row[key] : `Option ${letter}`
            });
          });
        }

        return {
          id: row[idKey] || (index + 1),
          text: row[textKey] || `Question ${index + 1}`,
          image: row[imageKey] || null,
          note: row[noteKey] || null,
          options: options
        };
      });

      setQuestions(parsedQuestions);
      setFileName(file.name);
      setFileLoaded(true);
      setCurrentQuestion(0);
      setAnswers({});
    } catch (error) {
      alert('Error reading file. Please ensure it is a valid Excel file.');
      console.error('File reading error:', error);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const goToNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const resetTest = () => {
    setFileLoaded(false);
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);
    setCurrentQuestion(0);
    setStudentInfo({ name: '', date: '', period: '' });
    setFileName('');
  };

  // File Upload Screen
  if (!fileLoaded) {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-blue-900 text-white p-6 shadow-lg">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-center mb-1">AP CALCULUS MULTIPLE CHOICE EXAMINATION</h1>
            <p className="text-center text-sm text-blue-200">Upload Excel File to Generate Test</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto p-8 mt-12">
          <div className="bg-white border-2 border-blue-900 rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <FileSpreadsheet className="w-16 h-16 text-blue-900 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-blue-900 mb-2">Upload Excel File</h2>
              <p className="text-gray-600">Upload your Excel file to automatically generate multiple choice questions</p>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-blue-900 mb-3">Excel File Format Guidelines:</h3>
              <p className="text-sm text-gray-700 mb-3">Your Excel file can use any of these column naming patterns:</p>
              <ul className="text-sm space-y-2 text-gray-700">
                <li className="flex gap-2">
                  <span className="font-semibold min-w-32">Question ID:</span>
                  <span>"Question", "ID", "Number", "No"</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-32">Question Text:</span>
                  <span>"Text", "Question", "Prompt"</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-32">Options:</span>
                  <span>"A", "B", "C", "D" or "Option_A", "Option_B", etc.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-32">Image (optional):</span>
                  <span>"Image", "Image_URL", "URL"</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-32">Note (optional):</span>
                  <span>"Note", "Hint"</span>
                </li>
              </ul>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded">
                <p className="text-xs text-yellow-800"><strong>Tip:</strong> The system will automatically detect column names and match them to question components.</p>
              </div>
            </div>

            <label className="block">
              <div className="border-2 border-dashed border-blue-400 rounded-lg p-8 text-center cursor-pointer hover:bg-blue-50 transition-all">
                <Upload className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <p className="text-blue-900 font-semibold mb-1">Click to upload Excel file</p>
                <p className="text-sm text-gray-500">Supports .xlsx, .xls files</p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </label>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  // Submission Screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-blue-900 text-white p-8 rounded-t-lg text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Test Submitted Successfully</h1>
            <p className="text-blue-200">Your answers have been recorded.</p>
          </div>
          <div className="border-2 border-blue-900 rounded-b-lg p-8 bg-white">
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Source File:</h3>
              <p className="text-blue-900 font-medium">{fileName}</p>
            </div>
            
            <h2 className="text-xl font-bold mb-4 text-blue-900">Student Information:</h2>
            <div className="space-y-2 mb-6">
              <p><span className="font-bold">Name:</span> {studentInfo.name || 'Not provided'}</p>
              <p><span className="font-bold">Date:</span> {studentInfo.date || 'Not provided'}</p>
              <p><span className="font-bold">Class Period:</span> {studentInfo.period || 'Not provided'}</p>
            </div>
            
            <h2 className="text-xl font-bold mb-4 text-blue-900">Your Answers:</h2>
            <div className="space-y-3 mb-6">
              {questions.map((q) => (
                <div key={q.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded">
                  <span className="font-bold text-blue-900">Question {q.id}:</span>
                  <span className="text-lg">{answers[q.id] || 'No answer'}</span>
                </div>
              ))}
            </div>
            <button
              onClick={resetTest}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
            >
              Start New Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Test Screen
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-blue-900 text-white p-6 shadow-lg">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-center mb-1">AP CALCULUS MULTIPLE CHOICE EXAMINATION</h1>
            <p className="text-center text-sm text-blue-200">Advanced Placement Mathematics Assessment</p>
            <p className="text-center text-xs text-blue-300 mt-1">Source: {fileName}</p>
          </div>
          <button
            onClick={resetTest}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded text-sm font-semibold transition-all"
          >
            Load New File
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-blue-100 border-b-2 border-blue-900">
        <div className="max-w-5xl mx-auto p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-blue-900">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm text-blue-700">{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Student Info (only on first question) */}
      {currentQuestion === 0 && (
        <div className="bg-blue-50 border-b-2 border-blue-200">
          <div className="max-w-5xl mx-auto p-6">
            <h2 className="text-lg font-bold text-blue-900 mb-4">Student Information:</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-1">Name:</label>
                <input
                  type="text"
                  value={studentInfo.name}
                  onChange={(e) => setStudentInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border-b-2 border-blue-900 bg-transparent p-2 focus:outline-none focus:border-blue-600"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-1">Date:</label>
                <input
                  type="text"
                  value={studentInfo.date}
                  onChange={(e) => setStudentInfo(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full border-b-2 border-blue-900 bg-transparent p-2 focus:outline-none focus:border-blue-600"
                  placeholder="MM/DD/YYYY"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-1">Class Period:</label>
                <input
                  type="text"
                  value={studentInfo.period}
                  onChange={(e) => setStudentInfo(prev => ({ ...prev, period: e.target.value }))}
                  className="w-full border-b-2 border-blue-900 bg-transparent p-2 focus:outline-none focus:border-blue-600"
                  placeholder="Enter period"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-5xl mx-auto p-8">
        <div className="bg-white border-2 border-blue-900 rounded-lg shadow-lg overflow-hidden min-h-[500px] flex flex-col">
          {/* Question Content */}
          <div className="flex-1 p-8">
            <div className="flex gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                {currentQ.id}
              </div>
              <div className="flex-1">
                <p className="text-lg leading-relaxed">{currentQ.text}</p>
                {currentQ.note && (
                  <p className="text-sm italic text-gray-500 mt-2">{currentQ.note}</p>
                )}
              </div>
            </div>

            {/* Image if exists */}
            {currentQ.image && (
              <div className="flex justify-center my-6">
                <img 
                  src={currentQ.image} 
                  alt={`Visual for question ${currentQ.id}`}
                  className="max-w-md border border-gray-300 p-4 bg-white rounded"
                />
              </div>
            )}

            {/* Options */}
            <div className="space-y-3 ml-16">
              {currentQ.options.map((option) => (
                <label
                  key={option.letter}
                  className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    answers[currentQ.id] === option.letter
                      ? 'bg-blue-50 border-blue-600'
                      : 'bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q${currentQ.id}`}
                    value={option.letter}
                    checked={answers[currentQ.id] === option.letter}
                    onChange={() => handleAnswerChange(currentQ.id, option.letter)}
                    className="mt-1 mr-3 w-5 h-5 accent-blue-600"
                  />
                  <span className="flex-1">
                    <span className="font-bold text-blue-900 mr-2">({option.letter})</span>
                    {option.text}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="bg-gray-50 border-t-2 border-blue-900 p-6">
            <div className="flex justify-between items-center">
              <button
                onClick={goToPrevious}
                disabled={currentQuestion === 0}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                  currentQuestion === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>

              <div className="text-sm text-gray-600">
                {answers[currentQ.id] ? (
                  <span className="text-green-600 font-semibold">✓ Answered</span>
                ) : (
                  <span className="text-amber-600">Not answered</span>
                )}
              </div>

              {currentQuestion < questions.length - 1 ? (
                <button
                  onClick={goToNext}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
                >
                  <CheckCircle className="w-5 h-5" />
                  Submit Test
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Answer Overview */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-blue-900 mb-3">Question Overview:</h3>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                  idx === currentQuestion
                    ? 'bg-blue-900 text-white ring-2 ring-blue-400'
                    : answers[q.id]
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-white text-blue-900 border-2 border-blue-300 hover:bg-blue-100'
                }`}
              >
                {q.id}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}