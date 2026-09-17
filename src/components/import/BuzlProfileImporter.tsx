'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { validateBuzlProfileJson, BuzlProfileImportInput } from '@/lib/import/schema';
import {
  mapBuzlProfileToListing,
  ImportMappedListing,
  CategoryOption,
} from '@/lib/import/adapter';
import {
  checkImportDuplicates,
  createDraftFromImport,
  ImportDuplicateMatch,
} from '@/lib/business-actions';
import { BusinessFormData, Category } from '@/types/business';
import BusinessPreviewCard from '@/components/business/BusinessPreviewCard';

interface BuzlProfileImporterProps {
  user: {
    id: string;
    email?: string | null;
    role: string;
    isAdmin: boolean;
    isBuzlMember: boolean;
    memberId?: string | null;
    profileName?: string | null;
  };
  activeCategories: CategoryOption[];
}

const LAPTECH_SAMPLE_JSON = `{
  "_id": "65b2f8a9e4b0123456789abc",
  "gbpStatus": "active",
  "name": "Laptech",
  "category": "Electronics repair shop",
  "additionalCategories": [
    "Computer service",
    "Data recovery service"
  ],
  "serviceModel": "service_area",
  "country": "IN",
  "languages": ["en", "ta"],
  "timezone": "Asia/Kolkata",
  "placeId": "ChIJb8G_laptech_chennai_place_id",
  "location": {
    "address": "Shop No 14, 1st Floor, Chennai Complex, Anna Nagar, Chennai, Tamil Nadu 600040",
    "geo": {
      "lat": 13.0827,
      "lng": 80.2707
    },
    "serviceAreas": [
      "Chennai"
    ],
    "landmarks": [
      "Opposite Anna Nagar Tower Park"
    ]
  },
  "contact": {
    "phone": "+91 97890 90902",
    "email": "support@laptechsss.in",
    "bookingUrl": "http://www.laptechsss.in/book-appointment"
  },
  "services": [
    "Laptop Screen Replacement",
    "Motherboard Chip-level Service",
    "Hard Drive Data Recovery",
    "SSD Upgrade & Installation",
    "RAM Expansion",
    "Laptop Keyboard Replacement",
    "Battery Replacement",
    "Liquid Damage Repair",
    "Hinges & Body Fabrication",
    "OS Installation & Activation",
    "Virus & Malware Removal",
    "Thermal Paste Reapplication",
    "Laptop Overheating Fix",
    "Power Jack DC Port Repair",
    "Audio Jack & Speaker Repair",
    "Touchpad Replacement",
    "Wi-Fi & Bluetooth Troubleshooting",
    "MacBook Logic Board Repair",
    "MacBook Screen Replacement",
    "BIOS Reprogramming",
    "Custom Gaming Laptop Service",
    "CCTV Setup for Business",
    "Annual Maintenance Contract",
    "Onsite Diagnostic Check",
    "Blue Screen Crash Resolution",
    "Laptop Dust Deep Cleaning"
  ],
  "products": [],
  "usp": [
    "Same-day diagnostic check",
    "90-day warranty on genuine spare parts"
  ],
  "tagline": "Trusted Multi-brand Laptop Service in Chennai",
  "notes": "Preferred walk-in and doorstep repair across Central and South Chennai",
  "performanceKeywords": [
    "laptop repair chennai",
    "macbook service anna nagar",
    "chip level motherboard fix"
  ],
  "website": {
    "url": "http://www.laptechsss.in/",
    "scope": "page"
  },
  "social": {
    "facebook": "https://facebook.com/laptechchennai",
    "instagram": "https://instagram.com/laptech_chennai",
    "linkedin": "https://linkedin.com/company/laptech-services",
    "youtube": "https://youtube.com/@laptechchennai"
  },
  "competitors": [],
  "locId": "locn-2569",
  "bussId": "buss-94",
  "status": "active",
  "createdAt": "2024-01-15T08:30:00.000Z",
  "createdBy": "legacy_import_agent_01",
  "updatedAt": "2024-06-20T14:45:00.000Z",
  "updatedBy": "legacy_admin_chennai"
}`;

export default function BuzlProfileImporter({
  user,
  activeCategories,
}: BuzlProfileImporterProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<BuzlProfileImportInput | null>(null);
  const [mappedListing, setMappedListing] = useState<ImportMappedListing | null>(null);
  const [formData, setFormData] = useState<BusinessFormData | null>(null);

  // Duplicate checks state
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [duplicateMatches, setDuplicateMatches] = useState<ImportDuplicateMatch[]>([]);

  // Submission state
  const [isPending, startTransition] = useTransition();
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    businessId: string;
    canonicalName: string;
    memberId?: string | null;
  } | null>(null);

  const handleParseJson = (rawString: string) => {
    setValidationErrors([]);
    setSubmissionError(null);
    setSuccessResult(null);

    const validation = validateBuzlProfileJson(rawString);
    if (!validation.success || !validation.data) {
      setValidationErrors(validation.errors || ['Validation failed']);
      setParsedData(null);
      setMappedListing(null);
      setFormData(null);
      return;
    }

    const data = validation.data;
    setParsedData(data);

    // Map to listing
    const mapped = mapBuzlProfileToListing(data, activeCategories);
    setMappedListing(mapped);
    setFormData(mapped.formData);

    // Run duplicate check
    setIsCheckingDuplicates(true);
    checkImportDuplicates({
      phone: mapped.formData.primary_phone,
      websiteUrl: mapped.formData.website_url,
      sourceBussId: mapped.sourceIdentity.bussId,
      sourceLocId: mapped.sourceIdentity.locId,
      sourcePlaceId: mapped.sourceIdentity.placeId,
    })
      .then((res) => {
        setDuplicateMatches(res.matches);
      })
      .finally(() => {
        setIsCheckingDuplicates(false);
      });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setJsonInput(content);
        handleParseJson(content);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    setJsonInput(LAPTECH_SAMPLE_JSON);
    handleParseJson(LAPTECH_SAMPLE_JSON);
  };

  const handleReset = () => {
    setJsonInput('');
    setValidationErrors([]);
    setParsedData(null);
    setMappedListing(null);
    setFormData(null);
    setDuplicateMatches([]);
    setSubmissionError(null);
    setSuccessResult(null);
  };

  const handleCategoryChange = (categoryId: string) => {
    if (!formData) return;
    setFormData({
      ...formData,
      primary_category_id: categoryId,
    });
  };

  const handlePrivacyToggle = (field: 'show_email' | 'show_street_address', val: boolean) => {
    if (!formData) return;
    setFormData({
      ...formData,
      [field]: val,
    });
  };

  const handleFieldChange = (field: keyof BusinessFormData, val: unknown) => {
    if (!formData) return;
    setFormData({
      ...formData,
      [field]: val,
    });
  };

  const handleCreateDraft = () => {
    if (!formData || !mappedListing) return;
    if (!formData.primary_category_id) {
      setSubmissionError('Category selection is required before creating a draft listing.');
      return;
    }

    setSubmissionError(null);
    startTransition(async () => {
      const res = await createDraftFromImport({
        formData,
        provenance: {
          source_record_id: mappedListing.sourceIdentity.recordId,
          source_buss_id: mappedListing.sourceIdentity.bussId,
          source_loc_id: mappedListing.sourceIdentity.locId,
          source_place_id: mappedListing.sourceIdentity.placeId,
        },
      });

      if (!res.success || !res.businessId) {
        setSubmissionError(res.error || 'Failed to create draft listing.');
      } else {
        setSuccessResult({
          businessId: res.businessId,
          canonicalName: formData.canonical_name,
          memberId: res.memberId || user.memberId,
        });
      }
    });
  };

  // Transform activeCategories to Category[] for preview component
  const previewCategories: Category[] = activeCategories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    active: true,
    sort_order: 0,
  }));

  return (
    <div className="space-y-8">
      {/* Top Banner & Member Identity Bar */}
      <div className="bg-white rounded-[12px] border border-[#DCE2E8] p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#004AAD]">
              Internal Tool
            </span>
            <span className="text-xs text-[#7D8795]">•</span>
            <span
              data-testid="header-role-badge"
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                user.isAdmin
                  ? 'bg-[#E3F2EA] text-[#087C3C] border-[#BCE5CF]'
                  : 'bg-[#F0EBFF] text-[#6929C4] border-[#D4BBFF]'
              }`}
            >
              {user.isAdmin ? 'Admin' : 'Buzl Member'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#2A3547]">
            Buzl Profile JSON Importer
          </h1>
          <p className="text-xs text-[#5D6776] mt-0.5">
            Onboard legacy Buzl profile records into canonical draft listings with Member ID traceability.
          </p>
        </div>

        {/* Member ID Attribution Card */}
        <div className="bg-[#F2F5FA] border border-[#DCE2E8] rounded-[8px] p-3 text-right">
          <div className="text-[11px] text-[#7D8795]">Logged in Member</div>
          <div className="text-sm font-semibold text-[#2A3547]">
            {user.profileName || user.email}
          </div>
          <div className="text-xs font-mono font-bold text-[#004AAD] mt-0.5">
            {user.memberId ? `Member ID: ${user.memberId}` : 'No Member ID assigned'}
          </div>
        </div>
      </div>

      {/* Success State */}
      {successResult && (
        <div className="bg-[#E3F2EA] border border-[#BCE5CF] rounded-[12px] p-8 text-center space-y-4 shadow-sm animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-[#087C3C] text-white flex items-center justify-center mx-auto shadow-md">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#087C3C] bg-white/80 px-3 py-1 rounded-full border border-[#BCE5CF]">
              BUZL PROFILE IMPORTED
            </span>
            <h2 className="text-2xl font-bold text-[#2A3547] mt-3">
              Draft Listing Created Successfully
            </h2>
            <p className="text-sm text-[#5D6776] max-w-xl mx-auto mt-1">
              The profile for <strong className="text-[#2A3547]">{successResult.canonicalName}</strong> has been safely converted to a <strong className="text-[#004AAD]">DRAFT</strong> listing with full provenance attributed to Member ID <strong className="font-mono text-[#2A3547]">{successResult.memberId || 'N/A'}</strong>.
            </p>
          </div>

          <div className="bg-white rounded-[8px] border border-[#BCE5CF] p-4 max-w-md mx-auto text-left text-xs space-y-1.5 font-mono text-[#5D6776]">
            <div><span className="text-[#7D8795]">Business ID:</span> <span className="text-[#2A3547]">{successResult.businessId}</span></div>
            <div><span className="text-[#7D8795]">Publication Status:</span> <span className="text-amber-700 font-bold">draft (Requires Admin Review)</span></div>
            <div><span className="text-[#7D8795]">Provenance Source:</span> <span className="text-[#004AAD]">trusted_import</span></div>
            <div><span className="text-[#7D8795]">Imported By:</span> <span className="text-[#2A3547]">{successResult.memberId || user.email}</span></div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard/businesses"
              className="px-5 py-2.5 rounded-[8px] bg-[#004AAD] text-white text-sm font-semibold hover:bg-[#003882] transition-colors"
            >
              View in My Businesses
            </Link>
            {user.isAdmin && (
              <Link
                href="/admin/businesses"
                className="px-5 py-2.5 rounded-[8px] bg-white text-[#2A3547] border border-[#DCE2E8] text-sm font-semibold hover:bg-[#F2F5FA] transition-colors"
              >
                View in Admin Directory
              </Link>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2.5 rounded-[8px] text-[#5D6776] text-sm font-semibold hover:text-[#2A3547] hover:bg-white/60 transition-colors"
            >
              Import Another Profile
            </button>
          </div>
        </div>
      )}

      {/* Input Stage (Tabs & Upload / Paste) */}
      {!successResult && !mappedListing && (
        <div className="bg-white rounded-[12px] border border-[#DCE2E8] p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[#DCE2E8] pb-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`px-4 py-2 rounded-[8px] text-xs font-semibold transition-colors ${
                  activeTab === 'paste'
                    ? 'bg-[#004AAD] text-white'
                    : 'bg-[#F2F5FA] text-[#5D6776] hover:text-[#2A3547]'
                }`}
              >
                Paste JSON
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-2 rounded-[8px] text-xs font-semibold transition-colors ${
                  activeTab === 'upload'
                    ? 'bg-[#004AAD] text-white'
                    : 'bg-[#F2F5FA] text-[#5D6776] hover:text-[#2A3547]'
                }`}
              >
                Upload .json File
              </button>
            </div>

            <button
              type="button"
              onClick={handleLoadSample}
              className="px-3 py-1.5 rounded-[6px] bg-[#ECF4FF] text-[#004AAD] border border-[#BEDBFE] text-xs font-semibold hover:bg-[#DCEBFE] transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Load Laptech Sample Profile
            </button>
          </div>

          {/* Validation Errors Box */}
          {validationErrors.length > 0 && (
            <div className="bg-[#FDECEE] border border-[#F8B4B4] rounded-[8px] p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 text-[#C52707] font-semibold">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>JSON Validation Errors ({validationErrors.length})</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[#C52707]/90 font-mono">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'paste' ? (
            <div className="space-y-3">
              <label htmlFor="jsonInput" className="block text-xs font-semibold text-[#2A3547]">
                Profile JSON Payload <span className="text-red-500">*</span>
              </label>
              <textarea
                id="jsonInput"
                rows={14}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='Paste raw Buzl Profile JSON here (e.g. {"name": "...", "category": "...", "serviceModel": "..."})'
                className="w-full font-mono text-xs p-4 rounded-[8px] border border-[#DCE2E8] bg-[#FAFBFD] text-[#2A3547] focus:outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD]"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!jsonInput.trim()}
                  onClick={() => handleParseJson(jsonInput)}
                  className="px-6 py-2.5 rounded-[8px] bg-[#004AAD] text-white text-xs font-semibold hover:bg-[#003882] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Parse & Review Profile
                </button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-[#DCE2E8] rounded-[12px] p-8 text-center space-y-3 bg-[#FAFBFD]">
              <div className="w-12 h-12 rounded-full bg-[#ECF4FF] text-[#004AAD] flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#004AAD] hover:underline cursor-pointer">
                  <span>Choose a JSON file</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                </label>
                <span className="text-xs text-[#7D8795]"> or drag and drop</span>
                <p className="text-[11px] text-[#7D8795] mt-1">Single .json Buzl business profile export</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 8-Section Review Stage */}
      {mappedListing && formData && !successResult && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between flex-wrap gap-4 bg-white rounded-[8px] border border-[#DCE2E8] p-4">
            <div>
              <div className="text-xs font-semibold text-[#7D8795] uppercase">Reviewing Import</div>
              <div className="text-base font-bold text-[#2A3547]">
                {formData.canonical_name || 'Unnamed Business'}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-semibold rounded-[6px] border border-[#DCE2E8] text-[#5D6776] hover:bg-[#F2F5FA] transition-colors"
              >
                Cancel / Reset
              </button>
              <button
                type="button"
                disabled={isPending || !formData.primary_category_id}
                onClick={handleCreateDraft}
                className="px-6 py-2 text-xs font-semibold rounded-[6px] bg-[#004AAD] text-white hover:bg-[#003882] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isPending && (
                  <svg className="w-3.5 h-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                Create Draft Listing
              </button>
            </div>
          </div>

          {submissionError && (
            <div className="bg-[#FDECEE] border border-[#F8B4B4] rounded-[8px] p-4 text-xs text-[#C52707] font-medium">
              {submissionError}
            </div>
          )}

          {/* Grid Layout: 8 Sections Left, Public Preview Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              {/* SECTION 1: SOURCE IDENTITY */}
              <div className="bg-white rounded-[10px] border border-[#DCE2E8] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#DCE2E8] pb-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#2A3547] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#ECF4FF] text-[#004AAD] flex items-center justify-center text-[10px] font-bold">1</span>
                    Source Identity & Provenance
                  </h2>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Legacy Status: {mappedListing.sourceIdentity.legacyStatus}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-[#7D8795] block">Record ID</span>
                    <span className="font-mono text-[#2A3547] truncate block" title={mappedListing.sourceIdentity.recordId || ''}>
                      {mappedListing.sourceIdentity.recordId || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#7D8795] block">Legacy bussId</span>
                    <span className="font-mono text-[#2A3547] truncate block" title={mappedListing.sourceIdentity.bussId || ''}>
                      {mappedListing.sourceIdentity.bussId || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#7D8795] block">Legacy locId</span>
                    <span className="font-mono text-[#2A3547] truncate block" title={mappedListing.sourceIdentity.locId || ''}>
                      {mappedListing.sourceIdentity.locId || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#7D8795] block">Google Place ID</span>
                    <span className="font-mono text-[#2A3547] truncate block" title={mappedListing.sourceIdentity.placeId || ''}>
                      {mappedListing.sourceIdentity.placeId || 'N/A'}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-[#7D8795] italic">
                  Legacy status active does NOT trigger publication. Record will be drafted and require review.
                </p>
              </div>

              {/* SECTION 2: IMPORT ACTOR */}
              <div className="bg-white rounded-[10px] border border-[#DCE2E8] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#DCE2E8] pb-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#2A3547] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#ECF4FF] text-[#004AAD] flex items-center justify-center text-[10px] font-bold">2</span>
                    Import Actor Attribution
                  </h2>
                  <span className="text-[11px] font-mono font-bold text-[#004AAD] bg-[#ECF4FF] px-2.5 py-0.5 rounded border border-[#BEDBFE]">
                    {user.memberId || 'No Member ID'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-[#7D8795] block">Actor Name</span>
                    <span className="font-semibold text-[#2A3547]">{user.profileName || user.email}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#7D8795] block">Role</span>
                    <span className="capitalize text-[#2A3547]">{user.role.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#7D8795] block">Attribution</span>
                    <span className="text-emerald-700 font-medium">Traceable Audit</span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: BUSINESS INFORMATION */}
              <div className="bg-white rounded-[10px] border border-[#DCE2E8] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#DCE2E8] pb-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#2A3547] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#ECF4FF] text-[#004AAD] flex items-center justify-center text-[10px] font-bold">3</span>
                    Business Information
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-[#7D8795] block mb-1">
                      Canonical Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.canonical_name}
                      onChange={(e) => handleFieldChange('canonical_name', e.target.value)}
                      className="w-full text-xs p-2 rounded border border-[#DCE2E8] text-[#2A3547] focus:border-[#004AAD] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#7D8795] block mb-1">
                      Primary Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.primary_phone}
                      onChange={(e) => handleFieldChange('primary_phone', e.target.value)}
                      className="w-full text-xs p-2 rounded border border-[#DCE2E8] text-[#2A3547] focus:border-[#004AAD] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#7D8795] block mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={formData.business_contact_email}
                      onChange={(e) => handleFieldChange('business_contact_email', e.target.value)}
                      className="w-full text-xs p-2 rounded border border-[#DCE2E8] text-[#2A3547] focus:border-[#004AAD] outline-none"
                    />
                    <span className="text-[10px] text-[#7D8795] block mt-0.5">Separate from auth login; hidden by default</span>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#7D8795] block mb-1">
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={formData.website_url}
                      onChange={(e) => handleFieldChange('website_url', e.target.value)}
                      className="w-full text-xs p-2 rounded border border-[#DCE2E8] text-[#2A3547] focus:border-[#004AAD] outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-[#7D8795] block mb-1">
                      Description / Highlights
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      className="w-full text-xs p-2 rounded border border-[#DCE2E8] text-[#2A3547] focus:border-[#004AAD] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: CLASSIFICATION & CATEGORY MATCH */}
              <div className="bg-white rounded-[10px] border border-[#DCE2E8] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#DCE2E8] pb-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#2A3547] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#ECF4FF] text-[#004AAD] flex items-center justify-center text-[10px] font-bold">4</span>
                    Classification & Category
                  </h2>
                  {mappedListing.categoryMatch.status === 'matched' ? (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Matched
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      CATEGORY REVIEW REQUIRED
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#7D8795]">Source Category:</span>
                    <span className="font-semibold text-[#2A3547]">
                      &quot;{mappedListing.categoryMatch.sourceCategory}&quot;
                    </span>
                  </div>

                  {mappedListing.categoryMatch.status === 'review_required' && (
                    <div className="bg-amber-50 border border-amber-200 rounded p-2.5 text-[11px] text-amber-900">
                      <strong>Action Required:</strong> The source category &quot;{mappedListing.categoryMatch.sourceCategory}&quot; is not an active category in Buzl Listing. Please select the closest active platform category below.
                    </div>
                  )}

                  <div>
                    <label htmlFor="platform_category_select" className="text-[11px] font-semibold text-[#7D8795] block mb-1">
                      Assigned Platform Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="platform_category_select"
                      value={formData.primary_category_id}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className={`w-full text-xs p-2 rounded border text-[#2A3547] focus:border-[#004AAD] outline-none ${
                        !formData.primary_category_id ? 'border-amber-400 bg-amber-50/30' : 'border-[#DCE2E8]'
                      }`}
                    >
                      <option value="">-- Select Active Category --</option>
                      {activeCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 5: LOCATION & SERVICE AREA */}
              <div className="bg-white rounded-[10px] border border-[#DCE2E8] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#DCE2E8] pb-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#2A3547] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#ECF4FF] text-[#004AAD] flex items-center justify-center text-[10px] font-bold">5</span>
                    Location & Delivery Mode
                  </h2>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#F2F5FA] text-[#5D6776] border border-[#DCE2E8] capitalize">
                    Mode: {formData.location_mode.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[11px] text-[#7D8795] block">Legacy Raw Address</span>
                    <span className="text-[#2A3547] font-medium block bg-[#FAFBFD] p-2 rounded border border-[#DCE2E8]">
                      {parsedData?.location?.address || 'None provided'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[11px] text-[#7D8795] block">City</span>
                      <span className="font-semibold text-[#2A3547]">{formData.city || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#7D8795] block">State</span>
                      <span className="font-semibold text-[#2A3547]">{formData.state || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#7D8795] block">Postal Code</span>
                      <span className="font-mono text-[#2A3547]">{parsedData?.location?.address ? 'Detected in source' : 'N/A'}</span>
                    </div>
                  </div>

                  {formData.location_mode === 'service_area' && (
                    <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded p-2.5 text-[11px] text-[#1E40AF] space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Service-Area Privacy Enforcement
                      </div>
                      <p>
                        Street address and coordinates are suppressed from the public directory. Only city, state, and named service areas are visible publicly. Legacy street address is retained internally for review.
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-[11px] text-[#7D8795] block mb-1">Service Areas ({formData.service_areas.length})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.service_areas.map((area, idx) => (
                        <span key={idx} className="bg-[#F2F5FA] border border-[#DCE2E8] px-2 py-0.5 rounded text-[11px] font-medium text-[#2A3547]">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>

                  {mappedListing.sourceCoordinates.lat !== null && (
                    <div className="text-[11px] text-[#7D8795] flex items-center gap-2">
                      <span>Source Coordinates:</span>
                      <span className="font-mono text-[#2A3547]">
                        {mappedListing.sourceCoordinates.lat}, {mappedListing.sourceCoordinates.lng}
                      </span>
                      {mappedListing.sourceCoordinates.isSuppressedFromPublic && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                          Internal Only (Suppressed from Public)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 6: SERVICES */}
              <div className="bg-white rounded-[10px] border border-[#DCE2E8] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#DCE2E8] pb-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#2A3547] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#ECF4FF] text-[#004AAD] flex items-center justify-center text-[10px] font-bold">6</span>
                    Services Provided ({formData.services.length})
                  </h2>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
                  {formData.services.map((srv, idx) => {
                    const name = typeof srv === 'string' ? srv : srv.service_name;
                    return (
                      <span key={idx} className="bg-[#ECF4FF] text-[#004AAD] border border-[#BEDBFE] px-2.5 py-1 rounded-full text-xs font-medium">
                        {name}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 7: WARNINGS & DUPLICATE DETECTION */}
              <div className="bg-white rounded-[10px] border border-[#DCE2E8] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#DCE2E8] pb-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#2A3547] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#ECF4FF] text-[#004AAD] flex items-center justify-center text-[10px] font-bold">7</span>
                    Warnings & Duplicate Signals
                  </h2>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Duplicate Status */}
                  {isCheckingDuplicates ? (
                    <div className="text-xs text-[#7D8795] flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 animate-spin text-[#004AAD]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Checking for duplicate listings (phone, domain, placeId, bussId, locId)...
                    </div>
                  ) : duplicateMatches.length > 0 ? (
                    <div className="bg-amber-50 border border-amber-300 rounded p-3 text-amber-900 space-y-2">
                      <div className="font-bold flex items-center gap-1.5 text-xs">
                        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Duplicate Signal Detected ({duplicateMatches.length})
                      </div>
                      <p className="text-[11px]">
                        The following existing listing matches fields in this profile. You may still proceed with drafting if intentional, but admin review will flag this:
                      </p>
                      <ul className="space-y-1 text-[11px]">
                        {duplicateMatches.map((m, idx) => (
                          <li key={idx} className="bg-white/80 p-1.5 rounded border border-amber-200">
                            <strong>{m.canonical_name}</strong> matches on <strong>{m.field}</strong>: <code className="font-mono text-[10px]">{m.value}</code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded flex items-center gap-2 text-xs">
                      <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      No duplicate signals detected across phone, domain, or legacy IDs.
                    </div>
                  )}

                  {/* Adapter Warnings */}
                  {mappedListing.warnings.map((w, idx) => (
                    <div key={idx} className="bg-[#FAFBFD] border border-[#DCE2E8] p-2.5 rounded text-[11px] text-[#5D6776]">
                      {w}
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 8: PRIVACY CONTROLS */}
              <div className="bg-white rounded-[10px] border border-[#DCE2E8] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#DCE2E8] pb-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#2A3547] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#ECF4FF] text-[#004AAD] flex items-center justify-center text-[10px] font-bold">8</span>
                    Privacy Controls
                  </h2>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Email Toggle */}
                  <label className="flex items-start gap-3 cursor-pointer p-2 rounded hover:bg-[#F2F5FA]">
                    <input
                      type="checkbox"
                      checked={formData.show_email}
                      onChange={(e) => handlePrivacyToggle('show_email', e.target.checked)}
                      className="mt-0.5 rounded text-[#004AAD] focus:ring-[#004AAD]"
                    />
                    <div>
                      <div className="font-semibold text-[#2A3547]">Display Contact Email Publicly</div>
                      <div className="text-[11px] text-[#7D8795]">
                        Default: False. Keeps business contact email hidden from public crawlers to prevent scraping and spam.
                      </div>
                    </div>
                  </label>

                  {/* Street Address Toggle */}
                  <label className={`flex items-start gap-3 p-2 rounded ${
                    formData.location_mode === 'service_area' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-[#F2F5FA]'
                  }`}>
                    <input
                      type="checkbox"
                      disabled={formData.location_mode === 'service_area'}
                      checked={formData.show_street_address}
                      onChange={(e) => handlePrivacyToggle('show_street_address', e.target.checked)}
                      className="mt-0.5 rounded text-[#004AAD] focus:ring-[#004AAD]"
                    />
                    <div>
                      <div className="font-semibold text-[#2A3547]">Display Street Address Publicly</div>
                      <div className="text-[11px] text-[#7D8795]">
                        {formData.location_mode === 'service_area'
                          ? 'Locked to False for Service Area listings per privacy requirements.'
                          : 'Shows exact physical street address on public listing page.'}
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: LIVE PUBLIC-SAFE PREVIEW */}
            <div className="lg:col-span-5 space-y-4">
              <div className="sticky top-20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#7D8795]">
                    Public-Safe Preview
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">
                    Verified Safe
                  </span>
                </div>
                <BusinessPreviewCard data={formData} categories={previewCategories} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
