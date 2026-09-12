'use client';

import { BusinessFormData, Category } from '@/types/business';

interface BusinessPreviewCardProps {
  data: BusinessFormData;
  categories: Category[];
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function BusinessPreviewCard({ data, categories }: BusinessPreviewCardProps) {
  const selectedCategory = categories.find((c) => c.id === data.primary_category_id);
  const activeServices = (data.services || []).filter((s) => s.trim().length > 0);
  const activeAreas = (data.service_areas || []).filter((a) => a.trim().length > 0);

  return (
    <div className="bg-white rounded-[12px] border border-[#DCE2E8] shadow-sm overflow-hidden">
      {/* Top Banner / Public Preview Badge */}
      <div className="bg-[#004AAD] text-white px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider">Public Listing Preview</span>
        </div>
        <span className="text-[11px] bg-white/15 px-2.5 py-0.5 rounded text-white/90">
          Public-Safe Output
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="border-b border-[#DCE2E8] pb-5">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {selectedCategory && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#ECF4FF] text-[#004AAD] border border-[#BEDBFE]">
                {selectedCategory.name}
              </span>
            )}
            <span className="text-xs font-medium px-2.5 py-1 rounded bg-[#F2F5FA] text-[#5D6776] border border-[#DCE2E8] capitalize">
              {data.location_mode.replace('_', ' ')}
            </span>
            {data.year_established && (
              <span className="text-xs text-[#7D8795]">
                Est. {data.year_established}
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-[#2A3547]">
            {data.canonical_name || 'Business Name'}
          </h2>
          {data.description && (
            <p className="mt-2.5 text-sm text-[#5D6776] leading-relaxed line-clamp-3">
              {data.description}
            </p>
          )}
        </div>

        {/* Contact & NAP Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#F2F5FA] p-4 rounded-[8px] space-y-2">
            <h3 className="text-xs font-bold text-[#7D8795] uppercase tracking-wider">
              Contact Details
            </h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-[#2A3547]">
                <svg className="w-4 h-4 text-[#004AAD] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="font-semibold">{data.primary_phone || 'Phone Number'}</span>
              </div>
              {data.alternate_phone && (
                <div className="flex items-center gap-2 text-[#5D6776]">
                  <span className="text-xs text-[#7D8795] w-4 text-center shrink-0">Alt</span>
                  <span>{data.alternate_phone}</span>
                </div>
              )}
              {data.whatsapp_phone && (
                <div className="flex items-center gap-2 text-emerald-700 font-medium">
                  <span className="text-xs text-emerald-600 w-4 text-center shrink-0">WA</span>
                  <span>{data.whatsapp_phone}</span>
                </div>
              )}
              {data.show_email && data.business_contact_email && (
                <div className="flex items-center gap-2 text-[#5D6776]">
                  <svg className="w-4 h-4 text-[#7D8795] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{data.business_contact_email}</span>
                </div>
              )}
              {data.website_url && (
                <div className="flex items-center gap-2 text-[#004AAD] font-medium truncate">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span className="truncate">{data.website_url}</span>
                </div>
              )}
            </div>
          </div>

          {/* Location & Coverage */}
          <div className="bg-[#F2F5FA] p-4 rounded-[8px] space-y-2">
            <h3 className="text-xs font-bold text-[#7D8795] uppercase tracking-wider">
              {data.location_mode === 'service_area' ? 'Service Coverage' : 'Location Address'}
            </h3>
            <div className="text-sm text-[#2A3547] space-y-1">
              {(data.location_mode === 'storefront' || data.location_mode === 'hybrid') && data.show_street_address && (
                <div>
                  <p className="font-medium">{data.address_line_1}</p>
                  {data.address_line_2 && <p>{data.address_line_2}</p>}
                  <p className="text-[#5D6776]">
                    {data.locality ? `${data.locality}, ` : ''}{data.city}, {data.state} {data.postal_code}
                  </p>
                  <p className="text-xs text-[#7D8795]">{data.country}</p>
                </div>
              )}

              {data.location_mode === 'service_area' && (
                <div className="space-y-2">
                  <p className="font-medium text-[#2A3547]">
                    Serving {data.city}, {data.state}, {data.country}
                  </p>
                  {activeAreas.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-[#7D8795] block mb-1">Service Areas:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeAreas.map((area, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-white px-2 py-0.5 rounded border border-[#DCE2E8] text-[#5D6776]"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {data.location_mode === 'hybrid' && activeAreas.length > 0 && (
                <div className="pt-2 border-t border-[#DCE2E8]/60 mt-2">
                  <span className="text-xs font-medium text-[#7D8795] block mb-1">Also Serving:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeAreas.map((area, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-white px-2 py-0.5 rounded border border-[#DCE2E8] text-[#5D6776]"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Services Section */}
        {activeServices.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-[#7D8795] uppercase tracking-wider mb-2.5">
              Services Offered
            </h3>
            <div className="flex flex-wrap gap-2">
              {activeServices.map((service, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-[6px] text-xs font-medium bg-[#ECF4FF] text-[#004AAD] border border-[#BEDBFE]"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Business Hours Section */}
        {data.hours && data.hours.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-[#7D8795] uppercase tracking-wider mb-2.5">
              Operating Hours
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
              {data.hours.map((h) => {
                let statusText = 'Closed';
                if (h.is_24_hours) {
                  statusText = 'Open 24 Hours';
                } else if (!h.is_closed && h.opens_at && h.closes_at) {
                  statusText = `${h.opens_at.slice(0, 5)} - ${h.closes_at.slice(0, 5)}`;
                }

                return (
                  <div
                    key={h.day_of_week}
                    className="p-2 rounded bg-[#F2F5FA] flex items-center justify-between border border-[#DCE2E8]"
                  >
                    <span className="font-semibold text-[#2A3547]">
                      {DAYS[h.day_of_week].slice(0, 3)}
                    </span>
                    <span
                      className={
                        h.is_closed
                          ? 'text-[#E36B5D] font-medium'
                          : h.is_24_hours
                          ? 'text-emerald-700 font-semibold'
                          : 'text-[#5D6776]'
                      }
                    >
                      {statusText}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Social Media Section */}
        {(data.facebook_url || data.instagram_url || data.linkedin_url || data.youtube_url) && (
          <div className="border-t border-[#DCE2E8] pt-4">
            <h3 className="text-xs font-bold text-[#7D8795] uppercase tracking-wider mb-2">
              Online Channels
            </h3>
            <div className="flex flex-wrap gap-3 text-xs">
              {data.facebook_url && (
                <span className="text-[#004AAD] hover:underline cursor-pointer">Facebook</span>
              )}
              {data.instagram_url && (
                <span className="text-[#004AAD] hover:underline cursor-pointer">Instagram</span>
              )}
              {data.linkedin_url && (
                <span className="text-[#004AAD] hover:underline cursor-pointer">LinkedIn</span>
              )}
              {data.youtube_url && (
                <span className="text-[#004AAD] hover:underline cursor-pointer">YouTube</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
