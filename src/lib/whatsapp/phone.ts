import type { PhoneNormalizationResult } from './types';

// Common country dialing codes for prefix matching
const KNOWN_COUNTRY_CODES = [
  '+91',   // India (default)
  '+1',    // USA / Canada
  '+44',   // UK
  '+971',  // UAE
  '+65',   // Singapore
  '+60',   // Malaysia
  '+61',   // Australia
  '+966',  // Saudi Arabia
  '+974',  // Qatar
  '+968',  // Oman
  '+965',  // Kuwait
  '+973',  // Bahrain
  '+49',   // Germany
  '+33',   // France
  '+81',   // Japan
  '+86',   // China
  '+82',   // South Korea
  '+7',    // Russia / Kazakhstan
  '+55',   // Brazil
  '+27',   // South Africa
];

/**
 * Normalizes a phone number to standard E.164 format (+[country code][number]).
 *
 * Rules:
 * 1. Strips whitespace, parentheses, hyphens, dots, and common punctuation.
 * 2. If the input starts with '+', validates the country code and digits.
 * 3. If the input starts with '00', treats as international prefix '+'.
 * 4. If the input has no country code and is a 10-digit number (common in India), applies defaultCountryCode (+91).
 * 5. If the input starts with '0' followed by 10 digits (common India trunk prefix), strips leading 0 and applies default (+91).
 * 6. Enforces E.164 length limits: minimum 8 digits, maximum 15 digits total (excluding '+').
 * 7. Fails closed with descriptive errors on malformed or ambiguous input.
 */
export function normalizePhoneNumber(
  rawInput: string | null | undefined,
  defaultCountryCode = '+91'
): PhoneNormalizationResult {
  if (!rawInput || typeof rawInput !== 'string') {
    return {
      success: false,
      error: 'Phone number is required.',
    };
  }

  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      success: false,
      error: 'Phone number cannot be empty.',
    };
  }

  // Check for disallowed characters (only allow +, digits, spaces, hyphens, parens, dots)
  if (!/^[\d\s\-().+]+$/.test(trimmed)) {
    return {
      success: false,
      error: 'Phone number contains invalid characters.',
    };
  }

  let cleaned = trimmed;

  // Handle international '00' prefix -> '+'
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  const hasPlus = cleaned.startsWith('+');
  // Strip all non-digit characters except leading '+'
  const digitsOnly = cleaned.replace(/\D/g, '');

  if (!digitsOnly) {
    return {
      success: false,
      error: 'Phone number must contain numeric digits.',
    };
  }

  let e164 = '';
  let countryCode = '';
  let nationalNumber = '';

  if (hasPlus) {
    // International format with explicit '+'
    const fullDigits = digitsOnly;
    if (fullDigits.length < 8 || fullDigits.length > 15) {
      return {
        success: false,
        error: `International phone numbers must be between 8 and 15 digits (got ${fullDigits.length}).`,
      };
    }

    e164 = `+${fullDigits}`;

    // Detect country code
    const matchingCode = KNOWN_COUNTRY_CODES
      .sort((a, b) => b.length - a.length)
      .find((code) => e164.startsWith(code));

    if (matchingCode) {
      countryCode = matchingCode;
      nationalNumber = e164.slice(matchingCode.length);
    } else {
      // Generic fallback: first 1-3 digits
      countryCode = '+' + fullDigits.slice(0, Math.min(3, fullDigits.length - 7));
      nationalNumber = fullDigits.slice(countryCode.length - 1);
    }
  } else {
    // No leading '+'.
    // Check for Indian numbers: 10 digits or 11 digits starting with 0
    if (digitsOnly.length === 10) {
      // Standard 10-digit number -> apply default country code
      countryCode = defaultCountryCode.startsWith('+') ? defaultCountryCode : `+${defaultCountryCode}`;
      nationalNumber = digitsOnly;
      e164 = `${countryCode}${nationalNumber}`;
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
      // 11 digits with leading trunk 0 (e.g. 09876543210) -> strip leading 0 and apply default country code
      countryCode = defaultCountryCode.startsWith('+') ? defaultCountryCode : `+${defaultCountryCode}`;
      nationalNumber = digitsOnly.slice(1);
      e164 = `${countryCode}${nationalNumber}`;
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      // 12 digits starting with 91 (India) without '+'
      countryCode = '+91';
      nationalNumber = digitsOnly.slice(2);
      e164 = `+${digitsOnly}`;
    } else if (digitsOnly.length >= 8 && digitsOnly.length <= 15) {
      // Check if it starts with a known country code without the '+'
      const matchingCode = KNOWN_COUNTRY_CODES
        .map((c) => c.replace('+', ''))
        .sort((a, b) => b.length - a.length)
        .find((code) => digitsOnly.startsWith(code) && (digitsOnly.length - code.length) >= 7);

      if (matchingCode) {
        countryCode = `+${matchingCode}`;
        nationalNumber = digitsOnly.slice(matchingCode.length);
        e164 = `+${digitsOnly}`;
      } else {
        // Assume default country code if total length matches
        countryCode = defaultCountryCode.startsWith('+') ? defaultCountryCode : `+${defaultCountryCode}`;
        nationalNumber = digitsOnly;
        e164 = `${countryCode}${nationalNumber}`;
      }
    } else {
      return {
        success: false,
        error: `Invalid phone number length (${digitsOnly.length} digits). Expected 10 digits for domestic or 8-15 digits with country code.`,
      };
    }
  }

  // Final length validation on E.164 digits
  const totalDigits = e164.replace(/\D/g, '').length;
  if (totalDigits < 8 || totalDigits > 15) {
    return {
      success: false,
      error: `Normalized number ${e164} is invalid: must be between 8 and 15 digits (got ${totalDigits}).`,
    };
  }

  return {
    success: true,
    e164,
    countryCode,
    nationalNumber,
    formatted: formatForDisplay(e164, countryCode, nationalNumber),
  };
}

/**
 * Formats an E.164 number for friendly user display.
 * E.g., +919876543210 -> +91 98765 43210
 */
export function formatForDisplay(e164: string, countryCode?: string, nationalNumber?: string): string {
  if (!countryCode || !nationalNumber) return e164;
  if (countryCode === '+91' && nationalNumber.length === 10) {
    return `${countryCode} ${nationalNumber.slice(0, 5)} ${nationalNumber.slice(5)}`;
  }
  if (countryCode === '+1' && nationalNumber.length === 10) {
    return `${countryCode} (${nationalNumber.slice(0, 3)}) ${nationalNumber.slice(3, 6)}-${nationalNumber.slice(6)}`;
  }
  return `${countryCode} ${nationalNumber}`;
}
