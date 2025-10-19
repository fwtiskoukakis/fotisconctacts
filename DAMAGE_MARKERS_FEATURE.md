# Damage Markers Enhancement

## Overview
Enhanced the vehicle damage marking system with multiple marker types and undo functionality.

## Features Added

### 1. **Multiple Damage Marker Types**
Users can now select from 4 different marker types to indicate different kinds of damage:

- **Γρατζουνιά (Slight Scratch)** - Thin line `━`
- **Βαθιά (Heavy Scratch)** - Thick line `━━`
- **Λαμαρίνα (Bent)** - Square `□`
- **Σπασμένο (Broken/Missing)** - X mark `✗`

### 2. **Undo Functionality**
- Added "Αναίρεση" (Undo) button that removes the last damage marker
- Button appears only when there are damage points to undo
- Orange colored button for visibility

### 3. **Precise Touch Positioning**
- Fixed touch coordinates to account for image padding and centering
- Markers now appear exactly where the user taps
- Works with different vehicle types (Car, Scooter, ATV)

## Technical Changes

### Files Modified

#### 1. `models/contract.interface.ts`
- Added `DamageMarkerType` type: `'slight-scratch' | 'heavy-scratch' | 'bent' | 'broken'`
- Updated `DamagePoint` interface to include `markerType: DamageMarkerType`

#### 2. `components/car-diagram.tsx`
- Added marker type selection UI with visual icons
- Implemented `renderDamageMarker()` function to render different SVG shapes
- Added `onRemoveLastDamage` callback prop
- Improved touch positioning with image layout tracking
- New styles for marker buttons and undo button

#### 3. `app/new-contract.tsx`
- Updated `handleAddDamage()` to accept `markerType` parameter
- Added `handleRemoveLastDamage()` function
- Updated `CarDiagram` component call with new props
- Added `DamageMarkerType` import

#### 4. `app/edit-contract.tsx`
- Updated `handleAddDamage()` to accept `markerType` parameter
- Added `handleRemoveLastDamage()` function
- Updated `CarDiagram` component call with new props
- Added `DamageMarkerType` import

#### 5. `services/pdf-generation.service.ts`
- Updated PDF generation to display marker type labels in Greek
- Shows readable damage descriptions in exported PDFs

#### 6. `app/contract-details.tsx`
- Updated damage display to show marker type labels
- Better damage information presentation

## UI Components

### Marker Type Selector
```
Τύπος Ζημιάς:
[━ Γρατζουνιά] [━━ Βαθιά] [□ Λαμαρίνα] [✗ Σπασμένο]
```

### Undo Button
```
[↶ Αναίρεση]
```
- Appears below the vehicle diagram
- Only visible when damage points exist
- Orange background (#FF9500)

## Visual Markers

### Slight Scratch (━)
- Thin horizontal line (1.5px stroke)
- Red color (#FF0000)

### Heavy Scratch (━━)
- Thick horizontal line (3.5px stroke)
- Red color (#FF0000)

### Bent (□)
- Square outline (14x14px)
- 2px stroke
- Red color (#FF0000)

### Broken (✗)
- X mark (diagonal lines)
- 2.5px stroke
- Red color (#FF0000)

## Backward Compatibility

- Existing contracts without `markerType` field will display as "Ζημιά" (generic damage)
- PDF generation handles missing `markerType` gracefully
- Contract details page handles missing `markerType` gracefully

## Usage

1. **Select Vehicle Type**: Choose between ΑΜΑΞΙ, SCOOTER, or ATV
2. **Select Damage Type**: Click on one of the 4 damage type buttons
3. **Mark Damage**: Tap on the vehicle diagram where the damage is located
4. **Undo if Needed**: Click the "Αναίρεση" button to remove the last marker
5. **Repeat**: Continue marking all damages with appropriate types

## Testing

Test the following scenarios:
- [ ] Mark damages with all 4 marker types
- [ ] Verify markers appear at exact touch location
- [ ] Test undo functionality
- [ ] Switch between vehicle types
- [ ] Save contract and verify markers persist
- [ ] Export PDF and verify damage types are labeled
- [ ] View contract details and verify damage types display correctly
- [ ] Edit existing contract and add more damages

## Known Limitations

- Markers use a single view ('front') for all vehicle types
- No ability to remove specific damage markers (only last one)
- No ability to edit existing damage markers after placement

## Future Enhancements

- Add ability to tap on markers to edit/remove them
- Support for multiple views (front, rear, left, right)
- Custom damage descriptions per marker
- Photo attachment per damage point
- Color coding by severity

