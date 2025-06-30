function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
        <h1 className="text-4xl font-bold text-gray-800 text-center mb-4">
          🎯 Scrabble Game
        </h1>
        <p className="text-gray-600 text-center mb-6">
          React + TypeScript + Vite setup complete!
        </p>
        <div className="flex justify-center">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md">
            Start Building
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
