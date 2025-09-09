import Calculator from './components/Calculator';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-yellow-50 to-orange-50 dark:from-gray-900 dark:to-purple-900 p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">
          🧮 이강희의 계산기
        </h1>
        <Calculator />
      </div>
    </div>
  );
}

