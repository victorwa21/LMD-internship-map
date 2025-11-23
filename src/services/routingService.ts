import { Coordinates, TravelTime } from '../types/profile';
import { SCHOOL_LOCATION } from './mapsService';

/**
 * Calculate travel time from school to a destination using OSRM
 */
export async function calculateTravelTime(destination: Coordinates): Promise<TravelTime> {
  try {
    // OSRM API endpoint (public instance)
    // The API has CORS enabled, so should work directly
    const baseUrl = 'http://router.project-osrm.org/route/v1';
    
    // Format: lon,lat (OSRM uses longitude first!)
    // School: 460 S Graham St, Pittsburgh, PA 15232
    const schoolCoords = `${SCHOOL_LOCATION.lng},${SCHOOL_LOCATION.lat}`;
    const destCoords = `${destination.lng},${destination.lat}`;
    
    console.log('Calculating travel time from City of Bridges High School (460 S Graham St) to:', destination);
    console.log('School coords:', schoolCoords, '(', SCHOOL_LOCATION.lat, ',', SCHOOL_LOCATION.lng, ')');
    console.log('Dest coords:', destCoords);
    
    // Calculate driving time
    const drivingUrl = `${baseUrl}/driving/${schoolCoords};${destCoords}?overview=false`;
    console.log('Driving URL:', drivingUrl);
    
    let drivingResponse;
    try {
      drivingResponse = await fetch(drivingUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        },
      });
    } catch (fetchError: any) {
      console.error('Fetch error (likely CORS):', fetchError);
      // Try with CORS proxy as fallback
      const corsProxy = 'https://api.allorigins.win/raw?url=';
      const proxiedUrl = `${corsProxy}${encodeURIComponent(drivingUrl)}`;
      console.log('Trying with CORS proxy:', proxiedUrl);
      drivingResponse = await fetch(proxiedUrl);
    }
    
    if (!drivingResponse.ok) {
      const errorText = await drivingResponse.text();
      console.error('Driving API error:', drivingResponse.status, errorText);
      throw new Error(`Failed to calculate driving time: ${drivingResponse.status}`);
    }
    
    const drivingData = await drivingResponse.json();
    console.log('Driving response:', drivingData);
    
    if (drivingData.code !== 'Ok' || !drivingData.routes || drivingData.routes.length === 0) {
      console.error('Invalid driving response:', drivingData);
      throw new Error('No route found for driving');
    }
    
    const drivingDuration = drivingData.routes[0].duration || 0;
    console.log('Driving duration:', drivingDuration, 'seconds');
    
    // Calculate walking time
    const walkingUrl = `${baseUrl}/walking/${schoolCoords};${destCoords}?overview=false`;
    console.log('Walking URL:', walkingUrl);
    
    let walkingResponse;
    try {
      walkingResponse = await fetch(walkingUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        },
      });
    } catch (fetchError: any) {
      console.error('Fetch error (likely CORS):', fetchError);
      // Try with CORS proxy as fallback
      const corsProxy = 'https://api.allorigins.win/raw?url=';
      const proxiedUrl = `${corsProxy}${encodeURIComponent(walkingUrl)}`;
      console.log('Trying with CORS proxy:', proxiedUrl);
      walkingResponse = await fetch(proxiedUrl);
    }
    
    if (!walkingResponse.ok) {
      const errorText = await walkingResponse.text();
      console.error('Walking API error:', walkingResponse.status, errorText);
      throw new Error(`Failed to calculate walking time: ${walkingResponse.status}`);
    }
    
    const walkingData = await walkingResponse.json();
    console.log('Walking response:', walkingData);
    
    if (walkingData.code !== 'Ok' || !walkingData.routes || walkingData.routes.length === 0) {
      console.error('Invalid walking response:', walkingData);
      throw new Error('No route found for walking');
    }
    
    const walkingDuration = walkingData.routes[0].duration || 0;
    console.log('Walking duration:', walkingDuration, 'seconds');
    
    // Convert seconds to minutes
    const result = {
      driving: Math.round(drivingDuration / 60),
      walking: Math.round(walkingDuration / 60),
      bus: 0, // Bus not available from OSRM, would need to be entered manually
    };
    
    console.log('Final travel time result:', result);
    return result;
  } catch (error) {
    console.error('Error calculating travel time:', error);
    // Return default values if calculation fails
    return {
      driving: 0,
      walking: 0,
      bus: 0,
    };
  }
}

/**
 * Format travel time in minutes to human-readable string
 */
export function formatTravelTime(minutes: number): string {
  if (minutes === 0) return 'N/A';
  
  if (minutes < 1) return '< 1 min';
  if (minutes === 1) return '1 min';
  return `${minutes} min`;
}

