import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { StudentProfile } from '../types/profile';
import { PITTSBURGH_CENTER, SCHOOL_LOCATION } from '../services/mapsService';
import 'leaflet/dist/leaflet.css';

// Blue dot icon for sample internship markers
const sampleInternshipIcon = divIcon({
  className: 'sample-internship-marker',
  html: `<div style="
    width: 20px;
    height: 20px;
    background-color: #2563eb;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Green dot icon for user-added internship markers
const userInternshipIcon = divIcon({
  className: 'user-internship-marker',
  html: `<div style="
    width: 20px;
    height: 20px;
    background-color: #16a34a;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Special icon for the school - red circle
const schoolIcon = divIcon({
  className: 'school-marker',
  html: `<div style="
    width: 20px;
    height: 20px;
    background-color: #dc2626;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface MapProps {
  profiles: StudentProfile[];
  onMarkerClick: (profile: StudentProfile) => void;
}

// Component to handle map updates when profiles change
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  
  // Center map on Pittsburgh if needed
  if (map.getZoom() < 10) {
    map.setView(center, 12);
  }
  
  return null;
}

export default function Map({ profiles, onMarkerClick }: MapProps) {
  const center: [number, number] = [PITTSBURGH_CENTER.lat, PITTSBURGH_CENTER.lng];

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={center} />
        
        {/* School Marker */}
        <Marker
          position={[SCHOOL_LOCATION.lat, SCHOOL_LOCATION.lng]}
          icon={schoolIcon}
        >
          <Popup>
            <div className="text-sm">
              <strong className="text-red-600">City of Bridges High School</strong>
              <br />
              <span className="text-gray-600">460 S Graham St, Pittsburgh, PA 15232</span>
            </div>
          </Popup>
        </Marker>
        
        {/* Internship Profile Markers - Only show non-remote internships */}
        {profiles
          .filter((profile) => !profile.isRemote && profile.coordinates)
          .map((profile) => {
            // Check if this is a user-added profile (not a sample profile)
            const isUserAdded = !profile.id.startsWith('sample_');
            return (
              <Marker
                key={profile.id}
                position={[profile.coordinates!.lat, profile.coordinates!.lng]}
                icon={isUserAdded ? userInternshipIcon : sampleInternshipIcon}
                eventHandlers={{
                  click: () => {
                    onMarkerClick(profile);
                  },
                }}
              />
            );
          })}
      </MapContainer>
    </div>
  );
}
