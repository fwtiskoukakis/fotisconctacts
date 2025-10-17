import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, ScrollView } from 'react-native';
import Svg, { Path, Circle, Rect, Ellipse, Line, G } from 'react-native-svg';
import { DamagePoint } from '../models/contract.interface';

interface CarDiagramProps {
  onAddDamage: (x: number, y: number, view: 'front' | 'rear' | 'left' | 'right') => void;
  damagePoints: DamagePoint[];
  isEditable?: boolean;
}

type CarView = 'front' | 'rear' | 'left' | 'right';

/**
 * Interactive car diagram component with 4 separate views
 * Front, Rear, Left Side, and Right Side views
 */
export function CarDiagram({ onAddDamage, damagePoints, isEditable = true }: CarDiagramProps) {
  const [currentView, setCurrentView] = useState<CarView>('front');
  const { width } = Dimensions.get('window');
  const diagramWidth = width - 40;
  const diagramHeight = diagramWidth * 1.2;

  function handlePress(event: any) {
    if (!isEditable) return;
    
    const { locationX, locationY } = event.nativeEvent;
    const xPercent = (locationX / diagramWidth) * 100;
    const yPercent = (locationY / diagramHeight) * 100;
    
    onAddDamage(xPercent, yPercent, currentView);
  }

  // Filter damage points for current view
  const currentViewDamages = damagePoints.filter(d => d.view === currentView);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>6. Κατάσταση Οχήματος</Text>
      
      {/* View selector buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.viewButton, currentView === 'front' && styles.activeButton]}
          onPress={() => setCurrentView('front')}
        >
          <Text style={[styles.buttonText, currentView === 'front' && styles.activeButtonText]}>
            Μπροστά
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.viewButton, currentView === 'rear' && styles.activeButton]}
          onPress={() => setCurrentView('rear')}
        >
          <Text style={[styles.buttonText, currentView === 'rear' && styles.activeButtonText]}>
            Πίσω
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.viewButton, currentView === 'left' && styles.activeButton]}
          onPress={() => setCurrentView('left')}
        >
          <Text style={[styles.buttonText, currentView === 'left' && styles.activeButtonText]}>
            Αριστερά
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.viewButton, currentView === 'right' && styles.activeButton]}
          onPress={() => setCurrentView('right')}
        >
          <Text style={[styles.buttonText, currentView === 'right' && styles.activeButtonText]}>
            Δεξιά
          </Text>
        </TouchableOpacity>
      </View>

      {/* Diagram container */}
      <TouchableOpacity 
        onPress={handlePress} 
        activeOpacity={0.9}
        disabled={!isEditable}
        style={styles.diagramContainer}
      >
        <Svg width={diagramWidth} height={diagramHeight} viewBox="0 0 300 360">
          {currentView === 'front' && <FrontView />}
          {currentView === 'rear' && <RearView />}
          {currentView === 'left' && <LeftView />}
          {currentView === 'right' && <RightView />}
          
          {/* Damage markers for current view */}
          {currentViewDamages.map((damage) => (
            <Circle
              key={damage.id}
              cx={(damage.x / 100) * 300}
              cy={(damage.y / 100) * 360}
              r="8"
              fill="#FF0000"
              stroke="#8B0000"
              strokeWidth="2"
              opacity={0.85}
            />
          ))}
        </Svg>
      </TouchableOpacity>
      
      <Text style={styles.hint}>
        Πατήστε στο όχημα για να σημειώσετε ζημιές
      </Text>
    </View>
  );
}

// Front view of the car
function FrontView() {
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

// Rear view of the car
function RearView() {
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

// Left side view of the car
function LeftView() {
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

// Right side view of the car (mirror of left)
function RightView() {
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
    fontWeight: '600',
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
  },
  hint: {
    marginTop: 15,
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
