import { ClientImport } from './components/ClientImport';
import { TemplateUpload } from './components/TemplateUpload';
import { FormFiller } from './components/FormFiller';

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
        
        <div className="bg-white rounded-lg shadow-lg">
          <ClientImport />
          <TemplateUpload />
          <FormFiller />
        </div>
      </div>
    </div>
  );
}

export default App;
