import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, Image } from 'react-native';
import { DamagePoint } from '../models/contract.interface';

interface CarDiagramProps {
  onAddDamage: (x: number, y: number, view: 'front' | 'rear' | 'left' | 'right') => void;
  damagePoints: DamagePoint[];
  isEditable?: boolean;
  onVehicleTypeChange?: (type: VehicleType) => void;
}

type VehicleType = 'car' | 'scooter' | 'atv';

// Import vehicle diagram images
const vehicleImages = {
  car: require('../assets/car_conditions.png'),
  scooter: require('../assets/scooter-conditions.png'),
  atv: require('../assets/atv-conditions.png'),
};

/**
 * Interactive vehicle diagram component
 * Choose between Car, Scooter, or ATV diagrams
 */
export function CarDiagram({ onAddDamage, damagePoints, isEditable = true, onVehicleTypeChange }: CarDiagramProps) {
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const { width } = Dimensions.get('window');
  const diagramWidth = width - 40;
  const diagramHeight = diagramWidth * 1.2;
  
  function handleVehicleTypeChange(type: VehicleType) {
    setVehicleType(type);
    onVehicleTypeChange?.(type);
  }

  function handlePress(event: any) {
    if (!isEditable) return;
    
    const { locationX, locationY } = event.nativeEvent;
    const xPercent = (locationX / diagramWidth) * 100;
    const yPercent = (locationY / diagramHeight) * 100;
    
    // For now, we'll use 'front' as default view for all vehicle types
    onAddDamage(xPercent, yPercent, 'front');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>6. Κατάσταση Οχήματος</Text>
      
      {/* Vehicle Type selector buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.viewButton, vehicleType === 'car' && styles.activeButton]}
          onPress={() => handleVehicleTypeChange('car')}
        >
          <Text style={[styles.buttonText, vehicleType === 'car' && styles.activeButtonText]}>
            ΑΜΑΞΙ
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.viewButton, vehicleType === 'scooter' && styles.activeButton]}
          onPress={() => handleVehicleTypeChange('scooter')}
        >
          <Text style={[styles.buttonText, vehicleType === 'scooter' && styles.activeButtonText]}>
            SCOOTER
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.viewButton, vehicleType === 'atv' && styles.activeButton]}
          onPress={() => handleVehicleTypeChange('atv')}
        >
          <Text style={[styles.buttonText, vehicleType === 'atv' && styles.activeButtonText]}>
            ATV
          </Text>
        </TouchableOpacity>
      </View>

      {/* Vehicle Diagram Image */}
      <TouchableOpacity 
        onPress={handlePress} 
        activeOpacity={0.9}
        disabled={!isEditable}
        style={styles.diagramContainer}
      >
        <Image
          source={vehicleImages[vehicleType]}
          style={styles.vehicleImage}
          resizeMode="contain"
        />
        
        {/* Damage markers overlaid on image */}
        <View style={styles.damageOverlay}>
          {damagePoints.map((damage) => (
            <View
              key={damage.id}
              style={[
                styles.damageMarker,
                {
                  left: `${damage.x}%`,
                  top: `${damage.y}%`,
                }
              ]}
            />
          ))}
        </View>
      </TouchableOpacity>
      
      <Text style={styles.hint}>
        Πατήστε στο διάγραμμα για να σημειώσετε ζημιές
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  activeButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
  },
  activeButtonText: {
    color: '#fff',
  },
  diagramContainer: {
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    position: 'relative',
  },
  vehicleImage: {
    width: '100%',
    height: 400,
  },
  damageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  damageMarker: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF0000',
    borderWidth: 2,
    borderColor: '#8B0000',
    marginLeft: -8,
    marginTop: -8,
    opacity: 0.85,
  },
  hint: {
    marginTop: 15,
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

// Old FrontView function - no longer needed
function FrontView_OLD() {
  return (
    <G>
      {/* Hood/bonnet top edge */}
      <Path
        d="M 80 80 L 220 80"
        stroke="#000"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Windshield */}
      <Path
        d="M 80 80 L 75 120 L 225 120 L 220 80 Z"
        stroke="#000"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Roof */}
      <Rect
        x="75"
        y="120"
        width="150"
        height="80"
        stroke="#000"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Front bumper curved shape */}
      <Path
        d="M 90 230 Q 85 240, 80 250 L 80 290 Q 90 300, 100 305"
        stroke="#000"
        strokeWidth="2.5"
        fill="none"
      />
      <Path
        d="M 210 230 Q 215 240, 220 250 L 220 290 Q 210 300, 200 305"
        stroke="#000"
        strokeWidth="2.5"
        fill="none"
      />
      
      {/* Front hood */}
      <Path
        d="M 100 305 L 90 230 L 210 230 L 200 305 Z"
        stroke="#000"
        strokeWidth="2"
        fill="none"
      />
      <Line x1="100" y1="260" x2="200" y2="260" stroke="#000" strokeWidth="1.5" />
      
      {/* Front grille/bumper */}
      <Path
        d="M 100 305 L 110 330 L 190 330 L 200 305"
        stroke="#000"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Headlights */}
      <Ellipse cx="120" cy="315" rx="15" ry="10" stroke="#000" strokeWidth="2" fill="none" />
      <Ellipse cx="180" cy="315" rx="15" ry="10" stroke="#000" strokeWidth="2" fill="none" />
      
      {/* Front wheels */}
      <Circle cx="70" cy="270" r="25" stroke="#000" strokeWidth="3" fill="none" />
      <Circle cx="70" cy="270" r="15" stroke="#000" strokeWidth="1.5" fill="none" />
      
      <Circle cx="230" cy="270" r="25" stroke="#000" strokeWidth="3" fill="none" />
      <Circle cx="230" cy="270" r="15" stroke="#000" strokeWidth="1.5" fill="none" />
      
      {/* Side mirrors */}
      <Ellipse cx="55" cy="140" rx="12" ry="8" stroke="#000" strokeWidth="2" fill="none" />
      <Ellipse cx="245" cy="140" rx="12" ry="8" stroke="#000" strokeWidth="2" fill="none" />
      
      {/* License plate */}
      <Rect x="130" y="335" width="40" height="15" stroke="#000" strokeWidth="1.5" fill="none" />
    </G>
  );
}

// Old RearView function - no longer needed
function RearView_OLD() {
  return (
    <G>
      {/* Trunk top edge */}
      <Path
        d="M 80 80 L 220 80"
        stroke="#000"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Rear windshield */}
      <Path
        d="M 80 80 L 75 120 L 225 120 L 220 80 Z"
        stroke="#000"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Roof */}
      <Rect
        x="75"
        y="120"
        width="150"
        height="80"
        stroke="#000"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Rear fenders curved */}
      <Path
        d="M 90 230 Q 85 240, 80 250 L 80 290 Q 90 300, 100 305"
        stroke="#000"
        strokeWidth="2.5"
        fill="none"
      />
      <Path
        d="M 210 230 Q 215 240, 220 250 L 220 290 Q 210 300, 200 305"
        stroke="#000"
        strokeWidth="2.5"
        fill="none"
      />
      
      {/* Trunk */}
      <Path
        d="M 100 305 L 90 230 L 210 230 L 200 305 Z"
        stroke="#000"
        strokeWidth="2"
        fill="none"
      />
      <Line x1="100" y1="260" x2="200" y2="260" stroke="#000" strokeWidth="1.5" />
      
      {/* Rear bumper */}
      <Path
        d="M 100 305 L 110 330 L 190 330 L 200 305"
        stroke="#000"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Taillights */}
      <Rect x="105" y="310" width="20" height="15" stroke="#000" strokeWidth="2" fill="none" />
      <Rect x="175" y="310" width="20" height="15" stroke="#000" strokeWidth="2" fill="none" />
      
      {/* Rear wheels */}
      <Circle cx="70" cy="270" r="25" stroke="#000" strokeWidth="3" fill="none" />
      <Circle cx="70" cy="270" r="15" stroke="#000" strokeWidth="1.5" fill="none" />
      
      <Circle cx="230" cy="270" r="25" stroke="#000" strokeWidth="3" fill="none" />
      <Circle cx="230" cy="270" r="15" stroke="#000" strokeWidth="1.5" fill="none" />
      
      {/* Exhaust pipe */}
      <Circle cx="185" cy="335" r="5" stroke="#000" strokeWidth="2" fill="none" />
      
      {/* License plate */}
      <Rect x="130" y="335" width="40" height="15" stroke="#000" strokeWidth="1.5" fill="none" />
    </G>
  );
}

// Old LeftView function - no longer needed
function LeftView_OLD() {
  return (
    <G>
      {/* Car body outline - side profile */}
      <Path
        d="M 60 140 L 70 120 L 100 110 L 140 105 L 180 110 L 210 120 L 220 140 L 225 200 L 220 260 L 210 280 L 180 290 L 140 295 L 100 290 L 70 280 L 60 260 Z"
        stroke="#000"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Windows */}
      {/* Windshield */}
      <Path
        d="M 72 125 L 95 115 L 95 150 L 75 150 Z"
        stroke="#000"
        strokeWidth="1.5"
        fill="none"
      />
      
      {/* Front door window */}
      <Rect
        x="100"
        y="115"
        width="35"
        height="35"
        stroke="#000"
        strokeWidth="1.5"
        fill="none"
      />
      
      {/* Rear door window */}
      <Rect
        x="140"
        y="115"
        width="35"
        height="35"
        stroke="#000"
        strokeWidth="1.5"
        fill="none"
      />
      
      {/* Rear windshield */}
      <Path
        d="M 180 115 L 205 125 L 205 150 L 180 150 Z"
        stroke="#000"
        strokeWidth="1.5"
        fill="none"
      />
      
      {/* Door separations */}
      <Line x1="100" y1="150" x2="100" y2="270" stroke="#000" strokeWidth="2" />
      <Line x1="135" y1="150" x2="135" y2="270" stroke="#000" strokeWidth="2" />
      <Line x1="140" y1="150" x2="140" y2="270" stroke="#000" strokeWidth="2" />
      <Line x1="175" y1="150" x2="175" y2="270" stroke="#000" strokeWidth="2" />
      
      {/* Door handles */}
      <Line x1="115" y1="200" x2="125" y2="200" stroke="#000" strokeWidth="2" />
      <Line x1="155" y1="200" x2="165" y2="200" stroke="#000" strokeWidth="2" />
      
      {/* Side mirror */}
      <Ellipse cx="85" cy="145" rx="8" ry="12" stroke="#000" strokeWidth="2" fill="none" />
      <Line x1="90" y1="145" x2="95" y2="145" stroke="#000" strokeWidth="2" />
      
      {/* Front wheel */}
      <Circle cx="95" cy="280" r="28" stroke="#000" strokeWidth="3" fill="none" />
      <Circle cx="95" cy="280" r="18" stroke="#000" strokeWidth="1.5" fill="none" />
      
      {/* Rear wheel */}
      <Circle cx="185" cy="280" r="28" stroke="#000" strokeWidth="3" fill="none" />
      <Circle cx="185" cy="280" r="18" stroke="#000" strokeWidth="1.5" fill="none" />
      
      {/* Front bumper detail */}
      <Ellipse cx="65" cy="270" rx="8" ry="12" stroke="#000" strokeWidth="1.5" fill="none" />
      
      {/* Rear bumper detail */}
      <Ellipse cx="215" cy="270" rx="8" ry="12" stroke="#000" strokeWidth="1.5" fill="none" />
    </G>
  );
}

// Old RightView function - no longer needed  
function RightView_OLD() {
  return (
    <G>
      {/* Car body outline - side profile (mirrored) */}
      <Path
        d="M 240 140 L 230 120 L 200 110 L 160 105 L 120 110 L 90 120 L 80 140 L 75 200 L 80 260 L 90 280 L 120 290 L 160 295 L 200 290 L 230 280 L 240 260 Z"
        stroke="#000"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Windows (mirrored) */}
      {/* Windshield */}
      <Path
        d="M 228 125 L 205 115 L 205 150 L 225 150 Z"
        stroke="#000"
        strokeWidth="1.5"
        fill="none"
      />
      
      {/* Front door window */}
      <Rect
        x="165"
        y="115"
        width="35"
        height="35"
        stroke="#000"
        strokeWidth="1.5"
        fill="none"
      />
      
      {/* Rear door window */}
      <Rect
        x="125"
        y="115"
        width="35"
        height="35"
        stroke="#000"
        strokeWidth="1.5"
        fill="none"
      />
      
      {/* Rear windshield */}
      <Path
        d="M 120 115 L 95 125 L 95 150 L 120 150 Z"
        stroke="#000"
        strokeWidth="1.5"
        fill="none"
      />
      
      {/* Door separations */}
      <Line x1="200" y1="150" x2="200" y2="270" stroke="#000" strokeWidth="2" />
      <Line x1="165" y1="150" x2="165" y2="270" stroke="#000" strokeWidth="2" />
      <Line x1="160" y1="150" x2="160" y2="270" stroke="#000" strokeWidth="2" />
      <Line x1="125" y1="150" x2="125" y2="270" stroke="#000" strokeWidth="2" />
      
      {/* Door handles */}
      <Line x1="185" y1="200" x2="175" y2="200" stroke="#000" strokeWidth="2" />
      <Line x1="145" y1="200" x2="135" y2="200" stroke="#000" strokeWidth="2" />
      
      {/* Side mirror */}
      <Ellipse cx="215" cy="145" rx="8" ry="12" stroke="#000" strokeWidth="2" fill="none" />
      <Line x1="210" y1="145" x2="205" y2="145" stroke="#000" strokeWidth="2" />
      
      {/* Front wheel */}
      <Circle cx="205" cy="280" r="28" stroke="#000" strokeWidth="3" fill="none" />
      <Circle cx="205" cy="280" r="18" stroke="#000" strokeWidth="1.5" fill="none" />
      
      {/* Rear wheel */}
      <Circle cx="115" cy="280" r="28" stroke="#000" strokeWidth="3" fill="none" />
      <Circle cx="115" cy="280" r="18" stroke="#000" strokeWidth="1.5" fill="none" />
      
      {/* Front bumper detail */}
      <Ellipse cx="235" cy="270" rx="8" ry="12" stroke="#000" strokeWidth="1.5" fill="none" />
      
      {/* Rear bumper detail */}
      <Ellipse cx="85" cy="270" rx="8" ry="12" stroke="#000" strokeWidth="1.5" fill="none" />
    </G>
  );
}
