import { useState } from 'react';
import { Client } from '@shared/schemas';
import { clientDataService } from '../services/ClientDataService';

export function ClientImport() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    try {
      setLoading(true);
      setError(null);

      const filePath = await window.electronAPI.selectFile({
        filters: [
          { name: 'Data Files', extensions: ['json', 'csv', 'xlsx', 'xls'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (!filePath) {
        setLoading(false);
        return;
      }

      const loadedClients = await clientDataService.loadClientsFromFile(filePath);
      setClients(loadedClients);
    } catch (err: any) {
      setError(err.message || 'Failed to import clients');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Import Client Data</h2>
        <p className="text-gray-600">Load client information from JSON, CSV, or Excel files</p>
      </div>

      <button
        onClick={handleImport}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Loading...' : 'Select File'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {clients.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Loaded {clients.length} client{clients.length !== 1 ? 's' : ''}
          </h3>
          <div className="grid gap-4">
            {clients.map((client) => (
              <div
                key={client.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {client.firstName} {client.lastName}
                    </h4>
                    {client.email && (
                      <p className="text-sm text-gray-600 mt-1">{client.email}</p>
                    )}
                    {client.phone && (
                      <p className="text-sm text-gray-600">{client.phone}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    ID: {client.id.slice(0, 8)}...
                  </span>
                </div>
                {client.address && (
                  <div className="mt-2 text-sm text-gray-600">
                    {client.address.street && <div>{client.address.street}</div>}
                    {(client.address.city || client.address.state || client.address.zipCode) && (
                      <div>
                        {client.address.city}
                        {client.address.state && `, ${client.address.state}`}
                        {client.address.zipCode && ` ${client.address.zipCode}`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
