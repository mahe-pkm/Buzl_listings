'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PlaceSuggestion, NormalizedPlaceDetails } from '@/lib/places/types';

interface PlacesLocationSearchProps {
  selectedPlaceId?: string | null;
  currentAddressSummary?: string;
  hasCoordinates?: boolean;
  onSelect: (details: NormalizedPlaceDetails) => void;
  onClear?: () => void;
  disabled?: boolean;
}

function createSessionToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `st_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export default function PlacesLocationSearch({
  selectedPlaceId,
  currentAddressSummary,
  hasCoordinates,
  onSelect,
  onClear,
  disabled = false,
}: PlacesLocationSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string>(() => createSessionToken());

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refreshSessionToken = useCallback(() => {
    setSessionToken(createSessionToken());
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle query input change
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setErrorMsg(null);
    }
  };

  // Debounced autocomplete fetch
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const url = `/api/places/autocomplete?q=${encodeURIComponent(trimmed)}&sessionToken=${encodeURIComponent(sessionToken)}`;
        const res = await fetch(url);
        const data = await res.json();

        if (res.ok && data.success) {
          setSuggestions(data.suggestions || []);
          setIsOpen(true);
          setActiveIndex(-1);
        } else {
          setSuggestions([]);
          if (data.errorCode === 'NOT_CONFIGURED') {
            setErrorMsg('Google Places API is awaiting configuration. Address fields can be edited directly.');
          } else {
            setErrorMsg(data.error || 'Failed to search places');
          }
        }
      } catch {
        setSuggestions([]);
        setErrorMsg('Network error while searching places');
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, sessionToken]);

  // Handle selecting a place
  const handleSelectSuggestion = async (suggestion: PlaceSuggestion) => {
    setIsFetchingDetails(true);
    setErrorMsg(null);
    setIsOpen(false);

    try {
      const url = `/api/places/details?placeId=${encodeURIComponent(suggestion.place_id)}&sessionToken=${encodeURIComponent(sessionToken)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (res.ok && data.success && data.details) {
        onSelect(data.details);
        setQuery('');
        refreshSessionToken(); // refresh token after a successful detail lookup
      } else {
        setErrorMsg(data.error || 'Failed to fetch place details');
      }
    } catch {
      setErrorMsg('Network error while fetching place details');
    } finally {
      setIsFetchingDetails(false);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  const hasVerifiedPlace = Boolean(selectedPlaceId || hasCoordinates);

  return (
    <div ref={containerRef} className="space-y-2">
      {/* Verified Location Banner when a place is already selected */}
      {hasVerifiedPlace && (
        <div className="p-3.5 rounded-[8px] bg-[#F0FDF4] border border-[#BBF7D0] flex items-start justify-between gap-3 transition-all">
          <div className="flex items-start gap-2.5">
            <span className="text-[#16A34A] text-base leading-none mt-0.5" aria-hidden="true">
              ✓
            </span>
            <div>
              <p className="text-xs font-bold text-[#166534] flex items-center gap-1.5">
                <span>Location verified</span>
                <span className="text-[11px] font-normal text-[#15803D]">— Map location saved</span>
              </p>
              {currentAddressSummary && (
                <p className="text-xs text-[#15803D] mt-0.5 font-medium leading-relaxed">
                  {currentAddressSummary}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onClear) onClear();
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            disabled={disabled}
            className="text-xs font-semibold text-[#004AAD] hover:underline whitespace-nowrap pt-0.5 disabled:opacity-50"
          >
            Change Location
          </button>
        </div>
      )}

      {/* Search Input Box */}
      <div className="relative">
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-[#7D8795] text-sm pointer-events-none" aria-hidden="true">
            🔍
          </span>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            value={query}
            disabled={disabled || isFetchingDetails}
            onChange={handleQueryChange}
            onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              hasVerifiedPlace
                ? 'Search a different address, landmark, or area...'
                : 'Search business address, landmark, or area with Google Places...'
            }
            className="w-full pl-9 pr-20 py-2.5 rounded-[8px] bg-white border border-[#DCE2E8] text-sm text-[#2A3547] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD] disabled:bg-[#F8FAFC] disabled:cursor-not-allowed"
            aria-autocomplete="list"
            aria-controls="places-suggestions-list"
            aria-expanded={isOpen}
          />
          <div className="absolute right-3 flex items-center gap-1.5">
            {(isLoading || isFetchingDetails) && (
              <span className="inline-block w-4 h-4 border-2 border-[#004AAD] border-t-transparent rounded-full animate-spin" title="Loading..." />
            )}
            {query && !isLoading && !isFetchingDetails && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSuggestions([]);
                  setIsOpen(false);
                  inputRef.current?.focus();
                }}
                className="text-xs text-[#7D8795] hover:text-[#2A3547] p-1 rounded hover:bg-[#F2F5FA]"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Status / Error Message */}
        {errorMsg && (
          <p className="text-xs text-[#DC2626] mt-1.5 px-1">{errorMsg}</p>
        )}

        {/* Autocomplete Suggestions Dropdown */}
        {isOpen && suggestions.length > 0 && (
          <ul
            id="places-suggestions-list"
            role="listbox"
            className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-[8px] border border-[#DCE2E8] shadow-lg max-h-64 overflow-y-auto divide-y divide-[#F1F5F9]"
          >
            {suggestions.map((suggestion, index) => {
              const isSelected = index === activeIndex;
              return (
                <li
                  key={suggestion.place_id || index}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className={`px-3.5 py-2.5 cursor-pointer flex items-start gap-2.5 transition-colors ${
                    isSelected ? 'bg-[#ECF4FF]' : 'hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span className="text-[#7D8795] text-sm mt-0.5 shrink-0" aria-hidden="true">
                    📍
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#2A3547] truncate">
                      {suggestion.primary_text || suggestion.description}
                    </p>
                    {suggestion.secondary_text && (
                      <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                        {suggestion.secondary_text}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
            <li className="px-3 py-1.5 bg-[#F8FAFC] text-[10px] text-[#94A3B8] text-right font-medium tracking-wide">
              Google Places Autocomplete
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
