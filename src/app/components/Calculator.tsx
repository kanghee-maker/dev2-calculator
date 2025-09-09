'use client';

import { useState, useEffect, useCallback } from 'react';

interface HistoryItem {
  calculation: string;
  result: string;
}

export default function Calculator() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isScientificMode, setIsScientificMode] = useState(false);
  const [memory, setMemory] = useState(0);
  const [isRadianMode, setIsRadianMode] = useState(true);

  // 테마 모드 초기화
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const darkMode = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDarkMode(darkMode);
    document.documentElement.classList.toggle('dark', darkMode);
  }, []);

  // 키보드 이벤트 핸들러
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    const { key } = event;
    
    if (key >= '0' && key <= '9') {
      handleNumberClick(key);
    } else if (key === '.') {
      handleDecimalClick();
    } else if (['+', '-', '*', '/'].includes(key)) {
      handleOperatorClick(key === '*' ? '×' : key === '/' ? '÷' : key);
    } else if (key === 'Enter' || key === '=') {
      handleEqualsClick();
    } else if (key === 'Escape' || key.toLowerCase() === 'c') {
      handleClearClick();
    } else if (key === 'Backspace') {
      handleBackspaceClick();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // 사운드 재생 함수
  const playSound = (frequency: number, duration: number = 100) => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      // 오디오 컨텍스트를 지원하지 않는 브라우저에서는 무시
    }
  };

  const handleNumberClick = (num: string) => {
    playSound(200);
    
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleDecimalClick = () => {
    playSound(250);
    
    if (waitingForNewValue) {
      setDisplay('0.');
      setWaitingForNewValue(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const handleOperatorClick = (nextOperator: string) => {
    playSound(300);
    
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operator) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operator);
      
      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForNewValue(true);
    setOperator(nextOperator);
  };

  const calculate = (firstValue: number, secondValue: number, operator: string): number => {
    switch (operator) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return firstValue / secondValue;
      case '^':
        return Math.pow(firstValue, secondValue);
      case 'mod':
        return firstValue % secondValue;
      default:
        return secondValue;
    }
  };

  // 공학용 계산 함수들
  const handleScientificFunction = (func: string) => {
    playSound(350);
    
    const value = parseFloat(display);
    let result: number;
    let calculation: string;

    switch (func) {
      case 'sin':
        result = Math.sin(isRadianMode ? value : (value * Math.PI / 180));
        calculation = `sin(${value}${isRadianMode ? ' rad' : '°'})`;
        break;
      case 'cos':
        result = Math.cos(isRadianMode ? value : (value * Math.PI / 180));
        calculation = `cos(${value}${isRadianMode ? ' rad' : '°'})`;
        break;
      case 'tan':
        result = Math.tan(isRadianMode ? value : (value * Math.PI / 180));
        calculation = `tan(${value}${isRadianMode ? ' rad' : '°'})`;
        break;
      case 'log':
        result = Math.log10(value);
        calculation = `log(${value})`;
        break;
      case 'ln':
        result = Math.log(value);
        calculation = `ln(${value})`;
        break;
      case 'sqrt':
        result = Math.sqrt(value);
        calculation = `√(${value})`;
        break;
      case 'x²':
        result = value * value;
        calculation = `${value}²`;
        break;
      case '1/x':
        result = 1 / value;
        calculation = `1/${value}`;
        break;
      case 'π':
        result = Math.PI;
        calculation = 'π';
        break;
      case 'e':
        result = Math.E;
        calculation = 'e';
        break;
      case '!':
        result = factorial(value);
        calculation = `${value}!`;
        break;
      case 'abs':
        result = Math.abs(value);
        calculation = `|${value}|`;
        break;
      default:
        return;
    }

    if (func === 'π' || func === 'e') {
      setDisplay(String(result));
    } else {
      setHistory(prev => [...prev, { calculation, result: String(result) }].slice(-10));
      setDisplay(String(result));
    }
    setWaitingForNewValue(true);
  };

  const factorial = (n: number): number => {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  };

  // 메모리 기능들
  const handleMemoryFunction = (func: string) => {
    playSound(300);
    const value = parseFloat(display);
    
    switch (func) {
      case 'MC':
        setMemory(0);
        break;
      case 'MR':
        setDisplay(String(memory));
        setWaitingForNewValue(true);
        break;
      case 'M+':
        setMemory(memory + value);
        break;
      case 'M-':
        setMemory(memory - value);
        break;
      case 'MS':
        setMemory(value);
        break;
    }
  };

  const handleEqualsClick = () => {
    playSound(400);
    
    const inputValue = parseFloat(display);

    if (previousValue !== null && operator) {
      const newValue = calculate(previousValue, inputValue, operator);
      const calculation = `${previousValue} ${operator} ${inputValue}`;
      
      // 히스토리에 추가
      setHistory(prev => [...prev, { calculation, result: String(newValue) }].slice(-10)); // 최근 10개만 유지
      
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperator(null);
      setWaitingForNewValue(true);
    }
  };

  const handleClearClick = () => {
    playSound(150);
    
    setDisplay('0');
    setPreviousValue(null);
    setOperator(null);
    setWaitingForNewValue(false);
  };

  const handleBackspaceClick = () => {
    playSound(180);
    
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const toggleTheme = () => {
    playSound(350);
    
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) playSound(300); // 사운드를 켤 때만 소리 재생
  };

  const clearHistory = () => {
    playSound(200);
    setHistory([]);
  };

  const Button = ({ 
    children, 
    onClick, 
    className = "", 
    variant = "default" 
  }: { 
    children: React.ReactNode; 
    onClick: () => void; 
    className?: string; 
    variant?: "default" | "operator" | "equals" | "clear" | "scientific" | "memory";
  }) => {
    const baseClasses = "h-12 rounded-xl font-semibold text-sm transition-all duration-200 transform active:scale-95 hover:scale-105 shadow-lg active:shadow-sm";
    
    const variants = {
      default: "bg-gradient-to-br from-white to-yellow-50 dark:from-gray-700 dark:to-gray-600 text-gray-800 dark:text-gray-100 hover:from-yellow-50 hover:to-orange-50 dark:hover:from-gray-600 dark:hover:to-gray-500 border border-yellow-200 dark:border-gray-500",
      operator: "bg-gradient-to-br from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 text-white shadow-orange-200 dark:shadow-orange-800 border border-orange-300",
      equals: "bg-gradient-to-br from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 text-white shadow-blue-200 dark:shadow-blue-800 border border-blue-300",
      clear: "bg-gradient-to-br from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white shadow-red-200 dark:shadow-red-800 border border-red-300",
      scientific: "bg-gradient-to-br from-green-400 to-teal-500 hover:from-green-500 hover:to-teal-600 text-white shadow-green-200 dark:shadow-green-800 border border-green-300",
      memory: "bg-gradient-to-br from-purple-400 to-indigo-500 hover:from-purple-500 hover:to-indigo-600 text-white shadow-purple-200 dark:shadow-purple-800 border border-purple-300"
    };

    return (
      <button
        onClick={onClick}
        className={`${baseClasses} ${variants[variant]} ${className}`}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="bg-gradient-to-br from-white via-yellow-50 to-orange-50 dark:bg-gray-800 rounded-3xl shadow-2xl p-6 backdrop-blur-sm border border-yellow-200 dark:border-gray-600">
      {/* 상단 컨트롤 */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gradient-to-br from-yellow-100 to-orange-100 dark:bg-gray-700 hover:from-yellow-200 hover:to-orange-200 dark:hover:bg-gray-600 transition-all duration-200 border border-yellow-300 dark:border-gray-500"
            title="테마 변경"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-gradient-to-br from-yellow-100 to-orange-100 dark:bg-gray-700 hover:from-yellow-200 hover:to-orange-200 dark:hover:bg-gray-600 transition-all duration-200 border border-yellow-300 dark:border-gray-500"
            title="사운드 토글"
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 rounded-lg bg-gradient-to-br from-yellow-100 to-orange-100 dark:bg-gray-700 hover:from-yellow-200 hover:to-orange-200 dark:hover:bg-gray-600 transition-all duration-200 border border-yellow-300 dark:border-gray-500"
            title="히스토리 보기"
          >
            📜
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsScientificMode(!isScientificMode)}
            className="px-3 py-1 rounded-lg bg-gradient-to-br from-green-400 to-teal-500 hover:from-green-500 hover:to-teal-600 text-white text-xs font-semibold transition-all duration-200 border border-green-300"
            title="공학용 모드 토글"
          >
            {isScientificMode ? '기본' : '공학'}
          </button>
          
          {isScientificMode && (
            <button
              onClick={() => setIsRadianMode(!isRadianMode)}
              className="px-3 py-1 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 text-white text-xs font-semibold transition-all duration-200 border border-blue-300"
              title="각도 단위 변경"
            >
              {isRadianMode ? 'RAD' : 'DEG'}
            </button>
          )}
          
          {memory !== 0 && (
            <div className="px-2 py-1 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-lg text-xs font-semibold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
              M: {memory}
            </div>
          )}
        </div>
      </div>

      {/* 히스토리 패널 */}
      {showHistory && (
        <div className="mb-4 p-3 bg-gradient-to-br from-yellow-50 to-orange-50 dark:bg-gray-700 rounded-xl border border-yellow-200 dark:border-gray-600">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">📊 계산 히스토리</h3>
            <button
              onClick={clearHistory}
              className="text-xs px-2 py-1 bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900 dark:to-pink-900 text-red-600 dark:text-red-300 rounded border border-red-200 dark:border-red-700 hover:from-red-200 hover:to-pink-200 transition-all duration-200"
            >
              지우기
            </button>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {history.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">계산 내역이 없습니다</p>
            ) : (
              history.slice().reverse().map((item, index) => (
                <div key={index} className="text-xs text-gray-700 dark:text-gray-300 p-1 bg-white dark:bg-gray-800 rounded border border-yellow-100 dark:border-gray-600">
                  {item.calculation} = {item.result}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 디스플레이 */}
      <div className="bg-gradient-to-br from-gray-50 to-yellow-50 dark:bg-gray-900 rounded-xl p-4 mb-4 border border-yellow-200 dark:border-gray-700">
        <div className="text-right">
          {operator && previousValue !== null && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              {previousValue} {operator}
            </div>
          )}
          <div className="text-3xl font-mono text-gray-800 dark:text-gray-100 break-all">
            {display}
          </div>
        </div>
      </div>

      {/* 공학용 버튼들 */}
      {isScientificMode && (
        <div className="grid grid-cols-5 gap-2 mb-4">
          <Button onClick={() => handleScientificFunction('sin')} variant="scientific">sin</Button>
          <Button onClick={() => handleScientificFunction('cos')} variant="scientific">cos</Button>
          <Button onClick={() => handleScientificFunction('tan')} variant="scientific">tan</Button>
          <Button onClick={() => handleScientificFunction('log')} variant="scientific">log</Button>
          <Button onClick={() => handleScientificFunction('ln')} variant="scientific">ln</Button>
          
          <Button onClick={() => handleScientificFunction('sqrt')} variant="scientific">√</Button>
          <Button onClick={() => handleScientificFunction('x²')} variant="scientific">x²</Button>
          <Button onClick={() => handleOperatorClick('^')} variant="scientific">x^y</Button>
          <Button onClick={() => handleScientificFunction('1/x')} variant="scientific">1/x</Button>
          <Button onClick={() => handleScientificFunction('!')} variant="scientific">n!</Button>
          
          <Button onClick={() => handleScientificFunction('π')} variant="scientific">π</Button>
          <Button onClick={() => handleScientificFunction('e')} variant="scientific">e</Button>
          <Button onClick={() => handleScientificFunction('abs')} variant="scientific">|x|</Button>
          <Button onClick={() => handleOperatorClick('mod')} variant="scientific">mod</Button>
          <Button onClick={() => {}} variant="scientific" className="opacity-50">±</Button>
        </div>
      )}

      {/* 메모리 버튼들 */}
      {isScientificMode && (
        <div className="grid grid-cols-5 gap-2 mb-4">
          <Button onClick={() => handleMemoryFunction('MC')} variant="memory">MC</Button>
          <Button onClick={() => handleMemoryFunction('MR')} variant="memory">MR</Button>
          <Button onClick={() => handleMemoryFunction('M+')} variant="memory">M+</Button>
          <Button onClick={() => handleMemoryFunction('M-')} variant="memory">M-</Button>
          <Button onClick={() => handleMemoryFunction('MS')} variant="memory">MS</Button>
        </div>
      )}

      {/* 기본 버튼 그리드 */}
      <div className={`grid gap-3 ${isScientificMode ? 'grid-cols-4' : 'grid-cols-4'}`}>
        <Button onClick={handleClearClick} variant="clear" className="col-span-2">
          Clear
        </Button>
        <Button onClick={handleBackspaceClick} variant="operator">
          ⌫
        </Button>
        <Button onClick={() => handleOperatorClick('÷')} variant="operator">
          ÷
        </Button>

        <Button onClick={() => handleNumberClick('7')}>7</Button>
        <Button onClick={() => handleNumberClick('8')}>8</Button>
        <Button onClick={() => handleNumberClick('9')}>9</Button>
        <Button onClick={() => handleOperatorClick('×')} variant="operator">
          ×
        </Button>

        <Button onClick={() => handleNumberClick('4')}>4</Button>
        <Button onClick={() => handleNumberClick('5')}>5</Button>
        <Button onClick={() => handleNumberClick('6')}>6</Button>
        <Button onClick={() => handleOperatorClick('-')} variant="operator">
          -
        </Button>

        <Button onClick={() => handleNumberClick('1')}>1</Button>
        <Button onClick={() => handleNumberClick('2')}>2</Button>
        <Button onClick={() => handleNumberClick('3')}>3</Button>
        <Button onClick={() => handleOperatorClick('+')} variant="operator">
          +
        </Button>

        <Button onClick={() => handleNumberClick('0')} className="col-span-2">
          0
        </Button>
        <Button onClick={handleDecimalClick}>.</Button>
        <Button onClick={handleEqualsClick} variant="equals">
          =
        </Button>
      </div>

      {/* 키보드 도움말 */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center bg-gradient-to-br from-yellow-50 to-orange-50 dark:bg-gray-800 p-2 rounded-lg border border-yellow-200 dark:border-gray-600">
        💡 키보드로도 조작 가능: 숫자, +, -, *, /, Enter(=), Esc(Clear), Backspace
        {isScientificMode && <br />}
        {isScientificMode && "🔬 공학용 모드 활성화 - 삼각함수, 로그, 지수 함수 사용 가능"}
      </div>
    </div>
  );
}
