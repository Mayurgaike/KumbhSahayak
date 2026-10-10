import L from 'leaflet';
import { createControlComponent } from '@react-leaflet/core';
import 'leaflet-routing-machine';

const createRoutineMachineLayer = (props) => {
  const { start, end } = props;
  
  if (!start || !end) return null;

  const instance = L.Routing.control({
    waypoints: [
      L.latLng(start[0], start[1]),
      L.latLng(end[0], end[1])
    ],
    lineOptions: {
      styles: [{ color: '#3b82f6', weight: 6, opacity: 0.8 }] // blue-500
    },
    show: false,
    addWaypoints: false,
    routeWhileDragging: false,
    fitSelectedRoutes: true,
    showAlternatives: false,
    createMarker: () => null, // We'll render our own markers via react-leaflet if needed
  });

  return instance;
};

const RoutingMachine = createControlComponent(createRoutineMachineLayer);

export default RoutingMachine;
