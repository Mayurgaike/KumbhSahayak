import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../../lib/api';
import { socket } from '../../lib/socket';
import { Loader2, Navigation as NavIcon, MapPin, X, Info } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import RoutingMachine from '../../components/map/RoutingMachine';

// Fix for default Leaflet markers missing icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const USER_MOCK_LOCATION = [19.9975, 73.785]; // Mock user location in Nashik
const MAP_CENTER = [19.998, 73.785];

const getDensityColor = (level) => {
  switch (level) {
    case 'low': return '#10b981'; // emerald-500
    case 'medium': return '#f59e0b'; // amber-500
    case 'high': return '#ef4444'; // red-500
    default: return '#10b981';
  }
};

const getFacilityIcon = (type) => {
  const color = type === 'medical_camp' ? 'red' : type === 'exit' ? 'green' : 'blue';
  return L.divIcon({
    className: 'custom-facility-icon',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

// Component to handle map centering on routing
function RoutingHandler({ start, end }) {
  const map = useMap();
  useEffect(() => {
    if (start && end) {
      // Zoom out slightly to fit both
      const bounds = L.latLngBounds([start, end]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [start, end, map]);
  return null;
}

export default function Navigation() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState(null);
  
  const fetchZones = async () => {
    try {
      const res = await api.get('/api/zones/public/status');
      setZones(res.data.zones || []);
    } catch (err) {
      console.error('Failed to fetch zones for navigation', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();

    const handleZoneStatus = () => {
      // Re-fetch to get updated density
      fetchZones();
    };

    socket.on('zone:status', handleZoneStatus);
    return () => socket.off('zone:status', handleZoneStatus);
  }, []);

  // Format polygons for leaflet: [lat, lng] instead of [lng, lat]
  const zonePolygons = useMemo(() => {
    return zones.map(zone => {
      let positions = [];
      if (zone.boundary && zone.boundary.coordinates && zone.boundary.coordinates[0]) {
        positions = zone.boundary.coordinates[0].map(coord => [coord[1], coord[0]]);
      }
      return {
        ...zone,
        positions,
        color: getDensityColor(zone.currentDensity)
      };
    });
  }, [zones]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] -mx-4 -mt-6">
      {/* Top Banner */}
      <div className="bg-bg-panel p-4 shadow z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold font-serif text-brand-maroon">Live Crowd Map</h1>
          <p className="text-sm text-text-muted">Crowd awareness & facility routing</p>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-mono font-bold bg-bg-base px-3 py-2 rounded">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Low</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Med</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> High</span>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative z-0">
        <MapContainer 
          center={MAP_CENTER} 
          zoom={16} 
          className="w-full h-full"
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          />

          {/* User Location */}
          <Marker position={USER_MOCK_LOCATION}>
            <Tooltip permanent direction="bottom" className="font-bold">You are here</Tooltip>
          </Marker>

          {/* Zones */}
          {zonePolygons.map(zone => {
            if (!zone.positions.length) return null;
            return (
              <Polygon 
                key={zone._id}
                positions={zone.positions}
                pathOptions={{ 
                  color: zone.color, 
                  fillColor: zone.color, 
                  fillOpacity: 0.35,
                  weight: 2
                }}
              >
                <Tooltip sticky className="font-bold">
                  {zone.name} ({zone.currentHeadcount} pax)
                </Tooltip>
              </Polygon>
            );
          })}

          {/* Facilities */}
          {zones.map(zone => (
            zone.facilities?.map(fac => {
              if (!fac.location?.coordinates) return null;
              const pos = [fac.location.coordinates[1], fac.location.coordinates[0]];
              return (
                <Marker 
                  key={fac._id || fac.name} 
                  position={pos}
                  icon={getFacilityIcon(fac.type)}
                  eventHandlers={{
                    click: () => setSelectedFacility({ ...fac, position: pos, zoneName: zone.name })
                  }}
                >
                  <Tooltip className="font-bold capitalize">{fac.name}</Tooltip>
                </Marker>
              );
            })
          ))}

          {/* Routing Machine */}
          {selectedFacility && (
            <>
              <RoutingMachine 
                // In React Leaflet V4, modifying RoutingMachine dynamically can be tricky.
                // We recreate it by passing a key based on destination to force unmount/remount
                key={`route-${selectedFacility._id || selectedFacility.name}`}
                start={USER_MOCK_LOCATION} 
                end={selectedFacility.position} 
              />
              <RoutingHandler start={USER_MOCK_LOCATION} end={selectedFacility.position} />
            </>
          )}

        </MapContainer>

        {/* Selected Facility Panel */}
        {selectedFacility && (
          <div className="absolute bottom-6 left-4 right-4 sm:left-auto sm:w-80 bg-white p-4 rounded-xl shadow-2xl border border-border-color z-[1000] animate-in slide-in-from-bottom-5">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-lg capitalize">{selectedFacility.name}</h3>
                <p className="text-sm text-text-muted capitalize">{selectedFacility.type.replace('_', ' ')} &bull; {selectedFacility.zoneName}</p>
              </div>
              <button 
                onClick={() => setSelectedFacility(null)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-blue-50 text-blue-700 p-3 rounded text-sm flex items-start gap-2 mb-3">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Turn-by-turn routing activated. Follow the blue path on the map.</p>
            </div>

            <Button 
              onClick={() => setSelectedFacility(null)}
              className="w-full bg-bg-base border-2 border-border-color text-text-primary hover:bg-gray-100"
            >
              Cancel Navigation
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
