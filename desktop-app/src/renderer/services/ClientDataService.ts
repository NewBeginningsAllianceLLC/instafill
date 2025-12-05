import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Client, ClientSchema, ValidationResult } from '@shared/schemas';
import { validateData } from '@shared/utils/validators';

export class ClientDataService {
  private clients: Map<string, Client> = new Map();

  async loadClientsFromFile(filePath: string): Promise<Client[]> {
    const extension = filePath.split('.').pop()?.toLowerCase();

    let rawData: any[];

    switch (extension) {
      case 'json':
        rawData = await this.loadJSON(filePath);
        break;
      case 'csv':
        rawData = await this.loadCSV(filePath);
        break;
      case 'xlsx':
      case 'xls':
        rawData = await this.loadExcel(filePath);
        break;
      default:
        throw new Error(`Unsupported file format: ${extension}`);
    }

    const clients: Client[] = [];
    for (const data of rawData) {
      const client = this.parseClientData(data);
      if (client) {
        this.clients.set(client.id, client);
        clients.push(client);
      }
    }

    return clients;
  }

  private async loadJSON(filePath: string): Promise<any[]> {
    const content = await window.electronAPI.readFile(filePath);
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [data];
  }

  private async loadCSV(filePath: string): Promise<any[]> {
    const content = await window.electronAPI.readFile(filePath);
    
    return new Promise((resolve, reject) => {
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (error) => reject(error),
      });
    });
  }

  private async loadExcel(filePath: string): Promise<any[]> {
    const buffer = await window.electronAPI.readFile(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(firstSheet);
  }

  private parseClientData(data: any): Client | null {
    try {
      const clientData = {
        id: data.id || data.ID || this.generateId(),
        firstName: data.firstName || data.first_name || data.FirstName || '',
        lastName: data.lastName || data.last_name || data.LastName || '',
        dateOfBirth: data.dateOfBirth || data.dob || data.DOB || data.date_of_birth || undefined,
        email: data.email || data.Email || undefined,
        phone: data.phone || data.Phone || data.phoneNumber || undefined,
        address: {
          street: data.street || data.address || data.Address || undefined,
          city: data.city || data.City || undefined,
          state: data.state || data.State || undefined,
          zipCode: data.zipCode || data.zip || data.ZIP || undefined,
          country: data.country || data.Country || 'USA',
        },
        customFields: this.extractCustomFields(data),
        metadata: {
          source: 'file',
          lastUpdated: new Date(),
        },
      };

      const validation = validateData(ClientSchema, clientData);
      
      if (validation.success) {
        return validation.data;
      } else {
        console.warn('Client validation failed:', validation.result.errors);
        return null;
      }
    } catch (error) {
      console.error('Error parsing client data:', error);
      return null;
    }
  }

  private extractCustomFields(data: any): Record<string, any> {
    const standardFields = [
      'id', 'ID', 'firstName', 'first_name', 'FirstName',
      'lastName', 'last_name', 'LastName', 'dateOfBirth', 'dob', 'DOB',
      'email', 'Email', 'phone', 'Phone', 'phoneNumber',
      'street', 'address', 'Address', 'city', 'City',
      'state', 'State', 'zipCode', 'zip', 'ZIP', 'country', 'Country',
    ];

    const customFields: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (!standardFields.includes(key)) {
        customFields[key] = value;
      }
    }

    return customFields;
  }

  private generateId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getClient(id: string): Client | null {
    return this.clients.get(id) || null;
  }

  getAllClients(): Client[] {
    return Array.from(this.clients.values());
  }

  validateClientData(client: Client): ValidationResult {
    const validation = validateData(ClientSchema, client);
    
    if (validation.success) {
      return {
        valid: true,
        errors: [],
        warnings: [],
      };
    }
    
    return validation.result;
  }

  clearClients(): void {
    this.clients.clear();
  }

  addClient(client: Client): void {
    this.clients.set(client.id, client);
  }

  removeClient(id: string): boolean {
    return this.clients.delete(id);
  }
}

export const clientDataService = new ClientDataService();
