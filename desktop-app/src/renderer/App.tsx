import { ClientImport } from './components/ClientImport';

function App() {
  return (
    <div className="w-full h-full bg-gray-50 overflow-auto">
      <div className="max-w-6xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            PDF Auto Filler
          </h1>
          <p className="text-gray-600">
            Your automated PDF form filling solution
          </p>
        </div>
        
        <ClientImport />
      </div>
    </div>
  );
}

export default App;
