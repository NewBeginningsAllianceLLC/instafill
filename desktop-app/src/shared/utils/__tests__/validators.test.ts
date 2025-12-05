import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidPhone,
  isValidZipCode,
  formatDate,
  formatPhone,
  sanitizeFileName,
} from '../validators';

describe('Validators', () => {
  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should validate correct phone numbers', () => {
      expect(isValidPhone('1234567890')).toBe(true);
      expect(isValidPhone('(123) 456-7890')).toBe(true);
      expect(isValidPhone('+1-123-456-7890')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone('abcdefghij')).toBe(false);
    });
  });

  describe('isValidZipCode', () => {
    it('should validate correct zip codes', () => {
      expect(isValidZipCode('12345')).toBe(true);
      expect(isValidZipCode('12345-6789')).toBe(true);
    });

    it('should reject invalid zip codes', () => {
      expect(isValidZipCode('1234')).toBe(false);
      expect(isValidZipCode('abcde')).toBe(false);
    });
  });

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date)).toBe('01/15/2024');
    });

    it('should handle string dates', () => {
      expect(formatDate('2024-12-25')).toBe('12/25/2024');
    });

    it('should return empty string for invalid dates', () => {
      expect(formatDate('invalid')).toBe('');
    });
  });

  describe('formatPhone', () => {
    it('should format 10-digit phone numbers', () => {
      expect(formatPhone('1234567890')).toBe('(123) 456-7890');
    });

    it('should format 11-digit phone numbers with country code', () => {
      expect(formatPhone('11234567890')).toBe('+1 (123) 456-7890');
    });

    it('should return original for other formats', () => {
      expect(formatPhone('123')).toBe('123');
    });
  });

  describe('sanitizeFileName', () => {
    it('should sanitize file names', () => {
      expect(sanitizeFileName('My File!@#.pdf')).toBe('My_File___.pdf');
      expect(sanitizeFileName('test/file\\name.txt')).toBe('test_file_name.txt');
    });
  });
});
