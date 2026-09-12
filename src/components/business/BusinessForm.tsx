'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  BusinessFormData,
  Category,
  LocationMode,
  PublicationStatus,
  VerificationStatus,
} from '@/types/business';
import BusinessPreviewCard from './BusinessPreviewCard';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  createBusiness,
  updateBusiness,
  checkDuplicates,
  transitionPublication,
  setVerification,
} from '@/lib/business-actions';

interface BusinessFormProps {
  categories: Category[];
  initialData?: BusinessFormData;
  businessId?: string;
  currentPublicationStatus?: PublicationStatus;
  currentVerificationStatus?: VerificationStatus;
  isAdmin?: boolean;
}

const DEFAULT_HOURS = [
  { day_of_week: 1, opens_at: '09:00', closes_at: '18:00', is_closed: false, is_24_hours: false }, // Mon
  { day_of_week: 2, opens_at: '09:00', closes_at: '18:00', is_closed: false, is_24_hours: false }, // Tue
  { day_of_week: 3, opens_at: '09:00', closes_at: '18:00', is_closed: false, is_24_hours: false }, // Wed
  { day_of_week: 4, opens_at: '09:00', closes_at: '18:00', is_closed: false, is_24_hours: false }, // Thu
  { day_of_week: 5, opens_at: '09:00', closes_at: '18:00', is_closed: false, is_24_hours: false }, // Fri
  { day_of_week: 6, opens_at: '10:00', closes_at: '16:00', is_closed: false, is_24_hours: false }, // Sat
  { day_of_week: 0, opens_at: null, closes_at: null, is_closed: true, is_24_hours: false }, // Sun
];

const STEPS = [
  { id: 1, label: 'Identity' },
  { id: 2, label: 'Contact' },
  { id: 3, label: 'Category & Services' },
  { id: 4, label: 'Location' },
  { id: 5, label: 'Hours & Social' },
  { id: 6, label: 'Preview & Submit' },
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function BusinessForm({
  categories,
  initialData,
  businessId,
  currentPublicationStatus = 'draft',
  currentVerificationStatus = 'unverified',
  isAdmin = false,
}: BusinessFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeStep, setActiveStep] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [duplicateNotice, setDuplicateNotice] = useState<string | null>(null);

  // New service / service area input scratch states
  const [newServiceInput, setNewServiceInput] = useState('');
  const [newAreaInput, setNewAreaInput] = useState('');

  // Form state
  const [formData, setFormData] = useState<BusinessFormData>(() => {
    if (initialData) return initialData;
    return {
      canonical_name: '',
      description: '',
      year_established: '',
      primary_phone: '',
      alternate_phone: '',
      whatsapp_phone: '',
      business_contact_email: '',
      show_email: false,
      website_url: '',
      primary_category_id: categories[0]?.id || '',
      services: [],
      location_mode: 'storefront',
      city: '',
      state: '',
      country: 'India',
      country_code: 'IN',
      address_line_1: '',
      address_line_2: '',
      locality: '',
      postal_code: '',
      show_street_address: true,
      latitude: '',
      longitude: '',
      service_areas: [],
      hours: DEFAULT_HOURS,
      facebook_url: '',
      instagram_url: '',
      linkedin_url: '',
      youtube_url: '',
    };
  });

  const updateField = <K extends keyof BusinessFormData>(key: K, value: BusinessFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Add / Remove services
  const handleAddService = () => {
    const trimmed = newServiceInput.trim();
    if (trimmed && !formData.services.includes(trimmed)) {
      updateField('services', [...formData.services, trimmed]);
      setNewServiceInput('');
    }
  };

  const handleRemoveService = (index: number) => {
    updateField(
      'services',
      formData.services.filter((_, i) => i !== index)
    );
  };

  // Add / Remove service areas
  const handleAddArea = () => {
    const trimmed = newAreaInput.trim();
    if (trimmed && !formData.service_areas.includes(trimmed)) {
      updateField('service_areas', [...formData.service_areas, trimmed]);
      setNewAreaInput('');
    }
  };

  const handleRemoveArea = (index: number) => {
    updateField(
      'service_areas',
      formData.service_areas.filter((_, i) => i !== index)
    );
  };

  // Handle Hour field changes
  const updateHour = (dayIndex: number, updates: Partial<(typeof DEFAULT_HOURS)[0]>) => {
    const updated = formData.hours.map((h) => {
      if (h.day_of_week === dayIndex) {
        return { ...h, ...updates };
      }
      return h;
    });
    updateField('hours', updated);
  };

  // Duplicate check trigger
  const runDuplicateCheck = async () => {
    if (formData.primary_phone) {
      const result = await checkDuplicates(formData.primary_phone, formData.website_url, businessId);
      if (result.isDuplicate) {
        setDuplicateNotice(result.message);
      } else {
        setDuplicateNotice(null);
      }
    }
  };

  const validateCurrentStep = (): boolean => {
    setErrorMsg(null);

    if (activeStep === 1) {
      if (!formData.canonical_name.trim()) {
        setErrorMsg('Business Name is required.');
        return false;
      }
    }

    if (activeStep === 2) {
      const digits = formData.primary_phone.replace(/[^0-9]/g, '');
      if (!digits || digits.length < 7 || digits.length > 20) {
        setErrorMsg('Primary Phone must contain between 7 and 20 digits.');
        return false;
      }
    }

    if (activeStep === 3) {
      if (!formData.primary_category_id) {
        setErrorMsg('Please select a Primary Category.');
        return false;
      }
    }

    if (activeStep === 4) {
      if (!formData.city.trim() || !formData.state.trim() || !formData.country.trim()) {
        setErrorMsg('City, State, and Country are required.');
        return false;
      }

      if (formData.location_mode === 'storefront' || formData.location_mode === 'hybrid') {
        if (!formData.address_line_1.trim() || !formData.locality.trim() || !formData.postal_code.trim()) {
          setErrorMsg('Address Line 1, Locality, and Postal Code are required for storefront locations.');
          return false;
        }
        if (!formData.latitude || !formData.longitude) {
          setErrorMsg('Latitude and Longitude coordinates are required for map location.');
          return false;
        }
        const lat = parseFloat(formData.latitude);
        const lng = parseFloat(formData.longitude);
        if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
          setErrorMsg('Latitude must be between -90 and 90, and Longitude between -180 and 180.');
          return false;
        }
      }

      if (formData.location_mode === 'service_area' || formData.location_mode === 'hybrid') {
        if (formData.service_areas.length === 0) {
          setErrorMsg('Please add at least one named service area (e.g. city district or coverage region).');
          return false;
        }
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (activeStep === 5) {
        runDuplicateCheck();
      }
      setActiveStep((prev) => Math.min(prev + 1, 6));
    }
  };

  const handlePrev = () => {
    setErrorMsg(null);
    setActiveStep((prev) => Math.max(prev - 1, 1));
  };

  // Submit Handler: Save as Draft or Update
  const handleSave = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      if (businessId) {
        const result = await updateBusiness(businessId, formData);
        if (result.success) {
          setSuccessMsg('Business listing updated successfully!');
        } else {
          setErrorMsg(result.error || 'Failed to update business');
        }
      } else {
        const result = await createBusiness(formData);
        if (result.success && result.businessId) {
          setSuccessMsg('Business listing created successfully!');
          router.push(`/dashboard/businesses/${result.businessId}/edit`);
        } else {
          setErrorMsg(result.error || 'Failed to create business');
        }
      }
    });
  };

  // Publication State Transitions
  const handleTransition = async (nextStatus: PublicationStatus) => {
    if (!businessId) {
      setErrorMsg('Please save the business listing before submitting or publishing.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      // First save current form data
      const saveRes = await updateBusiness(businessId, formData);
      if (!saveRes.success) {
        setErrorMsg(saveRes.error || 'Failed to save changes before status change.');
        return;
      }

      // Then transition publication
      const transRes = await transitionPublication(businessId, nextStatus);
      if (transRes.success) {
        setSuccessMsg(`Listing status successfully updated to ${nextStatus}.`);
        router.refresh();
      } else {
        setErrorMsg(transRes.error || `Failed to transition status to ${nextStatus}.`);
      }
    });
  };

  // Admin Verification Toggle
  const handleSetVerification = async (nextStatus: VerificationStatus) => {
    if (!businessId) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await setVerification(businessId, nextStatus);
      if (res.success) {
        setSuccessMsg(`Verification status updated to ${nextStatus}.`);
        router.refresh();
      } else {
        setErrorMsg(res.error || 'Failed to update verification status.');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Step Navigation Bar */}
      <div className="bg-white rounded-[8px] border border-[#DCE2E8] p-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {STEPS.map((step) => {
            const isCurrent = activeStep === step.id;
            const isDone = activeStep > step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (step.id < activeStep || validateCurrentStep()) {
                    if (step.id === 6) runDuplicateCheck();
                    setActiveStep(step.id);
                  }
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-[6px] text-xs font-semibold transition-all ${
                  isCurrent
                    ? 'bg-[#004AAD] text-white'
                    : isDone
                    ? 'bg-[#ECF4FF] text-[#004AAD] hover:bg-[#EAEFF4]'
                    : 'text-[#5D6776] hover:bg-[#F2F5FA]'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCurrent
                      ? 'bg-white text-[#004AAD]'
                      : isDone
                      ? 'bg-[#004AAD] text-white'
                      : 'bg-[#DCE2E8] text-[#5D6776]'
                  }`}
                >
                  {isDone ? '✓' : step.id}
                </span>
                <span>{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-[8px] bg-[#FDECEE] border border-[#F9C6CB] text-[#C93B2B] text-sm flex items-start gap-3">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold">Action Required</p>
            <p className="text-xs mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-[8px] bg-[#E3F2EA] border border-[#BCE5CF] text-[#087C3C] text-sm flex items-start gap-3">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <p className="font-semibold">Success</p>
            <p className="text-xs mt-0.5">{successMsg}</p>
          </div>
        </div>
      )}

      {/* Form Content Steps */}
      <div className="bg-white rounded-[8px] border border-[#DCE2E8] p-6 shadow-xs">
        {/* Step 1: Business Identity */}
        {activeStep === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-[#2A3547]">Step 1: Business Identity</h2>
              <p className="text-xs text-[#5D6776] mt-1">
                Provide canonical naming and foundational identification for your listing.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="canonical_name" className="block text-xs font-semibold text-[#2A3547] mb-1">
                  Canonical Business Name <span className="text-[#E36B5D]">*</span>
                </label>
                <input
                  id="canonical_name"
                  name="canonical_name"
                  type="text"
                  value={formData.canonical_name}
                  onChange={(e) => updateField('canonical_name', e.target.value)}
                  placeholder="e.g. Apex Digital Solutions"
                  maxLength={160}
                  className="w-full px-3.5 py-2 rounded-[8px] border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD]"
                />
                <p className="text-[11px] text-[#7D8795] mt-1">
                  The official citation name. Used to derive your stable URL slug.
                </p>
              </div>

              <div>
                <label htmlFor="description" className="block text-xs font-semibold text-[#2A3547] mb-1">
                  Business Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={4}
                  placeholder="Describe your services, specialties, and business background..."
                  maxLength={5000}
                  className="w-full px-3.5 py-2 rounded-[8px] border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD]"
                />
              </div>

              <div className="max-w-xs">
                <label htmlFor="year_established" className="block text-xs font-semibold text-[#2A3547] mb-1">
                  Year Established
                </label>
                <input
                  id="year_established"
                  name="year_established"
                  type="number"
                  value={formData.year_established}
                  onChange={(e) => updateField('year_established', e.target.value)}
                  placeholder="e.g. 2018"
                  min={1000}
                  max={new Date().getFullYear()}
                  className="w-full px-3.5 py-2 rounded-[8px] border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Contact / NAP */}
        {activeStep === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-[#2A3547]">Step 2: Contact Information (NAP)</h2>
              <p className="text-xs text-[#5D6776] mt-1">
                Canonical contact channels. Note: Business contact email is private by default and strictly independent of your login account.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="primary_phone" className="block text-xs font-semibold text-[#2A3547] mb-1">
                  Primary Phone <span className="text-[#E36B5D]">*</span>
                </label>
                <input
                  id="primary_phone"
                  name="primary_phone"
                  type="text"
                  value={formData.primary_phone}
                  onChange={(e) => updateField('primary_phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2 rounded-[8px] border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD]"
                />
                <p className="text-[11px] text-[#7D8795] mt-1">
                  Primary citation phone displayed publicly.
                </p>
              </div>

              <div>
                <label htmlFor="alternate_phone" className="block text-xs font-semibold text-[#2A3547] mb-1">
                  Alternate Phone
                </label>
                <input
                  id="alternate_phone"
                  name="alternate_phone"
                  type="text"
                  value={formData.alternate_phone}
                  onChange={(e) => updateField('alternate_phone', e.target.value)}
                  placeholder="+91 11 2345 6789"
                  className="w-full px-3.5 py-2 rounded-[8px] border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD]"
                />
              </div>

              <div>
                <label htmlFor="whatsapp_phone" className="block text-xs font-semibold text-[#2A3547] mb-1">
                  WhatsApp Number
                </label>
                <input
                  id="whatsapp_phone"
                  name="whatsapp_phone"
                  type="text"
                  value={formData.whatsapp_phone}
                  onChange={(e) => updateField('whatsapp_phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2 rounded-[8px] border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD]"
                />
              </div>

              <div>
                <label htmlFor="website_url" className="block text-xs font-semibold text-[#2A3547] mb-1">
                  Official Website URL
                </label>
                <input
                  id="website_url"
                  name="website_url"
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => updateField('website_url', e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3.5 py-2 rounded-[8px] border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD]"
                />
              </div>

              <div className="md:col-span-2 p-4 rounded-[8px] bg-[#F2F5FA] border border-[#DCE2E8] space-y-3">
                <div>
                  <label htmlFor="business_contact_email" className="block text-xs font-semibold text-[#2A3547] mb-1">
                    Business Contact Email (Optional)
                  </label>
                  <input
                    id="business_contact_email"
                    name="business_contact_email"
                    type="email"
                    value={formData.business_contact_email}
                    onChange={(e) => updateField('business_contact_email', e.target.value)}
                    placeholder="contact@business.com"
                    className="w-full px-3.5 py-2 rounded-[8px] bg-white border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD]"
                  />
                  <p className="text-[11px] text-[#7D8795] mt-1">
                    Strict privacy rule: Account login email is never exposed. Only enter an email intended for public communication.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="show_email"
                    checked={formData.show_email}
                    onChange={(e) => updateField('show_email', e.target.checked)}
                    className="w-4 h-4 rounded text-[#004AAD] border-[#DCE2E8] focus:ring-[#004AAD]"
                  />
                  <label htmlFor="show_email" className="text-xs font-medium text-[#2A3547] cursor-pointer">
                    Show this business email on public listing page
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Category & Services */}
        {activeStep === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-[#2A3547]">Step 3: Primary Category & Services</h2>
              <p className="text-xs text-[#5D6776] mt-1">
                Select your single primary curated category and define services offered.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="primary_category_id" className="block text-xs font-semibold text-[#2A3547] mb-1">
                  Primary Category <span className="text-[#E36B5D]">*</span>
                </label>
                <select
                  id="primary_category_id"
                  name="primary_category_id"
                  value={formData.primary_category_id}
                  onChange={(e) => updateField('primary_category_id', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[8px] border border-[#DCE2E8] text-sm text-[#2A3547] bg-white focus:outline-none focus:border-[#004AAD]"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#7D8795] mt-1">
                  Curated category for discovery and directory indexing.
                </p>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-[#2A3547] mb-1">
                  Owner-Defined Services
                </label>
                <p className="text-[11px] text-[#7D8795] mb-2">
                  Add specific services you provide (e.g. &quot;Search Engine Optimization&quot;, &quot;Custom Web Design&quot;).
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newServiceInput}
                    onChange={(e) => setNewServiceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddService();
                      }
                    }}
                    placeholder="Enter service name..."
                    maxLength={120}
                    className="flex-1 px-3.5 py-2 rounded-[8px] border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD]"
                  />
                  <button
                    type="button"
                    onClick={handleAddService}
                    className="px-4 py-2 rounded-[8px] bg-[#004AAD] text-white text-xs font-semibold hover:bg-[#003E91]"
                  >
                    Add Service
                  </button>
                </div>

                {formData.services.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 p-3 bg-[#F2F5FA] rounded-[8px] border border-[#DCE2E8]">
                    {formData.services.map((service, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-medium bg-white text-[#2A3547] border border-[#DCE2E8] shadow-2xs"
                      >
                        {service}
                        <button
                          type="button"
                          onClick={() => handleRemoveService(index)}
                          className="text-[#7D8795] hover:text-[#E36B5D] font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Location */}
        {activeStep === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-[#2A3547]">Step 4: Location & Coverage Mode</h2>
              <p className="text-xs text-[#5D6776] mt-1">
                Configure your operating location model and coverage.
              </p>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  id: 'storefront',
                  title: 'Physical Storefront',
                  desc: 'Customers visit your location. Requires full street address and map point.',
                },
                {
                  id: 'service_area',
                  title: 'Service-Area Only',
                  desc: 'You travel to customers. No street address or coordinates required. Requires named service areas.',
                },
                {
                  id: 'hybrid',
                  title: 'Hybrid Presence',
                  desc: 'Physical location plus designated travel service areas. Requires address, map point, and service areas.',
                },
              ].map((mode) => {
                const selected = formData.location_mode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      updateField('location_mode', mode.id as LocationMode);
                      if (mode.id === 'service_area') {
                        updateField('show_street_address', false);
                      } else {
                        updateField('show_street_address', true);
                      }
                    }}
                    className={`p-4 rounded-[8px] text-left border transition-all ${
                      selected
                        ? 'border-[#004AAD] bg-[#ECF4FF] shadow-xs'
                        : 'border-[#DCE2E8] hover:border-[#C8D0DA] bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${selected ? 'text-[#004AAD]' : 'text-[#2A3547]'}`}>
                        {mode.title}
                      </span>
                      {selected && <span className="w-2 h-2 rounded-full bg-[#004AAD]" />}
                    </div>
                    <p className="text-[11px] text-[#5D6776] leading-relaxed">{mode.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Common City/State/Country Hierarchy */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label htmlFor="city" className="block text-xs font-semibold text-[#2A3547] mb-1">
                  City <span className="text-[#E36B5D]">*</span>
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="e.g. New Delhi"
                  className="w-full px-3.5 py-2 rounded-[8px] border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD]"
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-xs font-semibold text-[#2A3547] mb-1">
                  State <span className="text-[#E36B5D]">*</span>
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  value={formData.state}
                  onChange={(e) => updateField('state', e.target.value)}
                  placeholder="e.g. Delhi"
                  className="w-full px-3.5 py-2 rounded-[8px] border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD]"
                />
              </div>

              <div>
                <label htmlFor="country" className="block text-xs font-semibold text-[#2A3547] mb-1">
                  Country <span className="text-[#E36B5D]">*</span>
                </label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  value={formData.country}
                  onChange={(e) => updateField('country', e.target.value)}
                  placeholder="India"
                  className="w-full px-3.5 py-2 rounded-[8px] border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD]"
                />
              </div>
            </div>

            {/* Storefront & Hybrid Address Fields */}
            {(formData.location_mode === 'storefront' || formData.location_mode === 'hybrid') && (
              <div className="p-4 rounded-[8px] bg-[#F2F5FA] border border-[#DCE2E8] space-y-4">
                <h3 className="text-xs font-bold text-[#2A3547] uppercase tracking-wider">
                  Storefront Physical Address
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="address_line_1" className="block text-xs font-semibold text-[#2A3547] mb-1">
                      Address Line 1 <span className="text-[#E36B5D]">*</span>
                    </label>
                    <input
                      id="address_line_1"
                      name="address_line_1"
                      type="text"
                      value={formData.address_line_1}
                      onChange={(e) => updateField('address_line_1', e.target.value)}
                      placeholder="e.g. 104, Barakhamba Road"
                      className="w-full px-3.5 py-2 rounded-[8px] bg-white border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>

                  <div>
                    <label htmlFor="address_line_2" className="block text-xs font-semibold text-[#2A3547] mb-1">
                      Address Line 2
                    </label>
                    <input
                      id="address_line_2"
                      name="address_line_2"
                      type="text"
                      value={formData.address_line_2}
                      onChange={(e) => updateField('address_line_2', e.target.value)}
                      placeholder="e.g. 4th Floor, Statesman House"
                      className="w-full px-3.5 py-2 rounded-[8px] bg-white border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>

                  <div>
                    <label htmlFor="locality" className="block text-xs font-semibold text-[#2A3547] mb-1">
                      Locality / Area <span className="text-[#E36B5D]">*</span>
                    </label>
                    <input
                      id="locality"
                      name="locality"
                      type="text"
                      value={formData.locality}
                      onChange={(e) => updateField('locality', e.target.value)}
                      placeholder="e.g. Connaught Place"
                      className="w-full px-3.5 py-2 rounded-[8px] bg-white border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>

                  <div>
                    <label htmlFor="postal_code" className="block text-xs font-semibold text-[#2A3547] mb-1">
                      Postal / PIN Code <span className="text-[#E36B5D]">*</span>
                    </label>
                    <input
                      id="postal_code"
                      name="postal_code"
                      type="text"
                      value={formData.postal_code}
                      onChange={(e) => updateField('postal_code', e.target.value)}
                      placeholder="e.g. 110001"
                      className="w-full px-3.5 py-2 rounded-[8px] bg-white border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>

                  <div>
                    <label htmlFor="latitude" className="block text-xs font-semibold text-[#2A3547] mb-1">
                      Map Latitude <span className="text-[#E36B5D]">*</span>
                    </label>
                    <input
                      id="latitude"
                      name="latitude"
                      type="text"
                      value={formData.latitude}
                      onChange={(e) => updateField('latitude', e.target.value)}
                      placeholder="e.g. 28.6297"
                      className="w-full px-3.5 py-2 rounded-[8px] bg-white border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>

                  <div>
                    <label htmlFor="longitude" className="block text-xs font-semibold text-[#2A3547] mb-1">
                      Map Longitude <span className="text-[#E36B5D]">*</span>
                    </label>
                    <input
                      id="longitude"
                      name="longitude"
                      type="text"
                      value={formData.longitude}
                      onChange={(e) => updateField('longitude', e.target.value)}
                      placeholder="e.g. 77.2274"
                      className="w-full px-3.5 py-2 rounded-[8px] bg-white border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="show_street_address"
                    checked={formData.show_street_address}
                    onChange={(e) => updateField('show_street_address', e.target.checked)}
                    className="w-4 h-4 rounded text-[#004AAD] border-[#DCE2E8]"
                  />
                  <label htmlFor="show_street_address" className="text-xs font-medium text-[#2A3547] cursor-pointer">
                    Show street address publicly on listing (Required for storefront publication)
                  </label>
                </div>
              </div>
            )}

            {/* Service Areas (for Service-Area and Hybrid) */}
            {(formData.location_mode === 'service_area' || formData.location_mode === 'hybrid') && (
              <div className="p-4 rounded-[8px] bg-[#F2F5FA] border border-[#DCE2E8] space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-[#2A3547] uppercase tracking-wider">
                    Named Service Areas <span className="text-[#E36B5D]">*</span>
                  </h3>
                  <p className="text-[11px] text-[#7D8795] mt-0.5">
                    Add regions or neighborhoods you serve (e.g. &quot;South Delhi&quot;, &quot;Dwarka&quot;, &quot;Noida Sector 62&quot;).
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAreaInput}
                    onChange={(e) => setNewAreaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddArea();
                      }
                    }}
                    placeholder="Enter coverage area..."
                    maxLength={120}
                    className="flex-1 px-3.5 py-2 rounded-[8px] bg-white border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD]"
                  />
                  <button
                    type="button"
                    onClick={handleAddArea}
                    className="px-4 py-2 rounded-[8px] bg-[#004AAD] text-white text-xs font-semibold hover:bg-[#003E91]"
                  >
                    Add Area
                  </button>
                </div>

                {formData.service_areas.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.service_areas.map((area, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-medium bg-white text-[#2A3547] border border-[#DCE2E8]"
                      >
                        {area}
                        <button
                          type="button"
                          onClick={() => handleRemoveArea(index)}
                          className="text-[#7D8795] hover:text-[#E36B5D] font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 5: Hours & Social */}
        {activeStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-[#2A3547]">Step 5: Business Hours & Social Links</h2>
              <p className="text-xs text-[#5D6776] mt-1">
                Set regular opening hours and connect your verified social media pages.
              </p>
            </div>

            {/* 7-Day Hours Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[#7D8795] uppercase tracking-wider">
                Weekly Operating Schedule
              </h3>
              <div className="space-y-2">
                {formData.hours.map((h) => (
                  <div
                    key={h.day_of_week}
                    className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-[8px] bg-[#F2F5FA] border border-[#DCE2E8]"
                  >
                    <div className="w-24 text-xs font-bold text-[#2A3547]">
                      {DAY_NAMES[h.day_of_week]}
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-[#5D6776]">
                        <input
                          type="checkbox"
                          checked={h.is_closed}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            updateHour(h.day_of_week, {
                              is_closed: checked,
                              is_24_hours: checked ? false : h.is_24_hours,
                            });
                          }}
                          className="w-3.5 h-3.5 rounded text-[#004AAD]"
                        />
                        Closed
                      </label>

                      <label className="flex items-center gap-1.5 text-xs text-[#5D6776]">
                        <input
                          type="checkbox"
                          checked={h.is_24_hours}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            updateHour(h.day_of_week, {
                              is_24_hours: checked,
                              is_closed: checked ? false : h.is_closed,
                            });
                          }}
                          className="w-3.5 h-3.5 rounded text-[#004AAD]"
                        />
                        24 Hours
                      </label>
                    </div>

                    {!h.is_closed && !h.is_24_hours ? (
                      <div className="flex items-center gap-2 text-xs">
                        <input
                          type="time"
                          value={h.opens_at?.slice(0, 5) || '09:00'}
                          onChange={(e) => updateHour(h.day_of_week, { opens_at: e.target.value })}
                          className="px-2 py-1 rounded border border-[#DCE2E8] bg-white text-[#2A3547]"
                        />
                        <span className="text-[#7D8795]">to</span>
                        <input
                          type="time"
                          value={h.closes_at?.slice(0, 5) || '18:00'}
                          onChange={(e) => updateHour(h.day_of_week, { closes_at: e.target.value })}
                          className="px-2 py-1 rounded border border-[#DCE2E8] bg-white text-[#2A3547]"
                        />
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-[#7D8795] italic">
                        {h.is_closed ? 'Closed all day' : 'Open 24 hours'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Social Channels */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-[#7D8795] uppercase tracking-wider">
                Social Profiles (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2A3547] mb-1">
                    Facebook URL
                  </label>
                  <input
                    type="url"
                    value={formData.facebook_url}
                    onChange={(e) => updateField('facebook_url', e.target.value)}
                    placeholder="https://facebook.com/yourbusiness"
                    className="w-full px-3.5 py-2 rounded-[8px] border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2A3547] mb-1">
                    Instagram URL
                  </label>
                  <input
                    type="url"
                    value={formData.instagram_url}
                    onChange={(e) => updateField('instagram_url', e.target.value)}
                    placeholder="https://instagram.com/yourbusiness"
                    className="w-full px-3.5 py-2 rounded-[8px] border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2A3547] mb-1">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={formData.linkedin_url}
                    onChange={(e) => updateField('linkedin_url', e.target.value)}
                    placeholder="https://linkedin.com/company/yourbusiness"
                    className="w-full px-3.5 py-2 rounded-[8px] border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2A3547] mb-1">
                    YouTube URL
                  </label>
                  <input
                    type="url"
                    value={formData.youtube_url}
                    onChange={(e) => updateField('youtube_url', e.target.value)}
                    placeholder="https://youtube.com/@yourbusiness"
                    className="w-full px-3.5 py-2 rounded-[8px] border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Preview, Duplicate Warning & Submit */}
        {activeStep === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-[#2A3547]">Step 6: Public-Safe Preview & Publication</h2>
              <p className="text-xs text-[#5D6776] mt-1">
                Inspect how your business is rendered publicly, verify details, and manage publication state.
              </p>
            </div>

            {/* Non-blocking Duplicate Warning Alert */}
            {duplicateNotice && (
              <div className="p-4 rounded-[8px] bg-[#FFF6DF] border border-[#FFE7A8] text-[#9A6700] text-xs flex items-start gap-3">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-bold text-sm">Duplicate Signal Warning</p>
                  <p className="mt-1 leading-relaxed">{duplicateNotice}</p>
                  <p className="mt-1 text-[11px] text-[#7D8795]">
                    Note: You are permitted to save and submit. Buzl administrators verify all business records before publication.
                  </p>
                </div>
              </div>
            )}

            {/* Current Lifecycle Status Pill */}
            {businessId && (
              <div className="p-4 rounded-[8px] bg-[#F2F5FA] border border-[#DCE2E8] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-[#7D8795] uppercase tracking-wider block">
                    Current Listing Status
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={currentPublicationStatus} type="publication" />
                    <StatusBadge status={currentVerificationStatus} type="verification" />
                  </div>
                </div>

                {/* Admin controls */}
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        handleSetVerification(
                          currentVerificationStatus === 'verified' ? 'unverified' : 'verified'
                        )
                      }
                      className="px-3 py-1.5 rounded-[6px] text-xs font-semibold bg-white border border-[#DCE2E8] text-[#2A3547] hover:bg-[#F2F5FA]"
                    >
                      {currentVerificationStatus === 'verified' ? 'Mark Unverified' : 'Verify Listing'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Public-Safe Preview Card */}
            <div>
              <BusinessPreviewCard data={formData} categories={categories} />
            </div>

            {/* Publication Action Controls */}
            <div className="p-4 rounded-[8px] bg-white border border-[#DCE2E8] flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-[#5D6776]">
                Review all fields before saving or submitting.
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleSave}
                  className="px-4 py-2 rounded-[8px] border border-[#004AAD] text-[#004AAD] text-xs font-semibold hover:bg-[#ECF4FF] transition-colors"
                >
                  {isPending ? 'Saving...' : 'Save Changes'}
                </button>

                {/* Owner: Submit for review if draft */}
                {businessId && currentPublicationStatus === 'draft' && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleTransition('pending')}
                    className="px-4 py-2 rounded-[8px] bg-[#D99B18] text-white text-xs font-semibold hover:bg-[#B37E0F] transition-colors"
                  >
                    Submit for Review
                  </button>
                )}

                {/* Admin: Publish or Suspend */}
                {isAdmin && businessId && (
                  <>
                    {currentPublicationStatus !== 'published' && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleTransition('published')}
                        className="px-4 py-2 rounded-[8px] bg-[#087C3C] text-white text-xs font-semibold hover:bg-[#06612F] transition-colors"
                      >
                        Publish Listing
                      </button>
                    )}

                    {currentPublicationStatus === 'published' && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleTransition('suspended')}
                        className="px-4 py-2 rounded-[8px] bg-[#E36B5D] text-white text-xs font-semibold hover:bg-[#C93B2B] transition-colors"
                      >
                        Suspend Listing
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step Navigation Buttons (Bottom) */}
        <div className="mt-8 pt-4 border-t border-[#DCE2E8] flex items-center justify-between">
          <button
            type="button"
            disabled={activeStep === 1 || isPending}
            onClick={handlePrev}
            className={`px-4 py-2 rounded-[8px] text-xs font-semibold border border-[#DCE2E8] ${
              activeStep === 1
                ? 'opacity-40 cursor-not-allowed text-[#7D8795]'
                : 'text-[#2A3547] hover:bg-[#F2F5FA]'
            }`}
          >
            ← Previous
          </button>

          <div className="flex items-center gap-2">
            {activeStep < 6 ? (
              <button
                type="button"
                disabled={isPending}
                onClick={handleNext}
                className="px-5 py-2 rounded-[8px] bg-[#004AAD] text-white text-xs font-semibold hover:bg-[#003E91] transition-colors"
              >
                Next Step →
              </button>
            ) : (
              <button
                type="button"
                disabled={isPending}
                onClick={handleSave}
                className="px-6 py-2 rounded-[8px] bg-[#004AAD] text-white text-xs font-semibold hover:bg-[#003E91] transition-colors shadow-xs"
              >
                {isPending ? 'Saving...' : businessId ? 'Save Listing' : 'Create Listing'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
