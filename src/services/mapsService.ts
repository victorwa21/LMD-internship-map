import { Coordinates, InternshipAddress } from '../types/profile';

/**
 * Pittsburgh center coordinates
 */
export const PITTSBURGH_CENTER: Coordinates = {
  lat: 40.4406,
  lng: -79.9959,
};

/**
 * City of Bridges High School coordinates
 * Address: 460 S Graham St, Pittsburgh, PA 15232
 */
export const SCHOOL_LOCATION: Coordinates = {
  lat: 40.4576121,
  lng: -79.9371610,
};

/**
 * Geocode an address to get coordinates using Mapbox (with Nominatim fallback)
 */
export async function geocodeAddress(address: string): Promise<Coordinates> {
  try {
    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    
    // Try Mapbox first if API key is available
    if (mapboxToken) {
      try {
        const encodedAddress = encodeURIComponent(address);
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}&limit=1&proximity=-79.9959,40.4406&country=us`;
        
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            return {
              lng: feature.center[0],
              lat: feature.center[1],
            };
          }
        }
      } catch (mapboxError) {
        console.warn('Mapbox geocoding failed, falling back to Nominatim:', mapboxError);
        // Fall through to Nominatim
      }
    }

    // Fallback to Nominatim
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}+Pittsburgh+PA&limit=1&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Pittsburgh-Internship-Map/1.0', // Required by Nominatim
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      throw new Error('No results found for this address');
    }

    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    };
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw error;
  }
}

/**
 * Search for addresses using Mapbox Geocoding API (for autocomplete)
 * Falls back to Nominatim if Mapbox API key is not available
 */
export async function searchAddresses(query: string): Promise<Array<{
  display: string;
  address: InternshipAddress;
  coordinates: Coordinates;
}>> {
  try {
    if (query.length < 3) {
      return [];
    }

    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    
    // Try Mapbox first if API key is available
    if (mapboxToken) {
      try {
        const encodedQuery = encodeURIComponent(query);
        // Bias toward Pittsburgh, PA - prioritize addresses
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${mapboxToken}&limit=5&proximity=-79.9959,40.4406&country=us&types=address`;
        
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            return data.features
              .filter((feature: any) => {
                // Filter to Pittsburgh area - be more lenient
                const placeName = (feature.place_name || '').toLowerCase();
                const context = feature.context || [];
                const city = context.find((c: any) => c.id?.startsWith('place.'));
                const cityText = (city?.text || '').toLowerCase();
                
                // Check if it's in Pittsburgh or nearby areas
                return placeName.includes('pittsburgh') || 
                       cityText.includes('pittsburgh') ||
                       placeName.includes('pa') || 
                       placeName.includes('pennsylvania');
              })
              .map((feature: any) => {
                const address = parseAddressFromMapbox(feature);
                return {
                  display: feature.place_name || feature.text || query,
                  address,
                  coordinates: {
                    lng: feature.center[0],
                    lat: feature.center[1],
                  },
                };
              });
          }
        }
      } catch (mapboxError) {
        console.warn('Mapbox geocoding failed, falling back to Nominatim:', mapboxError);
        // Fall through to Nominatim
      }
    }

    // Fallback to Nominatim
    const encodedQuery = encodeURIComponent(query);
    // Add "Pittsburgh PA" to improve results
    const searchQuery = `${encodedQuery} Pittsburgh PA`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&limit=5&addressdetails=1&bounded=1&viewbox=-80.1,40.35,-79.9,40.5`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Pittsburgh-Internship-Map/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Address search failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    return data
      .filter((result: any) => {
        // Filter to Pittsburgh area - be more lenient
        const address = result.address || {};
        const city = (address.city || address.town || address.municipality || '').toLowerCase();
        const displayName = (result.display_name || '').toLowerCase();
        return city.includes('pittsburgh') || 
               displayName.includes('pittsburgh') ||
               displayName.includes('pa') ||
               displayName.includes('pennsylvania');
      })
      .map((result: any) => {
        const address = parseAddressFromNominatim(result);
        return {
          display: result.display_name || result.name || query,
          address,
          coordinates: {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
          },
        };
      });
  } catch (error) {
    console.error('Error searching addresses:', error);
    return [];
  }
}

/**
 * Parse address components from Mapbox result
 */
function parseAddressFromMapbox(feature: any): InternshipAddress {
  const context = feature.context || [];
  
  // Extract address components from Mapbox context
  // Mapbox structure: feature.properties.address contains house number
  // feature.text contains street name
  // context contains city, state, postcode
  
  const addressNumber = feature.properties?.address || '';
  const streetName = feature.text || context.find((c: any) => c.id?.startsWith('street'))?.text || '';
  
  // Combine house number and street name
  let street = '';
  if (addressNumber && streetName) {
    street = `${addressNumber} ${streetName}`;
  } else if (streetName) {
    street = streetName;
  } else if (addressNumber) {
    street = addressNumber;
  }
  
  const city = context.find((c: any) => c.id?.startsWith('place'))?.text || 'Pittsburgh';
  const state = context.find((c: any) => c.id?.startsWith('region'))?.text || 'Pennsylvania';
  const zip = context.find((c: any) => c.id?.startsWith('postcode'))?.text || '';

  // Build full address
  const fullAddress = feature.place_name || 
    [street, city, state, zip].filter(Boolean).join(', ').trim();

  return {
    street: street.trim() || '',
    city,
    state,
    zip,
    fullAddress,
  };
}

/**
 * Parse address components from Nominatim result
 */
function parseAddressFromNominatim(result: any): InternshipAddress {
  const address = result.address || {};
  
  // Try to extract house number from various fields
  let houseNumber = address.house_number || '';
  
  // If no house_number, try to extract from display_name
  if (!houseNumber && result.display_name) {
    const displayName = result.display_name;
    // Look for pattern like "123, Street Name" or "123 Street Name"
    const match = displayName.match(/^(\d+)[,\s]+/);
    if (match) {
      houseNumber = match[1];
    }
  }
  
  const road = address.road || address.street || address.pedestrian || '';
  const street = [houseNumber, road].filter(Boolean).join(' ').trim();

  const city = address.city || address.town || address.village || address.municipality || 'Pittsburgh';
  const state = address.state || 'Pennsylvania';
  const zip = address.postcode || '';

  // Build full address - prefer display_name but format it better
  let fullAddress = result.display_name || '';
  if (fullAddress && street) {
    // Try to create a cleaner format: "123 Street Name, City, State ZIP"
    const parts = [street, city, state, zip].filter(Boolean);
    fullAddress = parts.join(', ');
  } else if (!fullAddress) {
    fullAddress = [street, city, state, zip].filter(Boolean).join(', ').trim();
  }

  return {
    street: street || '',
    city,
    state,
    zip,
    fullAddress: fullAddress.trim(),
  };
}

/**
 * Check if an address is in Pittsburgh area
 */
export function isPittsburghArea(address: InternshipAddress): boolean {
  const pittsburghKeywords = ['pittsburgh', 'pgh', 'allegheny'];
  const addressLower = address.fullAddress.toLowerCase();
  const cityLower = address.city.toLowerCase();
  
  return pittsburghKeywords.some((keyword) => 
    addressLower.includes(keyword) || cityLower.includes(keyword)
  );
}

