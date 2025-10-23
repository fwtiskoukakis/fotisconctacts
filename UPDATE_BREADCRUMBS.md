# ✅ Global Breadcrumb Update Guide

## 🎨 New Breadcrumb Component

All pages now use the beautiful `<Breadcrumb />` component!

### Usage Pattern:

```typescript
import { Breadcrumb } from '../components/breadcrumb'; // or ../../components/breadcrumb

// In render:
<Breadcrumb 
  items={[
    { label: 'Αρχική', path: '/', icon: 'home' },
    { label: 'Συμβόλαια', path: '/contracts' },
    { label: 'Λεπτομέρειες' }, // Current page (no path)
  ]}
/>
```

### Features:
- ✅ Icons (optional, especially for home)
- ✅ Clickable links with hover effects
- ✅ Modern visual design with backgrounds
- ✅ Consistent styling across all pages
- ✅ Auto-separation with chevron icons

---

## 📂 Pages to Update

### Already Updated:
✅ `app/(tabs)/profile.tsx` - Uses new component

### Need to Update:

#### 1. **app/contract-details.tsx**
```typescript
// OLD:
<View style={s.breadcrumb}>
  <TouchableOpacity onPress={() => router.push('/')} style={s.breadcrumbItem}>
    <Ionicons name="home" size={14} color={Colors.primary} />
    <Text style={s.breadcrumbText}>Αρχική</Text>
  </TouchableOpacity>
  <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
  <TouchableOpacity onPress={() => router.push('/contracts')} style={s.breadcrumbItem}>
    <Text style={s.breadcrumbText}>Συμβόλαια</Text>
  </TouchableOpacity>
  <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
  <Text style={s.breadcrumbCurrent}>#{contract.id.slice(0, 8)}</Text>
</View>

// NEW:
<Breadcrumb 
  items={[
    { label: 'Αρχική', path: '/', icon: 'home' },
    { label: 'Συμβόλαια', path: '/contracts' },
    { label: `#${contract.id.slice(0, 8)}` },
  ]}
/>
```

#### 2. **app/(tabs)/contracts.tsx**
```typescript
<Breadcrumb 
  items={[
    { label: 'Αρχική', path: '/', icon: 'home' },
    { label: 'Συμβόλαια' },
  ]}
/>
```

#### 3. **app/(tabs)/cars.tsx**
```typescript
<Breadcrumb 
  items={[
    { label: 'Αρχική', path: '/', icon: 'home' },
    { label: 'Αυτοκίνητα' },
  ]}
/>
```

#### 4. **app/car-details.tsx**
```typescript
<Breadcrumb 
  items={[
    { label: 'Αρχική', path: '/', icon: 'home' },
    { label: 'Αυτοκίνητα', path: '/cars' },
    { label: car.licensePlate },
  ]}
/>
```

#### 5. **app/damage-details.tsx**
```typescript
<Breadcrumb 
  items={[
    { label: 'Αρχική', path: '/', icon: 'home' },
    { label: 'Ζημιές', path: '/damage-report' },
    { label: 'Λεπτομέρειες' },
  ]}
/>
```

#### 6. **app/(tabs)/damage-report.tsx**
```typescript
<Breadcrumb 
  items={[
    { label: 'Αρχική', path: '/', icon: 'home' },
    { label: 'Ζημιές' },
  ]}
/>
```

#### 7. **app/(tabs)/analytics.tsx**
```typescript
<Breadcrumb 
  items={[
    { label: 'Αρχική', path: '/', icon: 'home' },
    { label: 'Αναλυτικά' },
  ]}
/>
```

#### 8. **app/(tabs)/calendar.tsx**
```typescript
<Breadcrumb 
  items={[
    { label: 'Αρχική', path: '/', icon: 'home' },
    { label: 'Ημερολόγιο' },
  ]}
/>
```

#### 9. **app/notifications.tsx**
```typescript
<Breadcrumb 
  items={[
    { label: 'Αρχική', path: '/', icon: 'home' },
    { label: 'Ειδοποιήσεις' },
  ]}
/>
```

---

## 🔧 Steps for Each File:

### 1. Add Import
```typescript
import { Breadcrumb } from '../components/breadcrumb';
// or
import { Breadcrumb } from '../../components/breadcrumb';
```

### 2. Replace Inline Breadcrumb
Replace the entire `<View style={styles.breadcrumb}>...</View>` block with the new `<Breadcrumb />` component.

### 3. Remove Old Styles
Delete these style definitions:
- `breadcrumb`
- `breadcrumbItem`
- `breadcrumbText`
- `breadcrumbCurrent`

---

## 🎨 Visual Improvements

### Before (OLD):
```
Home › Συμβόλαια › Details
```
- Plain text
- Basic styling
- Inconsistent across pages

### After (NEW):
```
[🏠 Home] → [Συμβόλαια] → [Details]
```
- Colored backgrounds
- Rounded corners
- Icons
- Hover effects
- Consistent everywhere!

---

## ✅ Benefits

1. **Consistency** - Same look across all pages
2. **Maintainability** - Update once, applies everywhere
3. **Better UX** - Clear visual hierarchy
4. **Modern Design** - Professional appearance
5. **Icon Support** - Visual context

---

## 📝 Pattern to Follow

**For LIST pages (no parent):**
```typescript
<Breadcrumb 
  items={[
    { label: 'Αρχική', path: '/', icon: 'home' },
    { label: 'Current Page' },
  ]}
/>
```

**For DETAIL pages (has parent list):**
```typescript
<Breadcrumb 
  items={[
    { label: 'Αρχική', path: '/', icon: 'home' },
    { label: 'Parent Page', path: '/parent' },
    { label: 'Current Item' },
  ]}
/>
```

**For NESTED pages (multiple levels):**
```typescript
<Breadcrumb 
  items={[
    { label: 'Αρχική', path: '/', icon: 'home' },
    { label: 'Level 1', path: '/level1' },
    { label: 'Level 2', path: '/level2' },
    { label: 'Current' },
  ]}
/>
```

---

## 🚀 Ready to Use!

The component is ready and working in `/profile`. Just follow the patterns above for all other pages!

**Status:** ✅ Component Created, Profile Updated, Ready to Roll Out Globally!

