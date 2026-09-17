import { PlacesProvider, PlacesAutocompleteResult, PlacesDetailsResult, PlaceSuggestion, NormalizedPlaceDetails } from './types';

interface MockPlaceData {
  suggestion: PlaceSuggestion;
  details: NormalizedPlaceDetails;
}

const MOCK_PLACES: MockPlaceData[] = [
  // 1. Chennai — Anna Nagar
  {
    suggestion: {
      place_id: 'mock_chennai_anna_nagar_001',
      primary_text: 'Anna Nagar West',
      secondary_text: 'Chennai, Tamil Nadu, India',
      description: 'Anna Nagar West, Chennai, Tamil Nadu, India',
      types: ['sublocality', 'sublocality_level_1', 'political'],
    },
    details: {
      place_id: 'mock_chennai_anna_nagar_001',
      name: 'Anna Nagar West',
      formatted_address: '2nd Avenue, Anna Nagar West, Chennai, Tamil Nadu 600040, India',
      address_line_1: '2nd Avenue',
      address_line_2: null,
      locality: 'Anna Nagar West',
      city: 'Chennai',
      district: 'Chennai',
      state: 'Tamil Nadu',
      postal_code: '600040',
      country: 'India',
      country_code: 'IN',
      latitude: 13.0850,
      longitude: 80.2101,
    },
  },
  // 2. Chennai — T Nagar
  {
    suggestion: {
      place_id: 'mock_chennai_tnagar_002',
      primary_text: 'T. Nagar Commercial Hub',
      secondary_text: 'Thyagaraya Nagar, Chennai, Tamil Nadu, India',
      description: 'T. Nagar, Chennai, Tamil Nadu, India',
      types: ['establishment', 'point_of_interest'],
    },
    details: {
      place_id: 'mock_chennai_tnagar_002',
      name: 'T. Nagar Commercial Hub',
      formatted_address: '45 Usman Road, T. Nagar, Chennai, Tamil Nadu 600017, India',
      address_line_1: '45 Usman Road',
      address_line_2: 'Suite 3B',
      locality: 'T. Nagar',
      city: 'Chennai',
      district: 'Chennai',
      state: 'Tamil Nadu',
      postal_code: '600017',
      country: 'India',
      country_code: 'IN',
      latitude: 13.0418,
      longitude: 80.2341,
    },
  },
  // 3. Bengaluru — MG Road
  {
    suggestion: {
      place_id: 'mock_bengaluru_mgroad_003',
      primary_text: 'Mahatma Gandhi Road',
      secondary_text: 'Bengaluru, Karnataka, India',
      description: 'MG Road, Bengaluru, Karnataka, India',
      types: ['route'],
    },
    details: {
      place_id: 'mock_bengaluru_mgroad_003',
      name: 'MG Road Central',
      formatted_address: '104 MG Road, Ashok Nagar, Bengaluru, Karnataka 560001, India',
      address_line_1: '104 MG Road',
      address_line_2: null,
      locality: 'Ashok Nagar',
      city: 'Bengaluru',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      postal_code: '560001',
      country: 'India',
      country_code: 'IN',
      latitude: 12.9716,
      longitude: 77.5946,
    },
  },
  // 4. Bengaluru — Whitefield
  {
    suggestion: {
      place_id: 'mock_bengaluru_whitefield_004',
      primary_text: 'Whitefield Tech Park',
      secondary_text: 'Whitefield, Bengaluru, Karnataka, India',
      description: 'Whitefield, Bengaluru, Karnataka, India',
      types: ['sublocality_level_1', 'sublocality'],
    },
    details: {
      place_id: 'mock_bengaluru_whitefield_004',
      name: 'Whitefield Tech Park',
      formatted_address: '100 Innovation Boulevard, Whitefield, Bengaluru, Karnataka 560066, India',
      address_line_1: '100 Innovation Boulevard',
      address_line_2: null,
      locality: 'Whitefield',
      city: 'Bengaluru',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      postal_code: '560066',
      country: 'India',
      country_code: 'IN',
      latitude: 12.9698,
      longitude: 77.7500,
    },
  },
  // 5. New Delhi — Connaught Place
  {
    suggestion: {
      place_id: 'mock_delhi_cp_005',
      primary_text: 'Statesman House',
      secondary_text: 'Barakhamba Road, Connaught Place, New Delhi, Delhi, India',
      description: 'Statesman House, Barakhamba Road, Connaught Place, New Delhi, Delhi 110001, India',
      types: ['premise', 'establishment'],
    },
    details: {
      place_id: 'mock_delhi_cp_005',
      name: 'Statesman House',
      formatted_address: '148 Barakhamba Road, Connaught Place, New Delhi, Delhi 110001, India',
      address_line_1: '148 Barakhamba Road',
      address_line_2: '4th Floor',
      locality: 'Connaught Place',
      city: 'New Delhi',
      district: 'New Delhi',
      state: 'Delhi',
      postal_code: '110001',
      country: 'India',
      country_code: 'IN',
      latitude: 28.6297,
      longitude: 77.2274,
    },
  },
  // 6. Coimbatore — RS Puram
  {
    suggestion: {
      place_id: 'mock_coimbatore_rspuram_006',
      primary_text: 'RS Puram West',
      secondary_text: 'Coimbatore, Tamil Nadu, India',
      description: 'Rathinasabapathy Puram, Coimbatore, Tamil Nadu, India',
      types: ['sublocality_level_1', 'sublocality'],
    },
    details: {
      place_id: 'mock_coimbatore_rspuram_006',
      name: 'RS Puram Commercial Area',
      formatted_address: '12 DB Road, RS Puram, Coimbatore, Tamil Nadu 641002, India',
      address_line_1: '12 DB Road',
      address_line_2: null,
      locality: 'RS Puram',
      city: 'Coimbatore',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      postal_code: '641002',
      country: 'India',
      country_code: 'IN',
      latitude: 11.0088,
      longitude: 76.9498,
    },
  },
  // 7. Munnar — Idukki, Kerala
  {
    suggestion: {
      place_id: 'mock_munnar_kerala_007',
      primary_text: 'Munnar Town',
      secondary_text: 'Idukki District, Kerala, India',
      description: 'Munnar, Idukki, Kerala, India',
      types: ['locality', 'political'],
    },
    details: {
      place_id: 'mock_munnar_kerala_007',
      name: 'Munnar Valley Hub',
      formatted_address: 'Post Office Junction, Old Munnar, Idukki, Kerala 685612, India',
      address_line_1: 'Post Office Junction',
      address_line_2: null,
      locality: 'Old Munnar',
      city: 'Munnar',
      district: 'Idukki',
      state: 'Kerala',
      postal_code: '685612',
      country: 'India',
      country_code: 'IN',
      latitude: 10.0889,
      longitude: 77.0595,
    },
  },
  // 8. International — London, United Kingdom
  {
    suggestion: {
      place_id: 'mock_london_oxford_008',
      primary_text: 'Oxford Street Retail Center',
      secondary_text: 'Westminster, London, United Kingdom',
      description: 'Oxford Street, London W1D 1BS, United Kingdom',
      types: ['route', 'establishment'],
    },
    details: {
      place_id: 'mock_london_oxford_008',
      name: 'Oxford Street Retail Center',
      formatted_address: '250 Oxford Street, Marylebone, London, Westminster W1D 1BS, United Kingdom',
      address_line_1: '250 Oxford Street',
      address_line_2: 'Suite 201',
      locality: 'Marylebone',
      city: 'London',
      district: 'Westminster',
      state: 'Greater London',
      postal_code: 'W1D 1BS',
      country: 'United Kingdom',
      country_code: 'GB',
      latitude: 51.5154,
      longitude: -0.1419,
    },
  },
];

export class MockPlacesProvider implements PlacesProvider {
  name = 'mock';

  isAvailable(): boolean {
    return true;
  }

  async autocomplete(query: string): Promise<PlacesAutocompleteResult> {
    const trimmed = (query || '').toLowerCase().trim();
    if (trimmed.length < 2) {
      return {
        success: true,
        suggestions: [],
      };
    }

    const matches = MOCK_PLACES.filter(
      (m) =>
        m.suggestion.description.toLowerCase().includes(trimmed) ||
        m.suggestion.primary_text.toLowerCase().includes(trimmed) ||
        m.details.city.toLowerCase().includes(trimmed) ||
        m.details.state.toLowerCase().includes(trimmed) ||
        m.details.locality.toLowerCase().includes(trimmed)
    );

    return {
      success: true,
      suggestions: matches.map((m) => m.suggestion),
    };
  }

  async getDetails(placeId: string): Promise<PlacesDetailsResult> {
    const trimmed = (placeId || '').trim();
    if (!trimmed) {
      return {
        success: false,
        error: 'Place ID is required',
        errorCode: 'INVALID_REQUEST',
      };
    }

    const match = MOCK_PLACES.find((m) => m.details.place_id === trimmed);
    if (!match) {
      return {
        success: false,
        error: 'Place not found in mock directory',
        errorCode: 'NOT_FOUND',
      };
    }

    return {
      success: true,
      details: match.details,
    };
  }
}
