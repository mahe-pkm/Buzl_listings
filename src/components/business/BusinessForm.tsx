'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BusinessFormData,
  Category,
  LocationMode,
  PublicationStatus,
  VerificationStatus,
  BusinessServiceInput,
  BusinessProductInput,
  BusinessMediaInput,
} from '@/types/business';
import BusinessPreviewCard from './BusinessPreviewCard';
import PlacesLocationSearch from './PlacesLocationSearch';
import { NormalizedPlaceDetails } from '@/lib/places/types';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  createBusiness,
  completeBusinessOwnerOnboarding,
  updateBusiness,
  checkDuplicates,
  transitionPublication,
  setVerification,
  markBusinessContactEmailVerified,
} from '@/lib/business-actions';
import { requestBusinessEmailVerification } from '@/lib/business-email-verification-actions';
import {
  uploadBusinessMedia,
  deleteBusinessMedia,
  reorderBusinessGallery,
} from '@/lib/media-actions';
import { getMediaPublicUrl } from '@/lib/media-utils';

interface BusinessFormProps {
  categories: Category[];
  initialData?: BusinessFormData;
  businessId?: string;
  businessSlug?: string;
  listingCode?: string;
  currentPublicationStatus?: PublicationStatus;
  currentVerificationStatus?: VerificationStatus;
  isAdmin?: boolean;
  onboardingMode?: boolean;
  businessContactEmailVerifiedAt?: string | null;
  businessEmailVerificationPending?: boolean;
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
  { id: 1, label: 'Business Details' },
  { id: 2, label: 'Location' },
  { id: 3, label: 'Contact' },
  { id: 4, label: 'Category & Services' },
  { id: 5, label: 'Products' },
  { id: 6, label: 'Media & Gallery' },
  { id: 7, label: 'Hours & Social' },
  { id: 8, label: 'Preview & Submit' },
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function normalizeUrlInput(raw: string | null | undefined): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function BusinessForm({
  categories,
  initialData,
  businessId,
  businessSlug,
  listingCode,
  currentPublicationStatus = 'draft',
  currentVerificationStatus = 'unverified',
  isAdmin = false,
  onboardingMode = false,
  businessContactEmailVerifiedAt = null,
  businessEmailVerificationPending = false,
}: BusinessFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [pubStatus, setPubStatus] = useState<PublicationStatus>(currentPublicationStatus);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPubStatus(currentPublicationStatus);
  }, [currentPublicationStatus]);

  const [activeStep, setActiveStep] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [duplicateNotice, setDuplicateNotice] = useState<string | null>(null);
  const [savedContactEmail, setSavedContactEmail] = useState(initialData?.business_contact_email || '');
  const [emailVerificationState, setEmailVerificationState] = useState<'unverified' | 'sent' | 'verified'>(
    businessContactEmailVerifiedAt ? 'verified' : businessEmailVerificationPending ? 'sent' : 'unverified'
  );

  // New service input scratch states
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');

  // New product input scratch states
  const [newProductName, setNewProductName] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductImagePath, setNewProductImagePath] = useState('');
  const [isUploadingProductImg, setIsUploadingProductImg] = useState(false);

  // Media upload scratch states
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [galleryCaption, setGalleryCaption] = useState('');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const productImgInputRef = useRef<HTMLInputElement>(null);

  // Area input scratch state
  const [newAreaInput, setNewAreaInput] = useState('');

  // Form state
  const [formData, setFormData] = useState<BusinessFormData>(() => {
    if (initialData) {
      return {
        ...initialData,
        google_business_profile_url: initialData.google_business_profile_url || '',
        place_id: initialData.place_id || null,
        products: initialData.products || [],
        media: initialData.media || [],
        services: (initialData.services || []).map((s) =>
          typeof s === 'string'
            ? { service_name: s, service_description: '' }
            : { service_name: s.service_name, service_description: s.service_description || '' }
        ),
      };
    }
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
      google_business_profile_url: '',
      place_id: null,
      primary_category_id: categories[0]?.id || '',
      services: [],
      products: [],
      media: [],
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
    if (key === 'business_contact_email') setEmailVerificationState('unverified');
  };

  const normalizedCurrentContactEmail = formData.business_contact_email.trim().toLowerCase();
  const normalizedSavedContactEmail = savedContactEmail.trim().toLowerCase();
  const contactEmailSaved = normalizedCurrentContactEmail === normalizedSavedContactEmail;
  const isContactEmailVerified = Boolean(
    normalizedCurrentContactEmail && contactEmailSaved && emailVerificationState === 'verified'
  );
  const isContactEmailVerificationSent = Boolean(
    normalizedCurrentContactEmail && contactEmailSaved && emailVerificationState === 'sent'
  );

  const handlePlaceSelect = (details: NormalizedPlaceDetails) => {
    setFormData((prev) => ({
      ...prev,
      // Canonical name safety: Never overwrite canonical_name with Google Places name
      place_id: details.place_id,
      address_line_1: details.address_line_1 || prev.address_line_1,
      address_line_2: details.address_line_2 !== null ? details.address_line_2 : prev.address_line_2,
      locality: details.locality || prev.locality,
      city: details.city || prev.city,
      state: details.state || prev.state,
      country: details.country || prev.country,
      country_code: details.country_code || prev.country_code,
      postal_code: details.postal_code || prev.postal_code,
      latitude: String(details.latitude),
      longitude: String(details.longitude),
    }));
    setErrorMsg(null);
  };

  const handleClearPlace = () => {
    setFormData((prev) => ({
      ...prev,
      place_id: null,
      latitude: '',
      longitude: '',
    }));
  };

  // --- Services Handlers (Max 20) ---
  const handleAddService = () => {
    const trimmedName = newServiceName.trim();
    if (!trimmedName) return;

    const currentServices = formData.services || [];
    if (currentServices.length >= 20) {
      setErrorMsg('Maximum limit of 20 services reached.');
      return;
    }

    const newService: BusinessServiceInput = {
      service_name: trimmedName,
      service_description: newServiceDesc.trim() || undefined,
    };

    updateField('services', [...currentServices, newService]);
    setNewServiceName('');
    setNewServiceDesc('');
    setErrorMsg(null);
  };

  const handleRemoveService = (index: number) => {
    updateField(
      'services',
      (formData.services || []).filter((_, i) => i !== index)
    );
  };

  const handleMoveService = (index: number, direction: 'up' | 'down') => {
    const current = [...(formData.services || [])];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= current.length) return;
    const temp = current[index];
    current[index] = current[target];
    current[target] = temp;
    updateField('services', current);
  };

  // --- Products Handlers (Max 20) ---
  const handleAddProduct = () => {
    const trimmedName = newProductName.trim();
    if (!trimmedName) {
      setErrorMsg('Product name is required.');
      return;
    }

    const currentProducts = formData.products || [];
    if (currentProducts.length >= 20) {
      setErrorMsg('Maximum limit of 20 products reached.');
      return;
    }

    const newProduct: BusinessProductInput = {
      name: trimmedName,
      description: newProductDesc.trim() || undefined,
      image_path: newProductImagePath.trim() || undefined,
      sort_order: currentProducts.length + 1,
    };

    updateField('products', [...currentProducts, newProduct]);
    setNewProductName('');
    setNewProductDesc('');
    setNewProductImagePath('');
    if (productImgInputRef.current) productImgInputRef.current.value = '';
    setErrorMsg(null);
  };

  const handleRemoveProduct = (index: number) => {
    updateField(
      'products',
      (formData.products || []).filter((_, i) => i !== index)
    );
  };

  const handleMoveProduct = (index: number, direction: 'up' | 'down') => {
    const current = [...(formData.products || [])];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= current.length) return;
    const temp = current[index];
    current[index] = current[target];
    current[target] = temp;
    updateField('products', current);
  };

  const handleUploadProductImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !businessId) return;

    setIsUploadingProductImg(true);
    setErrorMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await uploadBusinessMedia(businessId, 'product', fd);
      if (res.success && res.storagePath) {
        setNewProductImagePath(res.storagePath);
      } else {
        setErrorMsg(res.error || 'Failed to upload product image');
      }
    } catch {
      setErrorMsg('Product image upload error');
    } finally {
      setIsUploadingProductImg(false);
    }
  };

  // --- Media & Gallery Handlers ---
  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !businessId) return;

    setIsUploadingLogo(true);
    setErrorMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await uploadBusinessMedia(businessId, 'logo', fd);
      if (res.success && res.storagePath) {
        const remaining = (formData.media || []).filter((m) => m.kind !== 'logo');
        updateField('media', [
          ...remaining,
          {
            id: res.mediaId,
            kind: 'logo',
            storage_path: res.storagePath,
            sort_order: 0,
          },
        ]);
        setSuccessMsg('Logo uploaded successfully!');
      } else {
        setErrorMsg(res.error || 'Failed to upload logo');
      }
    } catch {
      setErrorMsg('Logo upload error');
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    const logoMedia = (formData.media || []).find((m) => m.kind === 'logo');
    if (!logoMedia) return;

    if (businessId && logoMedia.id) {
      setIsUploadingLogo(true);
      await deleteBusinessMedia(businessId, logoMedia.id);
      setIsUploadingLogo(false);
    }
    updateField(
      'media',
      (formData.media || []).filter((m) => m.kind !== 'logo')
    );
  };

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !businessId) return;

    setIsUploadingCover(true);
    setErrorMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await uploadBusinessMedia(businessId, 'cover', fd);
      if (res.success && res.storagePath) {
        const remaining = (formData.media || []).filter((m) => m.kind !== 'cover');
        updateField('media', [
          ...remaining,
          {
            id: res.mediaId,
            kind: 'cover',
            storage_path: res.storagePath,
            sort_order: 0,
          },
        ]);
        setSuccessMsg('Cover photo uploaded successfully!');
      } else {
        setErrorMsg(res.error || 'Failed to upload cover');
      }
    } catch {
      setErrorMsg('Cover photo upload error');
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleRemoveCover = async () => {
    const coverMedia = (formData.media || []).find((m) => m.kind === 'cover');
    if (!coverMedia) return;

    if (businessId && coverMedia.id) {
      setIsUploadingCover(true);
      await deleteBusinessMedia(businessId, coverMedia.id);
      setIsUploadingCover(false);
    }
    updateField(
      'media',
      (formData.media || []).filter((m) => m.kind !== 'cover')
    );
  };

  const handleUploadGalleryItem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !businessId) return;

    setIsUploadingGallery(true);
    setErrorMsg(null);
    try {
      const currentGallery = (formData.media || []).filter((m) => m.kind === 'gallery');
      const fd = new FormData();
      fd.append('file', file);
      if (galleryCaption.trim()) {
        fd.append('caption', galleryCaption.trim().slice(0, 200));
      }
      fd.append('sort_order', String(currentGallery.length + 1));

      const res = await uploadBusinessMedia(businessId, 'gallery', fd);
      if (res.success && res.storagePath) {
        const newItem: BusinessMediaInput = {
          id: res.mediaId,
          kind: 'gallery',
          storage_path: res.storagePath,
          sort_order: currentGallery.length + 1,
          caption: galleryCaption.trim() || undefined,
        };
        updateField('media', [...(formData.media || []), newItem]);
        setGalleryCaption('');
        setSuccessMsg('Photo added to gallery!');
      } else {
        setErrorMsg(res.error || 'Failed to upload gallery image');
      }
    } catch {
      setErrorMsg('Gallery image upload error');
    } finally {
      setIsUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const handleRemoveGalleryItem = async (mediaId?: string, storagePath?: string) => {
    if (businessId && mediaId) {
      await deleteBusinessMedia(businessId, mediaId);
    }
    updateField(
      'media',
      (formData.media || []).filter((m) => m.id !== mediaId && m.storage_path !== storagePath)
    );
  };

  const handleMoveGalleryItem = async (index: number, direction: 'left' | 'right') => {
    const allMedia = [...(formData.media || [])];
    const galleryItems = allMedia.filter((m) => m.kind === 'gallery');
    const target = direction === 'left' ? index - 1 : index + 1;
    if (target < 0 || target >= galleryItems.length) return;

    const temp = galleryItems[index];
    galleryItems[index] = galleryItems[target];
    galleryItems[target] = temp;

    // Re-assign sort orders
    galleryItems.forEach((item, idx) => {
      item.sort_order = idx + 1;
    });

    const nonGallery = allMedia.filter((m) => m.kind !== 'gallery');
    const updatedMedia = [...nonGallery, ...galleryItems];
    updateField('media', updatedMedia);

    if (businessId) {
      const idsInOrder = galleryItems.map((m) => m.id).filter(Boolean) as string[];
      if (idsInOrder.length > 0) {
        await reorderBusinessGallery(businessId, idsInOrder);
      }
    }
  };

  // --- Service Areas Handlers ---
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

  // --- Hours Handlers ---
  const updateHour = (dayIndex: number, updates: Partial<(typeof DEFAULT_HOURS)[0]>) => {
    const updated = formData.hours.map((h) => {
      if (h.day_of_week === dayIndex) {
        return { ...h, ...updates };
      }
      return h;
    });
    updateField('hours', updated);
  };

  // --- Duplicate check trigger ---
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
          setErrorMsg('Location coordinates are required. Please search and select your location using Google Places.');
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

    if (activeStep === 3) {
      const digits = formData.primary_phone.replace(/[^0-9]/g, '');
      if (!digits || digits.length < 7 || digits.length > 20) {
        setErrorMsg('Primary Phone must contain between 7 and 20 digits.');
        return false;
      }
      if (formData.google_business_profile_url?.trim()) {
        const normalized = normalizeUrlInput(formData.google_business_profile_url);
        if (normalized !== formData.google_business_profile_url) {
          updateField('google_business_profile_url', normalized);
        }
      }
      if (formData.website_url?.trim()) {
        const normalized = normalizeUrlInput(formData.website_url);
        if (normalized !== formData.website_url) {
          updateField('website_url', normalized);
        }
      }
    }

    if (activeStep === 4) {
      if (!formData.primary_category_id) {
        setErrorMsg('Please select a Primary Category.');
        return false;
      }
      if ((formData.services || []).length > 20) {
        setErrorMsg('A business cannot have more than 20 services.');
        return false;
      }
    }

    if (activeStep === 5) {
      if ((formData.products || []).length > 20) {
        setErrorMsg('A business cannot have more than 20 products.');
        return false;
      }
    }

    if (activeStep === 7) {
      if (formData.facebook_url?.trim()) {
        const norm = normalizeUrlInput(formData.facebook_url);
        if (norm !== formData.facebook_url) updateField('facebook_url', norm);
      }
      if (formData.instagram_url?.trim()) {
        const norm = normalizeUrlInput(formData.instagram_url);
        if (norm !== formData.instagram_url) updateField('instagram_url', norm);
      }
      if (formData.linkedin_url?.trim()) {
        const norm = normalizeUrlInput(formData.linkedin_url);
        if (norm !== formData.linkedin_url) updateField('linkedin_url', norm);
      }
      if (formData.youtube_url?.trim()) {
        const norm = normalizeUrlInput(formData.youtube_url);
        if (norm !== formData.youtube_url) updateField('youtube_url', norm);
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (activeStep === 7) {
        runDuplicateCheck();
      }
      setActiveStep((prev) => Math.min(prev + 1, 8));
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
      const cleanFormData: BusinessFormData = {
        ...formData,
        website_url: normalizeUrlInput(formData.website_url),
        google_business_profile_url: normalizeUrlInput(formData.google_business_profile_url),
        facebook_url: normalizeUrlInput(formData.facebook_url),
        instagram_url: normalizeUrlInput(formData.instagram_url),
        linkedin_url: normalizeUrlInput(formData.linkedin_url),
        youtube_url: normalizeUrlInput(formData.youtube_url),
      };

      if (businessId) {
        const emailChanged = normalizedCurrentContactEmail !== normalizedSavedContactEmail;
        const result = await updateBusiness(businessId, cleanFormData);
        if (result.success) {
          setSavedContactEmail(cleanFormData.business_contact_email);
          if (emailChanged) setEmailVerificationState('unverified');
          setSuccessMsg('Business listing updated successfully!');
          router.refresh();
        } else {
          setErrorMsg(result.error || 'Failed to update business');
        }
      } else {
        const result = await createBusiness(cleanFormData);
        if (result.success && result.businessId) {
          if (onboardingMode) {
            const onboardingResult = await completeBusinessOwnerOnboarding();
            if (!onboardingResult.success) {
              setErrorMsg('Your draft was saved, but onboarding could not be completed. Please try again.');
              return;
            }
          }
          setSuccessMsg(onboardingMode ? 'Business profile created. Welcome to Buzl!' : 'Business listing created successfully!');
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
    if (nextStatus === 'pending' && !isContactEmailVerified) {
      setErrorMsg('Verify the Business Contact Email before submitting for review.');
      setActiveStep(3);
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const saveRes = await updateBusiness(businessId, formData);
      if (!saveRes.success) {
        setErrorMsg(saveRes.error || 'Failed to save changes before status change.');
        return;
      }

      const transRes = await transitionPublication(businessId, nextStatus);
      if (transRes.success) {
        setPubStatus(nextStatus);
        setSuccessMsg(
          nextStatus === 'pending'
            ? 'Your listing has been submitted for review.'
            : `Listing status successfully updated to ${nextStatus}.`
        );
        router.refresh();
      } else {
        setErrorMsg(transRes.error || `Failed to transition status to ${nextStatus}.`);
      }
    });
  };

  const handleRequestEmailVerification = () => {
    if (!businessId || !normalizedCurrentContactEmail) return;
    if (!contactEmailSaved) {
      setErrorMsg('Save the changed Business Contact Email before requesting verification.');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    startTransition(async () => {
      const result = await requestBusinessEmailVerification(businessId);
      if (result.success) {
        setEmailVerificationState('sent');
        setSuccessMsg('Verification email sent. Check the Business Contact Email inbox.');
      } else {
        setErrorMsg(result.error || 'Unable to send a verification email.');
      }
    });
  };

  const handleAdminContactEmailVerification = () => {
    if (!businessId || !window.confirm('Mark this Business Contact Email as verified?')) return;
    setErrorMsg(null);
    startTransition(async () => {
      const result = await markBusinessContactEmailVerified(businessId);
      if (result.success) {
        setEmailVerificationState('verified');
        setSuccessMsg('Business Contact Email marked verified by administrator.');
        router.refresh();
      } else {
        setErrorMsg(result.error || 'Unable to verify the Business Contact Email.');
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

  const logoMedia = (formData.media || []).find((m) => m.kind === 'logo');
  const coverMedia = (formData.media || []).find((m) => m.kind === 'cover');
  const galleryItems = (formData.media || []).filter((m) => m.kind === 'gallery');

  const logoUrl = getMediaPublicUrl(logoMedia?.storage_path);
  const coverUrl = getMediaPublicUrl(coverMedia?.storage_path);

  return (
    <div className="space-y-6">
      {/* Pending Review Banner */}
      {pubStatus === 'pending' && (
        <div className="p-4 rounded-[8px] bg-[#FFF8E6] border border-[#FEE5A5] text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-[#9A6700] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#D99B18]" />
            <span>Pending Review</span>
          </div>
          <p className="text-[#7A5200] leading-relaxed">
            Your listing has been submitted and is currently under review by our moderation team. Our team verifies your business details and category citations before activating the public listing.
          </p>
          <p className="text-[11px] text-[#9A6700]">
            You can continue updating your business details below; any saved edits will be included in the review.
          </p>
        </div>
      )}

      {/* Published Listing Banner */}
      {pubStatus === 'published' && (
        <div className="p-4 rounded-[8px] bg-[#F0FDF4] border border-[#BBF7D0] text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-[#166534] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              <span>Published Listing</span>
            </div>
            <p className="text-[#15803D]">
              Your business listing is live on the Buzl public directory.
            </p>
          </div>
          {businessSlug && (
            <a
              href={`/business/${businessSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <span>View Public Listing</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      )}

      {/* Step Navigation Bar */}
      <div className="bg-white rounded-[8px] border border-[#DCE2E8] p-3 shadow-xs">
        {/* Desktop Step Navigation */}
        <div className="hidden lg:flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
          {STEPS.map((step) => {
            const isCurrent = activeStep === step.id;
            const isDone = activeStep > step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (step.id < activeStep || validateCurrentStep()) {
                    if (step.id === 8) runDuplicateCheck();
                    setActiveStep(step.id);
                  }
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-[6px] text-xs font-semibold transition-all ${
                  isCurrent
                    ? 'bg-[#004AAD] text-white'
                    : isDone
                    ? 'bg-[#ECF4FF] text-[#004AAD] hover:bg-[#EAEFF4]'
                    : 'text-[#5D6776] hover:bg-[#F2F5FA]'
                }`}
              >
                <span
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
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

        {/* Mobile & Tablet Compact Step Header */}
        <div className="lg:hidden space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#004AAD]">Step {activeStep} of 8</span>
            <span className="font-semibold text-[#2A3547]">
              {STEPS.find((s) => s.id === activeStep)?.label}
            </span>
          </div>
          <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#004AAD] h-full transition-all duration-300 rounded-full"
              style={{ width: `${(activeStep / 8) * 100}%` }}
            />
          </div>
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

      {/* Listing ID Badge (read-only, editing existing businesses only) */}
      {listingCode && (
        <div className="bg-white rounded-[8px] border border-[#DCE2E8] p-4 shadow-xs flex items-center justify-between" data-testid="listing-code-badge">
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 text-[#7D8795]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
            <div>
              <span className="text-[11px] font-semibold text-[#7D8795] uppercase tracking-wider block">Listing ID</span>
              <span className="font-mono text-sm font-bold text-[#2A3547]">{listingCode}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#7D8795]">Permanent system identifier</span>
            <button
              type="button"
              data-testid="listing-code-copy"
              onClick={() => {
                navigator.clipboard.writeText(listingCode);
              }}
              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-[#004AAD] border border-[#DCE2E8] rounded hover:bg-[#F2F5FA] transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Form Content Steps */}
      <div className="bg-white rounded-[8px] border border-[#DCE2E8] p-6 shadow-xs">
        {/* Step 1: Business Details */}
        {activeStep === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-[#2A3547]">Step 1: Business Details</h2>
              <p className="text-xs text-[#5D6776] mt-1">
                Enter your registered business name and basic details.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="canonical_name" className="block text-xs font-semibold text-[#2A3547] mb-1">
                  Business Name <span className="text-[#E36B5D]">*</span>
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
                  The registered name of your business as known to customers.
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

        {/* Step 2: Location */}
        {activeStep === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-[#2A3547]">Step 2: Location & Coverage Mode</h2>
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
                <div>
                  <h3 className="text-xs font-bold text-[#2A3547] uppercase tracking-wider">
                    Google Places Search & Verification
                  </h3>
                  <p className="text-[11px] text-[#7D8795] mt-0.5">
                    Search your business on Google Places to verify location and automatically attach coordinates.
                  </p>
                </div>

                <PlacesLocationSearch
                  selectedPlaceId={formData.place_id}
                  currentAddressSummary={
                    formData.address_line_1
                      ? [formData.address_line_1, formData.locality, formData.city, formData.state, formData.postal_code]
                          .filter(Boolean)
                          .join(', ')
                      : undefined
                  }
                  hasCoordinates={Boolean(formData.latitude && formData.longitude)}
                  onSelect={handlePlaceSelect}
                  onClear={handleClearPlace}
                />

                <div className="pt-2 border-t border-[#DCE2E8]/70">
                  <h3 className="text-xs font-bold text-[#2A3547] uppercase tracking-wider mb-1">
                    Storefront Physical Address
                  </h3>
                  <p className="text-[11px] text-[#7D8795] mb-3">
                    Auto-filled from Google Places. You can refine unit, suite, or floor details below.
                  </p>

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
                        Address Line 2 (Unit / Suite / Floor)
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
                  </div>

                  {/* Location Verified Display */}
                  {formData.latitude && formData.longitude && (
                    <div className="mt-3 p-3 rounded-[6px] bg-[#F0FDF4] border border-[#BBF7D0] flex items-center gap-2 text-xs text-[#166534] font-medium">
                      <span className="text-[#16A34A] font-bold">✓</span>
                      <span>Location verified — Map location saved</span>
                    </div>
                  )}
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

        {/* Step 3: Contact / NAP */}
        {activeStep === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-[#2A3547]">Step 3: Contact Information</h2>
              <p className="text-xs text-[#5D6776] mt-1">
                Official business contact details. Note: Business contact email is private by default and strictly independent of your login account.
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
                  type="text"
                  value={formData.website_url}
                  onChange={(e) => updateField('website_url', e.target.value)}
                  onBlur={(e) => {
                    const norm = normalizeUrlInput(e.target.value);
                    if (norm !== formData.website_url) {
                      updateField('website_url', norm);
                    }
                  }}
                  placeholder="https://example.com or example.com"
                  className="w-full px-3.5 py-2 rounded-[8px] border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD]"
                />
              </div>

              {/* Google Business Profile Link */}
              <div className="md:col-span-2">
                <label htmlFor="google_business_profile_url" className="block text-xs font-semibold text-[#2A3547] mb-1">
                  Google Business Profile Link <span className="text-[11px] font-normal text-[#7D8795]">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    id="google_business_profile_url"
                    name="google_business_profile_url"
                    type="text"
                    value={formData.google_business_profile_url}
                    onChange={(e) => updateField('google_business_profile_url', e.target.value)}
                    onBlur={(e) => {
                      const norm = normalizeUrlInput(e.target.value);
                      if (norm !== formData.google_business_profile_url) {
                        updateField('google_business_profile_url', norm);
                      }
                    }}
                    placeholder="https://maps.app.goo.gl/... or https://google.com/maps/place/..."
                    className="w-full pl-9 pr-3.5 py-2 rounded-[8px] border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD]"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-[#EA4335]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </div>
                </div>
                <p className="text-[11px] text-[#7D8795] mt-1">
                  Paste the link to your business on Google. This will appear as &quot;View on Google&quot; on your public listing.
                </p>
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
                  {normalizedCurrentContactEmail && (
                    <div className="mt-3 rounded-[8px] border border-[#DCE2E8] bg-white p-3" data-testid="business-email-verification-status">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            isContactEmailVerified
                              ? 'bg-[#DCFCE7] text-[#166534]'
                              : isContactEmailVerificationSent
                                ? 'bg-[#DBEAFE] text-[#1D4ED8]'
                                : 'bg-[#FEF3C7] text-[#92400E]'
                          }`}>
                            {isContactEmailVerified ? 'Email verified' : isContactEmailVerificationSent ? 'Verification sent' : 'Not verified'}
                          </span>
                          <p className="mt-1 text-[11px] text-[#5D6776]">
                            {isContactEmailVerified
                              ? 'This Business Contact Email is verified.'
                              : isContactEmailVerificationSent
                                ? 'Use the secure link sent to this address. The link expires after 30 minutes.'
                                : contactEmailSaved
                                  ? 'Verification is required before submitting this listing for review.'
                                  : 'Save this changed email before requesting verification.'}
                          </p>
                        </div>
                        {!isContactEmailVerified && businessId && (
                          <button
                            type="button"
                            disabled={isPending || !contactEmailSaved}
                            onClick={handleRequestEmailVerification}
                            className="rounded-[6px] border border-[#004AAD] px-3 py-1.5 text-xs font-semibold text-[#004AAD] hover:bg-[#ECF4FF] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isContactEmailVerificationSent ? 'Resend' : 'Verify Email'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
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

        {/* Step 4: Category & Services */}
        {activeStep === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-[#2A3547]">Step 4: Primary Category & Services</h2>
              <p className="text-xs text-[#5D6776] mt-1">
                Select your single primary curated category and define services offered (up to 20).
              </p>
            </div>

            <div className="space-y-5">
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

              {/* Services Section with Name + Description and Max 20 */}
              <div className="pt-2 border-t border-[#DCE2E8]">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#2A3547]">
                    What services does your business offer?
                  </label>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    (formData.services || []).length >= 20 ? 'bg-[#FDECEE] text-[#C93B2B]' : 'bg-[#F2F5FA] text-[#004AAD]'
                  }`}>
                    {(formData.services || []).length} / 20 Services
                  </span>
                </div>
                <p className="text-[11px] text-[#7D8795] mb-3">
                  Add up to 20 services with optional descriptions to showcase what you offer.
                </p>

                {(formData.services || []).length < 20 ? (
                  <div className="p-4 rounded-[8px] bg-[#F8FAFC] border border-[#DCE2E8] space-y-3 mb-4">
                    <div>
                      <input
                        type="text"
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        placeholder="Service Name (e.g. Laptop Screen Replacement, SEO Audit)..."
                        maxLength={120}
                        className="w-full px-3.5 py-2 rounded-[8px] bg-white border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD]"
                      />
                    </div>
                    <div>
                      <textarea
                        value={newServiceDesc}
                        onChange={(e) => setNewServiceDesc(e.target.value)}
                        placeholder="Service Description (optional, max 1000 characters)..."
                        rows={2}
                        maxLength={1000}
                        className="w-full px-3.5 py-2 rounded-[8px] bg-white border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddService}
                      disabled={!newServiceName.trim()}
                      className="px-4 py-2 rounded-[8px] bg-[#004AAD] text-white text-xs font-semibold hover:bg-[#003E91] disabled:opacity-50 transition-colors"
                    >
                      + Add Service
                    </button>
                  </div>
                ) : (
                  <div className="p-3 mb-4 rounded-[8px] bg-[#FFF6DF] border border-[#FFE7A8] text-xs text-[#9A6700] font-medium">
                    Maximum limit of 20 services reached.
                  </div>
                )}

                {/* Empty State when 0 services */}
                {(formData.services || []).length === 0 && (
                  <div className="p-4 rounded-[8px] bg-[#F8FAFC] border border-dashed border-[#DCE2E8] text-center text-xs text-[#7D8795]">
                    No services added yet. Add key services above to highlight your offerings for customers.
                  </div>
                )}

                {/* List of Added Services */}
                {(formData.services || []).length > 0 && (
                  <div className="space-y-2">
                    {(formData.services || []).map((service, index) => {
                      const name = typeof service === 'string' ? service : service.service_name;
                      const desc = typeof service === 'string' ? '' : service.service_description;

                      return (
                        <div
                          key={index}
                          className="p-3 bg-[#F2F5FA] rounded-[8px] border border-[#DCE2E8] flex items-start justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-[#2A3547] block truncate">{name}</span>
                            {desc && (
                              <p className="text-[11px] text-[#5D6776] mt-1 leading-relaxed line-clamp-2">
                                {desc}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveService(index, 'up')}
                              disabled={index === 0}
                              title="Move Up"
                              className="p-1 text-xs text-[#7D8795] hover:text-[#004AAD] disabled:opacity-30"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveService(index, 'down')}
                              disabled={index === (formData.services || []).length - 1}
                              title="Move Down"
                              className="p-1 text-xs text-[#7D8795] hover:text-[#004AAD] disabled:opacity-30"
                            >
                              ▼
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveService(index)}
                              title="Delete"
                              className="p-1 text-xs text-[#7D8795] hover:text-[#E36B5D] font-bold ml-1"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Products */}
        {activeStep === 5 && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#2A3547]">Step 5: Products & Offerings (Optional)</h2>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  (formData.products || []).length >= 20 ? 'bg-[#FDECEE] text-[#C93B2B]' : 'bg-[#F2F5FA] text-[#004AAD]'
                }`}>
                  {(formData.products || []).length} / 20 Products
                </span>
              </div>
              <p className="text-xs text-[#5D6776] mt-1">
                Products are optional showcase items. Highlight key products, physical goods, or featured inventory on your public listing.
              </p>
            </div>

            {/* Product Add Box */}
            {(formData.products || []).length < 20 ? (
              <div className="p-4 rounded-[8px] bg-[#F8FAFC] border border-[#DCE2E8] space-y-3">
                <h3 className="text-xs font-bold text-[#2A3547] uppercase tracking-wider">
                  Add New Product
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#2A3547] mb-1">
                      Product Name <span className="text-[#E36B5D]">*</span>
                    </label>
                    <input
                      type="text"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      placeholder="e.g. Ergonomic Office Chair"
                      maxLength={160}
                      className="w-full px-3.5 py-2 rounded-[8px] bg-white border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2A3547] mb-1">
                      Product Image
                    </label>
                    {businessId ? (
                      <div className="flex items-center gap-2">
                        <input
                          ref={productImgInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          onChange={handleUploadProductImage}
                          className="text-xs text-[#5D6776] file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#ECF4FF] file:text-[#004AAD] hover:file:bg-[#BEDBFE]"
                        />
                        {isUploadingProductImg && <span className="text-xs text-[#004AAD] animate-pulse">Uploading...</span>}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={newProductImagePath}
                        onChange={(e) => setNewProductImagePath(e.target.value)}
                        placeholder="Image URL or save draft to upload files"
                        className="w-full px-3.5 py-2 rounded-[8px] bg-white border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD]"
                      />
                    )}
                    {newProductImagePath && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700">
                        <span>✓ Image attached</span>
                        <button
                          type="button"
                          onClick={() => setNewProductImagePath('')}
                          className="text-[#E36B5D] hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-[#2A3547] mb-1">
                      Product Description (Optional)
                    </label>
                    <textarea
                      value={newProductDesc}
                      onChange={(e) => setNewProductDesc(e.target.value)}
                      placeholder="Key specifications, features, or product details..."
                      rows={2}
                      maxLength={1000}
                      className="w-full px-3.5 py-2 rounded-[8px] bg-white border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddProduct}
                  disabled={!newProductName.trim()}
                  className="px-4 py-2 rounded-[8px] bg-[#004AAD] text-white text-xs font-semibold hover:bg-[#003E91] disabled:opacity-50 transition-colors"
                >
                  + Add Product
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-[8px] bg-[#FFF6DF] border border-[#FFE7A8] text-xs text-[#9A6700] font-medium">
                Maximum limit of 20 products reached.
              </div>
            )}

            {/* Empty State when 0 products */}
            {(formData.products || []).length === 0 && (
              <div className="p-5 rounded-[8px] bg-[#F8FAFC] border border-dashed border-[#DCE2E8] text-center space-y-1.5">
                <p className="text-xs font-semibold text-[#2A3547]">No products added yet</p>
                <p className="text-[11px] text-[#7D8795]">
                  Products are completely optional. If your business sells physical goods or featured items, you can add them above.
                </p>
              </div>
            )}

            {/* List of Current Products */}
            {(formData.products || []).length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {(formData.products || []).map((product, idx) => {
                  const imgUrl = getMediaPublicUrl(product.image_path);
                  return (
                    <div
                      key={product.id || idx}
                      className="p-3.5 rounded-[8px] bg-[#F2F5FA] border border-[#DCE2E8] flex gap-3 items-start justify-between"
                    >
                      <div className="flex gap-3 min-w-0">
                        {imgUrl && (
                          <div className="w-14 h-14 rounded overflow-hidden bg-[#E2E8F0] shrink-0 border border-[#DCE2E8]">
                            <img src={imgUrl} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-[#2A3547] block truncate">{product.name}</span>
                          {product.description && (
                            <p className="text-[11px] text-[#5D6776] mt-1 line-clamp-2 leading-relaxed">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveProduct(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-xs text-[#7D8795] hover:text-[#004AAD] disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveProduct(idx, 'down')}
                          disabled={idx === (formData.products || []).length - 1}
                          className="p-1 text-xs text-[#7D8795] hover:text-[#004AAD] disabled:opacity-30"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(idx)}
                          className="p-1 text-xs text-[#7D8795] hover:text-[#E36B5D] font-bold ml-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 6: Media & Gallery */}
        {activeStep === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-[#2A3547]">Step 6: Media & Photo Gallery</h2>
              <p className="text-xs text-[#5D6776] mt-1">
                Upload your official business logo, banner cover photo, and photo gallery.
              </p>
            </div>

            {!businessId && (
              <div className="p-4 rounded-[8px] bg-[#ECF4FF] border border-[#BEDBFE] text-xs text-[#004AAD] flex items-center justify-between">
                <span>Please save your business draft first to enable direct file uploads to storage.</span>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending}
                  className="px-3 py-1.5 rounded-[6px] bg-[#004AAD] text-white font-semibold text-xs hover:bg-[#003E91]"
                >
                  {isPending ? 'Saving...' : 'Save Draft to Enable Uploads'}
                </button>
              </div>
            )}

            {/* Logo & Cover Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Logo Card */}
              <div className="p-4 rounded-[8px] bg-[#F8FAFC] border border-[#DCE2E8] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#2A3547] uppercase tracking-wider">
                    Business Logo
                  </h3>
                  {logoMedia && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#7D8795]">
                  Square or circle emblem displayed next to your business name (max 5 MB).
                </p>

                {logoUrl ? (
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#DCE2E8] bg-white p-1 shrink-0">
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="text-xs font-semibold text-[#E36B5D] hover:underline"
                    >
                      Remove Logo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      ref={logoInputRef}
                      type="file"
                      disabled={!businessId || isUploadingLogo}
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={handleUploadLogo}
                      className="text-xs text-[#5D6776] file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#004AAD] file:text-white hover:file:bg-[#003E91] disabled:opacity-50"
                    />
                    {isUploadingLogo && <p className="text-xs text-[#004AAD]">Uploading logo...</p>}
                  </div>
                )}
              </div>

              {/* Cover Banner Card */}
              <div className="p-4 rounded-[8px] bg-[#F8FAFC] border border-[#DCE2E8] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#2A3547] uppercase tracking-wider">
                    Cover Banner Photo
                  </h3>
                  {coverMedia && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#7D8795]">
                  Wide landscape photo featured prominently at the top of your public page (max 5 MB).
                </p>

                {coverUrl ? (
                  <div className="space-y-2">
                    <div className="w-full h-24 rounded-lg overflow-hidden bg-[#E2E8F0] border border-[#DCE2E8]">
                      <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCover}
                      className="text-xs font-semibold text-[#E36B5D] hover:underline"
                    >
                      Remove Cover Photo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      ref={coverInputRef}
                      type="file"
                      disabled={!businessId || isUploadingCover}
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={handleUploadCover}
                      className="text-xs text-[#5D6776] file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#004AAD] file:text-white hover:file:bg-[#003E91] disabled:opacity-50"
                    />
                    {isUploadingCover && <p className="text-xs text-[#004AAD]">Uploading cover photo...</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Photo Gallery Section */}
            <div className="pt-4 border-t border-[#DCE2E8] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#2A3547] uppercase tracking-wider">
                    Photo Gallery ({galleryItems.length} Photos)
                  </h3>
                  <p className="text-[11px] text-[#7D8795] mt-0.5">
                    Upload photos of your location, work, team, or projects.
                  </p>
                </div>
              </div>

              {/* Upload to Gallery Input */}
              <div className="p-4 rounded-[8px] bg-[#F8FAFC] border border-[#DCE2E8] space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-[#2A3547] mb-1">
                      Optional Caption
                    </label>
                    <input
                      type="text"
                      value={galleryCaption}
                      onChange={(e) => setGalleryCaption(e.target.value)}
                      placeholder="e.g. Main showroom interior..."
                      maxLength={200}
                      className="w-full px-3.5 py-1.5 rounded-[6px] bg-white border border-[#DCE2E8] text-xs text-[#2A3547] focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#2A3547] mb-1">
                      Select Photo
                    </label>
                    <input
                      ref={galleryInputRef}
                      type="file"
                      disabled={!businessId || isUploadingGallery}
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={handleUploadGalleryItem}
                      className="text-xs text-[#5D6776] file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#004AAD] file:text-white hover:file:bg-[#003E91] disabled:opacity-50"
                    />
                  </div>
                </div>
                {isUploadingGallery && <p className="text-xs text-[#004AAD]">Uploading photo to gallery...</p>}
              </div>

              {/* Gallery Grid */}
              {galleryItems.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {galleryItems.map((item, idx) => {
                    const imgUrl = getMediaPublicUrl(item.storage_path);
                    return (
                      <div
                        key={item.id || idx}
                        className="rounded-[8px] overflow-hidden bg-[#F2F5FA] border border-[#DCE2E8] group flex flex-col"
                      >
                        <div className="aspect-square bg-[#E2E8F0] relative overflow-hidden">
                          {imgUrl && (
                            <img src={imgUrl} alt={item.caption || `Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="p-2 flex-1 flex flex-col justify-between gap-1.5">
                          {item.caption ? (
                            <p className="text-[11px] text-[#2A3547] font-medium truncate">{item.caption}</p>
                          ) : (
                            <span className="text-[10px] text-[#7D8795] italic">No caption</span>
                          )}
                          <div className="flex items-center justify-between pt-1 border-t border-[#DCE2E8]/60 text-xs">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleMoveGalleryItem(idx, 'left')}
                                disabled={idx === 0}
                                title="Move Left"
                                className="p-1 text-[#7D8795] hover:text-[#004AAD] disabled:opacity-30"
                              >
                                ◀
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveGalleryItem(idx, 'right')}
                                disabled={idx === galleryItems.length - 1}
                                title="Move Right"
                                className="p-1 text-[#7D8795] hover:text-[#004AAD] disabled:opacity-30"
                              >
                                ▶
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryItem(item.id, item.storage_path)}
                              className="text-[#E36B5D] hover:underline text-[11px]"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 7: Hours & Social */}
        {activeStep === 7 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-[#2A3547]">Step 7: Business Hours & Social Links</h2>
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
                    type="text"
                    value={formData.facebook_url}
                    onChange={(e) => updateField('facebook_url', e.target.value)}
                    onBlur={(e) => {
                      const norm = normalizeUrlInput(e.target.value);
                      if (norm !== formData.facebook_url) updateField('facebook_url', norm);
                    }}
                    placeholder="https://facebook.com/yourbusiness or facebook.com/yourbusiness"
                    className="w-full px-3.5 py-2 rounded-[8px] border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2A3547] mb-1">
                    Instagram URL
                  </label>
                  <input
                    type="text"
                    value={formData.instagram_url}
                    onChange={(e) => updateField('instagram_url', e.target.value)}
                    onBlur={(e) => {
                      const norm = normalizeUrlInput(e.target.value);
                      if (norm !== formData.instagram_url) updateField('instagram_url', norm);
                    }}
                    placeholder="https://instagram.com/yourbusiness or instagram.com/yourbusiness"
                    className="w-full px-3.5 py-2 rounded-[8px] border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2A3547] mb-1">
                    LinkedIn URL
                  </label>
                  <input
                    type="text"
                    value={formData.linkedin_url}
                    onChange={(e) => updateField('linkedin_url', e.target.value)}
                    onBlur={(e) => {
                      const norm = normalizeUrlInput(e.target.value);
                      if (norm !== formData.linkedin_url) updateField('linkedin_url', norm);
                    }}
                    placeholder="https://linkedin.com/company/yourbusiness or linkedin.com/company/yourbusiness"
                    className="w-full px-3.5 py-2 rounded-[8px] border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2A3547] mb-1">
                    YouTube URL
                  </label>
                  <input
                    type="text"
                    value={formData.youtube_url}
                    onChange={(e) => updateField('youtube_url', e.target.value)}
                    onBlur={(e) => {
                      const norm = normalizeUrlInput(e.target.value);
                      if (norm !== formData.youtube_url) updateField('youtube_url', norm);
                    }}
                    placeholder="https://youtube.com/@yourbusiness or youtube.com/@yourbusiness"
                    className="w-full px-3.5 py-2 rounded-[8px] border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:border-[#004AAD]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 8: Preview & Submit */}
        {activeStep === 8 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-[#2A3547]">Step 8: Preview & Submit</h2>
              <p className="text-xs text-[#5D6776] mt-1">
                Review your listing details, verify readiness, and submit your listing for moderation.
              </p>
            </div>

            {/* Listing Readiness Summary Card */}
            {(() => {
              const hasName = Boolean(formData.canonical_name.trim());
              const hasPhone = Boolean(formData.primary_phone.replace(/[^0-9]/g, '').length >= 7);
              const hasCategory = Boolean(formData.primary_category_id);
              const hasCommonLocation = Boolean(formData.city.trim() && formData.state.trim() && formData.country.trim());
              const hasLocationSpecifics =
                formData.location_mode === 'service_area'
                  ? formData.service_areas.length > 0
                  : Boolean(
                      formData.address_line_1.trim() &&
                      formData.locality.trim() &&
                      formData.postal_code.trim() &&
                      formData.latitude &&
                      formData.longitude
                    );
              const hasLocation = hasCommonLocation && hasLocationSpecifics;
              const hasServices = (formData.services || []).length > 0;
              const hasLogo = (formData.media || []).some((m) => m.kind === 'logo');
              const hasGbp = Boolean(formData.google_business_profile_url?.trim());

              const isReadyToSubmit = hasName && hasPhone && hasCategory && hasLocation && isContactEmailVerified;

              return (
                <div className="p-4 rounded-[8px] bg-[#F8FAFC] border border-[#DCE2E8] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#2A3547] uppercase tracking-wider">
                      Listing Readiness Summary
                    </h3>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        isReadyToSubmit
                          ? 'bg-[#DCFCE7] text-[#166534]'
                          : 'bg-[#FEF3C7] text-[#92400E]'
                      }`}
                    >
                      {isReadyToSubmit ? 'Ready for Review' : 'Incomplete Requirements'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1 text-xs">
                    <div className="flex items-center gap-2 p-2 rounded bg-white border border-[#E2E8F0]">
                      <span className={hasName ? 'text-[#16A34A] font-bold' : 'text-[#DC2626] font-bold'}>
                        {hasName ? '✓' : '✗'}
                      </span>
                      <span className="text-[#2A3547]">Business Name</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-white border border-[#E2E8F0]">
                      <span className={hasPhone ? 'text-[#16A34A] font-bold' : 'text-[#DC2626] font-bold'}>
                        {hasPhone ? '✓' : '✗'}
                      </span>
                      <span className="text-[#2A3547]">Contact Phone</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-white border border-[#E2E8F0]">
                      <span className={hasCategory ? 'text-[#16A34A] font-bold' : 'text-[#DC2626] font-bold'}>
                        {hasCategory ? '✓' : '✗'}
                      </span>
                      <span className="text-[#2A3547]">Category</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-white border border-[#E2E8F0]">
                      <span className={hasLocation ? 'text-[#16A34A] font-bold' : 'text-[#DC2626] font-bold'}>
                        {hasLocation ? '✓' : '✗'}
                      </span>
                      <span className="text-[#2A3547]">Location Details</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-white border border-[#E2E8F0]">
                      <span className={isContactEmailVerified ? 'text-[#16A34A] font-bold' : 'text-[#D99B18] font-bold'}>
                        {isContactEmailVerified ? '✓' : '⚠'}
                      </span>
                      <span className="text-[#2A3547]">Business email {isContactEmailVerified ? 'Verified' : 'Verification required'}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-white border border-[#E2E8F0]">
                      <span className={hasServices ? 'text-[#16A34A] font-bold' : 'text-[#94A3B8] font-bold'}>
                        {hasServices ? '✓' : '○'}
                      </span>
                      <span className="text-[#2A3547]">Services ({ (formData.services || []).length })</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-white border border-[#E2E8F0]">
                      <span className={hasLogo ? 'text-[#16A34A] font-bold' : 'text-[#94A3B8] font-bold'}>
                        {hasLogo ? '✓' : '○'}
                      </span>
                      <span className="text-[#2A3547]">Business Logo</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-white border border-[#E2E8F0]">
                      <span className={hasGbp ? 'text-[#16A34A] font-bold' : 'text-[#94A3B8] font-bold'}>
                        {hasGbp ? '✓' : '○'}
                      </span>
                      <span className="text-[#2A3547]">Google Business Profile</span>
                    </div>
                  </div>

                  {!isReadyToSubmit && (
                    <p className="text-[11px] text-[#B45309] font-medium pt-1">
                      Please complete all required sections (marked with ✗) before submitting for review.
                    </p>
                  )}
                </div>
              );
            })()}

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
                    {!isContactEmailVerified && normalizedCurrentContactEmail && contactEmailSaved && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={handleAdminContactEmailVerification}
                        className="px-3 py-1.5 rounded-[6px] text-xs font-semibold bg-white border border-[#16A34A] text-[#166534] hover:bg-[#F0FDF4]"
                      >
                        Mark Contact Email Verified
                      </button>
                    )}
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
                {businessId && pubStatus === 'draft' && (
                  <button
                    type="button"
                    disabled={isPending || !isContactEmailVerified}
                    onClick={() => handleTransition('pending')}
                    className="px-4 py-2 rounded-[8px] bg-[#D99B18] text-white text-xs font-semibold hover:bg-[#B37E0F] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Submit for Review
                  </button>
                )}

                {/* Admin: Publish or Suspend */}
                {isAdmin && businessId && (
                  <>
                    {pubStatus !== 'published' && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleTransition('published')}
                        className="px-4 py-2 rounded-[8px] bg-[#087C3C] text-white text-xs font-semibold hover:bg-[#06612F] transition-colors"
                      >
                        Publish Listing
                      </button>
                    )}

                    {pubStatus === 'published' && (
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
            {activeStep < 8 ? (
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
