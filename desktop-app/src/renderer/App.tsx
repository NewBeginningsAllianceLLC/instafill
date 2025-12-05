import { useState } from 'react';
import { ChatInterface } from './components/ChatInterface';

function App() {
  const [error, setError] = useState<string | null>(null);

  try {
    return (
      <div className="w-full h-full">
        <ChatInterface />
      </div>
    );
  } catch (err: any) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading App</h1>
          <p className="text-red-800">{err.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}

export default App;
