import { createClient, getSessionUser } from '@/lib/supabase/server';
import Topbar from '@/components/dashboard/Topbar';
import BusinessForm from '@/components/business/BusinessForm';
import { notFound, redirect } from 'next/navigation';
import { parseEwkbPoint } from '@/lib/geo';
import { BusinessFormData, Category, LocationMode } from '@/types/business';

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBusinessPage({ params }: EditPageProps) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  const supabase = await createClient();

  // Fetch business record
  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', id)
    .single();

  if (bizError || !business) {
    notFound();
  }

  // Fetch categories
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('id, name, slug, active, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  const categories: Category[] = (categoriesData || []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    active: c.active,
    sort_order: c.sort_order,
  }));

  // Fetch services
  const { data: servicesData } = await supabase
    .from('business_services')
    .select('service_name, sort_order')
    .eq('business_id', id)
    .order('sort_order', { ascending: true });

  const services = (servicesData || []).map((s) => s.service_name);

  // Fetch service areas
  const { data: areasData } = await supabase
    .from('business_service_areas')
    .select('name')
    .eq('business_id', id);

  const serviceAreas = (areasData || []).map((a) => a.name);

  // Fetch hours
  const { data: hoursData } = await supabase
    .from('business_hours')
    .select('day_of_week, opens_at, closes_at, is_closed, is_24_hours')
    .eq('business_id', id)
    .order('day_of_week', { ascending: true });

  const hours =
    hoursData && hoursData.length > 0
      ? hoursData.map((h) => ({
          day_of_week: h.day_of_week,
          opens_at: h.opens_at,
          closes_at: h.closes_at,
          is_closed: h.is_closed,
          is_24_hours: h.is_24_hours,
        }))
      : [
          { day_of_week: 1, opens_at: '09:00', closes_at: '18:00', is_closed: false, is_24_hours: false },
          { day_of_week: 2, opens_at: '09:00', closes_at: '18:00', is_closed: false, is_24_hours: false },
          { day_of_week: 3, opens_at: '09:00', closes_at: '18:00', is_closed: false, is_24_hours: false },
          { day_of_week: 4, opens_at: '09:00', closes_at: '18:00', is_closed: false, is_24_hours: false },
          { day_of_week: 5, opens_at: '09:00', closes_at: '18:00', is_closed: false, is_24_hours: false },
          { day_of_week: 6, opens_at: '10:00', closes_at: '16:00', is_closed: false, is_24_hours: false },
          { day_of_week: 0, opens_at: null, closes_at: null, is_closed: true, is_24_hours: false },
        ];

  // Parse geo coordinates
  const coords = parseEwkbPoint(business.geo_point as string | null);

  const initialData: BusinessFormData = {
    canonical_name: business.canonical_name,
    description: business.description || '',
    year_established: business.year_established ? String(business.year_established) : '',
    primary_phone: business.primary_phone,
    alternate_phone: business.alternate_phone || '',
    whatsapp_phone: business.whatsapp_phone || '',
    business_contact_email: business.business_contact_email || '',
    show_email: Boolean(business.show_email),
    website_url: business.website_url || '',
    primary_category_id: business.primary_category_id,
    services,
    location_mode: business.location_mode as LocationMode,
    city: business.city,
    state: business.state,
    country: business.country,
    country_code: business.country_code,
    address_line_1: business.address_line_1 || '',
    address_line_2: business.address_line_2 || '',
    locality: business.locality || '',
    postal_code: business.postal_code || '',
    show_street_address: Boolean(business.show_street_address),
    latitude: coords ? String(coords.lat) : '',
    longitude: coords ? String(coords.lng) : '',
    service_areas: serviceAreas,
    hours,
    facebook_url: business.facebook_url || '',
    instagram_url: business.instagram_url || '',
    linkedin_url: business.linkedin_url || '',
    youtube_url: business.youtube_url || '',
  };

  return (
    <>
      <Topbar
        title={`Edit: ${business.canonical_name}`}
        subtitle={`Canonical Slug: /business/${business.slug}`}
      />

      <main className="p-6 max-w-5xl">
        <BusinessForm
          categories={categories}
          initialData={initialData}
          businessId={id}
          currentPublicationStatus={business.publication_status}
          currentVerificationStatus={business.verification_status}
          isAdmin={user.isAdmin}
        />
      </main>
    </>
  );
}
