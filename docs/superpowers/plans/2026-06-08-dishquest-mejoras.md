# DishQuest Mejoras 1-4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 4 improvements to DishQuest Mobile: predictive city filter, full visual redesign with LinearGradient, AI menu upload from camera, and a reusable photo editor with rotate/crop.

**Architecture:** All screens share a single color palette (#E8521A primary, #FFF8F0 bg, #2D8C4E green). The PhotoEditor component is a self-contained modal used by add-dish and edit-dish. The AI menu feature lives in partner-dashboard as a modal flow. FiltersBar gets a predictive dropdown replacing the existing Modal-based city picker.

**Tech Stack:** Expo 54, expo-router 6, expo-linear-gradient (new), expo-image-picker (existing), expo-image-manipulator (existing), @expo/vector-icons Feather (existing), AsyncStorage, Anthropic Messages API.

---

## Palette constants (used in every task)

```ts
// Reference — not a file, just constants repeated per task
const C = {
  primary:   '#E8521A',
  green:     '#2D8C4E',
  bg:        '#FFF8F0',
  card:      '#FFFFFF',
  text:      '#1A1A1A',
  secondary: '#666666',
  border:    '#EDE0D6',
};
```

---

## Task 1 — Install expo-linear-gradient + create placeholder tab

**Files:**
- Modify: `package.json` (via npx expo install)
- Create: `app/(tabs)/favoritos.tsx`

- [ ] **Step 1: Install expo-linear-gradient**

```powershell
cd "d:\DishQuest-Mobile"
npx expo install expo-linear-gradient
```

Expected output: `+ expo-linear-gradient@X.X.X`

- [ ] **Step 2: Create favoritos.tsx placeholder**

```tsx
// app/(tabs)/favoritos.tsx
import { StyleSheet, Text, View } from 'react-native';

export default function FavoritosScreen() {
  return (
    <View style={s.root}>
      <Text style={s.icon}>❤️</Text>
      <Text style={s.title}>Favoritos</Text>
      <Text style={s.sub}>Próximamente — guarda tus platos favoritos</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#FFF8F0', alignItems: 'center', justifyContent: 'center', gap: 8 },
  icon:  { fontSize: 48 },
  title: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  sub:   { fontSize: 13, color: '#666', textAlign: 'center', paddingHorizontal: 32 },
});
```

---

## Task 2 — FiltersBar predictive city (MEJORA 1)

**Files:**
- Modify: `components/FiltersBar.tsx`

Replace the Modal city-picker with an inline predictive dropdown. The component keeps the same Props interface so `index.tsx` doesn't change its call site.

Static city list (hardcoded in component — not fetched from backend):
```
['Bogotá','Medellín','Cali','Barranquilla','Cartagena',
 'Bucaramanga','Pereira','Manizales','Santa Marta','Cúcuta',
 'Ibagué','Sincelejo','Montería','Valledupar','Pasto',
 'Neiva','Armenia','Villavicencio','Popayán','Tunja']
```

- [ ] **Step 1: Rewrite FiltersBar.tsx**

```tsx
// components/FiltersBar.tsx
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const CITIES = [
  'Bogotá','Medellín','Cali','Barranquilla','Cartagena',
  'Bucaramanga','Pereira','Manizales','Santa Marta','Cúcuta',
  'Ibagué','Sincelejo','Montería','Valledupar','Pasto',
  'Neiva','Armenia','Villavicencio','Popayán','Tunja',
];

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  city: string | null;
  onCityChange: (city: string | null) => void;
  onlyDiscounts: boolean;
  onToggleDiscounts: () => void;
  cities: string[];       // kept for interface compat, unused
  isSearching?: boolean;
};

export function FiltersBar({
  query, onQueryChange,
  city, onCityChange,
  onlyDiscounts, onToggleDiscounts,
  isSearching = false,
}: Props) {
  const [cityInput, setCityInput] = useState(city ?? '');
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = useMemo(() => {
    const q = cityInput.trim().toLowerCase();
    if (!q) return CITIES;
    return CITIES.filter(c => c.toLowerCase().includes(q));
  }, [cityInput]);

  function selectCity(c: string) {
    setCityInput(c);
    onCityChange(c);
    setShowDropdown(false);
  }

  function clearCity() {
    setCityInput('');
    onCityChange(null);
    setShowDropdown(false);
  }

  return (
    <View style={s.container}>
      {/* Dish search */}
      <View style={s.searchRow}>
        <TextInput
          placeholder="¿Qué plato estás buscando?"
          placeholderTextColor="#999"
          value={query}
          onChangeText={onQueryChange}
          style={s.searchInput}
          returnKeyType="search"
        />
        {isSearching && <ActivityIndicator size="small" color="#E8521A" style={s.spinner} />}
      </View>

      {/* City predictive row */}
      <View style={s.cityRow}>
        <View style={s.cityInputWrapper}>
          <Text style={s.pin}>📍</Text>
          <TextInput
            placeholder="Ciudad..."
            placeholderTextColor="#999"
            value={cityInput}
            onChangeText={t => { setCityInput(t); setShowDropdown(true); if (!t) onCityChange(null); }}
            onFocus={() => setShowDropdown(true)}
            style={s.cityInput}
          />
          {cityInput.length > 0 && (
            <Pressable onPress={clearCity} hitSlop={10}>
              <Text style={s.clearBtn}>✕</Text>
            </Pressable>
          )}
        </View>

        <Pressable
          style={[s.discountBtn, onlyDiscounts && s.discountActive]}
          onPress={onToggleDiscounts}
        >
          <Text style={onlyDiscounts ? s.discountTextActive : s.discountText}>
            💸 Desc.
          </Text>
        </Pressable>
      </View>

      {/* Predictive dropdown */}
      {showDropdown && filtered.length > 0 && (
        <View style={s.dropdown}>
          <FlatList
            data={filtered}
            keyExtractor={c => c}
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 200 }}
            renderItem={({ item: c }) => (
              <Pressable style={s.dropItem} onPress={() => selectCity(c)}>
                <Text style={s.dropText}>{c}</Text>
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { gap: 8, marginBottom: 12, zIndex: 10 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#EDE0D6',
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#1A1A1A' },
  spinner: { marginRight: 4 },
  cityRow: { flexDirection: 'row', gap: 8 },
  cityInputWrapper: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#EDE0D6',
    paddingHorizontal: 12,
  },
  pin: { fontSize: 14, marginRight: 6 },
  cityInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#1A1A1A' },
  clearBtn: { fontSize: 14, color: '#999', paddingLeft: 8 },
  discountBtn: {
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 12, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#EDE0D6',
    justifyContent: 'center',
  },
  discountActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  discountText: { fontSize: 13, color: '#1A1A1A', fontWeight: '500' },
  discountTextActive: { fontSize: 13, color: '#fff', fontWeight: '700' },
  dropdown: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#EDE0D6',
    overflow: 'hidden', zIndex: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  dropItem: { paddingVertical: 12, paddingHorizontal: 16 },
  dropText: { fontSize: 14, color: '#1A1A1A' },
});
```

---

## Task 3 — index.tsx visual redesign (MEJORA 2)

**Files:**
- Modify: `app/(tabs)/index.tsx`

Adds LinearGradient header, redesigns cards with elevation-3 shadow, adds Tendencia/Nuevo badges, WhatsApp button, and placeholder avatar when no image.

- [ ] **Step 1: Rewrite app/(tabs)/index.tsx**

Replace the entire file with this content:

```tsx
// app/(tabs)/index.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Image, Keyboard,
  KeyboardAvoidingView, Linking, Platform, Pressable,
  StyleSheet, Text, TouchableWithoutFeedback, View,
} from 'react-native';

import { FiltersBar } from '../../components/FiltersBar';
import { getPublicDishes } from '../services/publicDishes';
import { BackendDish, fetchBackendDishes, searchBackendDishes } from '../services/backendDishes';
import { BackendPromotion, fetchBackendPromotions } from '../services/backendPromotions';
import { BackendRestaurant, fetchBackendRestaurants } from '../services/backendRestaurants';
import { logDemand } from '../services/demand';

type DishItem = {
  dishId: string;
  name: string;
  price: number;
  restaurantId: string;
  restaurantName: string;
  city: string;
  hasDiscount: boolean;
  tieneDescuento: boolean;
  porcentajeDescuento: number;
  aceptaDomicilio: boolean;
  aceptaReserva: boolean;
  imageUrl?: string;
  imageUri?: string;
  whatsapp?: string;
  vistas?: number;
  createdAt?: string;
  source: 'backend' | 'local';
};

const PLACEHOLDER_IMG = require('../../assets/images/dish-placeholder.png');
const DISH_IMAGES: Record<string, any> = {
  'ajiaco.jpg': require('../../assets/images/dishes/ajiaco.jpg'),
  'arroz-con-camarones.jpg': require('../../assets/images/dishes/arroz-con-camarones.jpg'),
  'bandeja-paisa.jpg': require('../../assets/images/dishes/bandeja-paisa.jpg'),
  'bowl-vegano-energetico.jpg': require('../../assets/images/dishes/bowl-vegano-energetico.jpg'),
  'burrito-mixto.jpg': require('../../assets/images/dishes/burrito-mixto.jpg'),
  'cafe-especial.jpg': require('../../assets/images/dishes/cafe-especial.jpg'),
  'cazuela-mariscos.jpg': require('../../assets/images/dishes/cazuela-mariscos.jpg'),
  'chorizo-artesanal.jpg': require('../../assets/images/dishes/chorizo-artesanal.jpg'),
  'churrasco-parrilla.jpg': require('../../assets/images/dishes/churrasco-parrilla.jpg'),
  'costillas-bbq.jpg': require('../../assets/images/dishes/costillas-bbq.jpg'),
  'desayuno-campesino.jpg': require('../../assets/images/dishes/desayuno-campesino.jpg'),
  'hamburguesa-artesanal.jpg': require('../../assets/images/dishes/hamburguesa-artesanal.jpg'),
  'hamburguesa-clasica.jpg': require('../../assets/images/dishes/hamburguesa-clasica.jpg'),
  'hamburguesa-doble.jpg': require('../../assets/images/dishes/hamburguesa-doble.jpg'),
  'hamburguesa-vegana.jpg': require('../../assets/images/dishes/hamburguesa-vegana.jpg'),
  'lasana-vegana.jpg': require('../../assets/images/dishes/lasana-vegana.jpg'),
  'mojarra-frita.jpg': require('../../assets/images/dishes/mojarra-frita.jpg'),
  'mondongo.jpg': require('../../assets/images/dishes/mondongo.jpg'),
  'mote-de-queso.jpg': require('../../assets/images/dishes/mote-de-queso.jpg'),
  'papas-artesanales.jpg': require('../../assets/images/dishes/papas-artesanales.jpg'),
  'pargo-rojo-frito.jpg': require('../../assets/images/dishes/pargo-rojo-frito.jpg'),
  'pasta-carbonara.jpg': require('../../assets/images/dishes/pasta-carbonara.jpg'),
  'perro-caliente-especial.jpg': require('../../assets/images/dishes/perro-caliente-especial.jpg'),
  'pizza-margarita.jpg': require('../../assets/images/dishes/pizza-margarita.jpg'),
  'punta-de-anca.jpg': require('../../assets/images/dishes/punta-de-anca.jpg'),
  'smoothie-antioxidante.jpg': require('../../assets/images/dishes/smoothie-antioxidante.jpg'),
  'tacos-al-pastor.jpg': require('../../assets/images/dishes/tacos-al-pastor.jpg'),
  'wrap-vegetal.jpg': require('../../assets/images/dishes/wrap-vegetal.jpg'),
};

function norm(s: string) {
  return s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function guessFilename(name: string): string | null {
  const n = norm(name);
  if (n.includes('churrasco')) return 'churrasco-parrilla.jpg';
  if (n.includes('chorizo')) return 'chorizo-artesanal.jpg';
  if (n.includes('bandeja')) return 'bandeja-paisa.jpg';
  if (n.includes('ajiaco')) return 'ajiaco.jpg';
  if (n.includes('mondongo')) return 'mondongo.jpg';
  if (n.includes('mote')) return 'mote-de-queso.jpg';
  if (n.includes('carbonara')) return 'pasta-carbonara.jpg';
  if (n.includes('pizza')) return 'pizza-margarita.jpg';
  if (n.includes('hamburguesa') && n.includes('doble')) return 'hamburguesa-doble.jpg';
  if (n.includes('hamburguesa') && n.includes('vegana')) return 'hamburguesa-vegana.jpg';
  if (n.includes('hamburguesa') && n.includes('artesanal')) return 'hamburguesa-artesanal.jpg';
  if (n.includes('hamburguesa')) return 'hamburguesa-clasica.jpg';
  if (n.includes('lasa')) return 'lasana-vegana.jpg';
  if (n.includes('mojarra')) return 'mojarra-frita.jpg';
  if (n.includes('pargo')) return 'pargo-rojo-frito.jpg';
  if (n.includes('cazuela')) return 'cazuela-mariscos.jpg';
  if (n.includes('desayuno')) return 'desayuno-campesino.jpg';
  if (n.includes('smoothie')) return 'smoothie-antioxidante.jpg';
  if (n.includes('wrap')) return 'wrap-vegetal.jpg';
  if (n.includes('papas')) return 'papas-artesanales.jpg';
  if (n.includes('tacos')) return 'tacos-al-pastor.jpg';
  if (n.includes('burrito')) return 'burrito-mixto.jpg';
  return null;
}

function pickImageSource(item: DishItem) {
  if (item.imageUri) return { uri: item.imageUri };
  if (item.imageUrl?.startsWith('http')) return { uri: item.imageUrl };
  if (item.imageUrl?.trim()) {
    const filename = item.imageUrl.trim().split('/').pop() ?? '';
    if (DISH_IMAGES[filename]) return DISH_IMAGES[filename];
  }
  const guessed = guessFilename(item.name);
  return (guessed && DISH_IMAGES[guessed]) ? DISH_IMAGES[guessed] : null;
}

function isNew(createdAt: string | undefined): boolean {
  if (!createdAt) return false;
  return (Date.now() - new Date(createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
}

function buildRestaurantMap(restaurants: BackendRestaurant[]) {
  const map = new Map<number, string>();
  for (const r of restaurants) map.set(Number(r.id), r.nombre ?? `Restaurante #${r.id}`);
  return map;
}

function buildDiscountSet(promotions: BackendPromotion[]) {
  const set = new Set<number>();
  for (const p of promotions) {
    const rid = Number(p.restaurante_id);
    if (Number.isNaN(rid)) continue;
    const active = p.activa === 1 || p.disponible === 1 || (p.activa === undefined && p.disponible === undefined);
    if (active) set.add(rid);
  }
  return set;
}

function dishToItem(d: BackendDish, rmap: Map<number, string>, discountSet: Set<number>): DishItem {
  const rid = Number(d.restaurante_id);
  const tieneDescuento = Boolean(d.tiene_descuento);
  return {
    dishId: String(d.id),
    name: d.nombre,
    price: d.precio,
    restaurantId: String(rid),
    restaurantName: rmap.get(rid) ?? d.restaurante ?? `Restaurante #${d.restaurante_id}`,
    city: d.municipio || d.ciudad || '',
    hasDiscount: discountSet.has(rid) || tieneDescuento,
    tieneDescuento,
    porcentajeDescuento: Number(d.porcentaje_descuento) || 0,
    aceptaDomicilio: Boolean(d.acepta_domicilio),
    aceptaReserva: Boolean(d.acepta_reserva),
    imageUrl: d.imagen_url ?? '',
    whatsapp: d.whatsapp,
    source: 'backend',
  };
}

function DishCard({ item, onPress }: { item: DishItem; onPress: () => void }) {
  const imgSource = pickImageSource(item);
  const initial = item.name.charAt(0).toUpperCase();
  const trending = (item.vistas ?? 0) > 5;
  const fresh = isNew(item.createdAt);

  return (
    <Pressable style={s.card} onPress={onPress}>
      {/* Image / placeholder */}
      {imgSource ? (
        <Image source={imgSource} style={s.thumb} />
      ) : (
        <LinearGradient colors={['#E8521A', '#C43E0E']} style={s.thumb}>
          <Text style={s.thumbInitial}>{initial}</Text>
        </LinearGradient>
      )}

      {/* Body */}
      <View style={s.cardBody}>
        <View style={s.nameRow}>
          <Text style={s.name} numberOfLines={1}>{item.name}</Text>
          <View style={s.badges}>
            {trending && <View style={s.badgeTrend}><Text style={s.badgeText}>Tendencia</Text></View>}
            {fresh    && <View style={s.badgeNew}><Text style={s.badgeText}>Nuevo</Text></View>}
            {item.tieneDescuento && (
              <View style={s.badgeDiscount}>
                <Text style={s.badgeText}>
                  {item.porcentajeDescuento > 0 ? `${item.porcentajeDescuento}% OFF` : 'PROMO'}
                </Text>
              </View>
            )}
          </View>
        </View>

        <Text style={s.restaurant} numberOfLines={1}>{item.restaurantName}</Text>
        <Text style={s.city} numberOfLines={1}>📍 {item.city}</Text>

        <View style={s.bottomRow}>
          <Text style={s.price}>${item.price.toLocaleString('es-CO')}</Text>
          {item.whatsapp && (
            <Pressable
              style={s.waBtn}
              onPress={e => {
                e.stopPropagation();
                const clean = item.whatsapp!.replace(/\D/g, '');
                Linking.openURL(`https://wa.me/${clean}?text=${encodeURIComponent('Hola, vi tu plato ' + item.name + ' en DishQuest')}`).catch(() =>
                  Alert.alert('Error', 'No se pudo abrir WhatsApp.')
                );
              }}
            >
              <Text style={s.waBtnText}>💬 WA</Text>
            </Pressable>
          )}
        </View>

        {(item.aceptaDomicilio || item.aceptaReserva) && (
          <View style={s.actionsRow}>
            {item.aceptaDomicilio && (
              <View style={s.tagDomicilio}><Text style={s.tagText}>🛵 Domicilio</Text></View>
            )}
            {item.aceptaReserva && (
              <View style={s.tagReserva}><Text style={s.tagText}>📅 Reserva</Text></View>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [city, setCity] = useState<string | null>(null);
  const [onlyDiscounts, setOnlyDiscounts] = useState(false);
  const [items, setItems] = useState<DishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchResults, setSearchResults] = useState<DishItem[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rmapRef = useRef<Map<number, string>>(new Map());
  const discountSetRef = useRef<Set<number>>(new Set());

  async function loadData(mode: 'initial' | 'refresh') {
    if (mode === 'initial') setLoading(true);
    else setRefreshing(true);
    try {
      const [dishes, restaurants, promotions, localDishes] = await Promise.all([
        fetchBackendDishes(), fetchBackendRestaurants(),
        fetchBackendPromotions(), getPublicDishes(),
      ]);
      const rmap = buildRestaurantMap(restaurants);
      const discountSet = buildDiscountSet(promotions);
      rmapRef.current = rmap;
      discountSetRef.current = discountSet;
      const backendItems = (dishes as BackendDish[]).map(d => dishToItem(d, rmap, discountSet));
      const localItems: DishItem[] = localDishes.filter((d: any) => d.available !== false).map((d: any) => ({
        dishId: `local-${d.id}`, name: d.name, price: Number(d.price) || 0,
        restaurantId: String(d.restaurantId), restaurantName: d.restaurantName || 'Restaurante local',
        city: d.city || '', hasDiscount: Boolean(d.promo), tieneDescuento: false,
        porcentajeDescuento: 0, aceptaDomicilio: false, aceptaReserva: false,
        imageUri: d.imageUri, source: 'local' as const,
      }));
      setItems([...localItems, ...backendItems]);
    } catch {
      if (mode === 'initial') setItems([]);
    } finally {
      if (mode === 'initial') setLoading(false);
      else setRefreshing(false);
    }
  }

  useEffect(() => { loadData('initial'); }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) { if (debounceRef.current) clearTimeout(debounceRef.current); setSearchResults(null); setIsSearching(false); return; }
    setIsSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchBackendDishes(q);
        const mapped = results.map(d => dishToItem(d, rmapRef.current, discountSetRef.current));
        setSearchResults(mapped);
        if (mapped.length === 0) logDemand(q, city);
      } catch { setSearchResults([]); }
      finally { setIsSearching(false); }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const filteredItems = useMemo(() => {
    const base = searchResults !== null ? searchResults : items;
    const c = city ? norm(city) : null;
    return base
      .filter(i => (c ? norm(i.city) === c : true))
      .filter(i => (onlyDiscounts ? i.hasDiscount : true));
  }, [items, searchResults, city, onlyDiscounts]);

  const hasActiveFilters = query.length > 0 || !!city || onlyDiscounts;

  function clearFilters() {
    setQuery(''); setCity(null); setOnlyDiscounts(false);
    setSearchResults(null); Keyboard.dismiss();
  }

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color="#E8521A" />
        <Text style={s.loadingText}>Cargando platos...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1, backgroundColor: '#FFF8F0' }}>
          {/* Gradient header */}
          <LinearGradient colors={['#E8521A', '#C43E0E']} style={s.header}>
            <Text style={s.headerTitle}>DishQuest</Text>
            <Text style={s.headerSub}>Encuentra el plato que tienes antojo</Text>
          </LinearGradient>

          <View style={s.body}>
            <FiltersBar
              query={query} onQueryChange={setQuery}
              city={city} onCityChange={setCity}
              onlyDiscounts={onlyDiscounts} onToggleDiscounts={() => setOnlyDiscounts(v => !v)}
              cities={[]} isSearching={isSearching}
            />

            {hasActiveFilters && (
              <View style={s.activeBar}>
                <Text style={s.activeText}>
                  {query ? `"${query}"` : ''}
                  {city ? ` · ${city}` : ''}
                  {onlyDiscounts ? ' · Descuento' : ''}
                  {searchResults !== null ? ` · ${filteredItems.length} resultado${filteredItems.length !== 1 ? 's' : ''}` : ''}
                </Text>
                <Pressable onPress={clearFilters}>
                  <Text style={s.clearText}>Limpiar</Text>
                </Pressable>
              </View>
            )}

            <FlatList
              data={filteredItems}
              keyExtractor={item => item.dishId}
              refreshing={refreshing}
              onRefresh={() => loadData('refresh')}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 24, gap: 12 }}
              renderItem={({ item }) => (
                <DishCard item={item} onPress={() => {
                  if (item.source === 'backend') router.push(`/dish/${item.dishId}`);
                  else Alert.alert('Plato local', 'El detalle público estará disponible pronto.');
                }} />
              )}
              ListEmptyComponent={
                <Text style={s.empty}>
                  {isSearching ? 'Buscando...' : 'No hay resultados.'}
                </Text>
              }
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8F0', gap: 10 },
  loadingText: { color: '#666' },
  header: { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  body: { flex: 1, padding: 16 },
  activeBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', padding: 10, borderRadius: 10, marginBottom: 10,
    borderWidth: 1, borderColor: '#EDE0D6',
  },
  activeText: { fontSize: 12, color: '#333', flex: 1 },
  clearText: { fontSize: 12, fontWeight: '600', color: '#E8521A' },
  card: {
    flexDirection: 'row', gap: 12, padding: 12, borderRadius: 14,
    backgroundColor: '#fff', elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.09, shadowRadius: 6,
  },
  thumb: {
    width: 85, height: 85, borderRadius: 12, backgroundColor: '#EDE0D6',
    justifyContent: 'center', alignItems: 'center',
  },
  thumbInitial: { fontSize: 32, color: '#fff', fontWeight: '700' },
  cardBody: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 2 },
  name: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', flex: 1 },
  badges: { flexDirection: 'row', gap: 4, flexShrink: 0, flexWrap: 'wrap' },
  badgeTrend: { backgroundColor: '#E8521A', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3 },
  badgeNew:   { backgroundColor: '#2D8C4E', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3 },
  badgeDiscount: { backgroundColor: '#E8521A', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  restaurant: { fontSize: 12, color: '#666', marginBottom: 2 },
  city: { fontSize: 12, color: '#666', marginBottom: 6 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 15, fontWeight: '700', color: '#E8521A' },
  waBtn: {
    backgroundColor: '#2D8C4E', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  waBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  tagDomicilio: { backgroundColor: '#FFF0E8', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagReserva:   { backgroundColor: '#F0F8FF', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11, color: '#444' },
  empty: { textAlign: 'center', marginTop: 30, color: '#666' },
});
```

---

## Task 4 — _layout.tsx: 4 tabs (MEJORA 2)

**Files:**
- Modify: `app/(tabs)/_layout.tsx`

Adds Favoritos tab, uses Feather icons, `headerShown: false` everywhere.

- [ ] **Step 1: Rewrite _layout.tsx**

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import React from 'react';
import { Feather } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#E8521A',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#EDE0D6' },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Buscar',
          tabBarIcon: ({ color, size }) => <Feather name="search" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarLabel: 'Cerca',
          tabBarIcon: ({ color, size }) => <Feather name="map-pin" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="favoritos"
        options={{
          tabBarLabel: 'Favoritos',
          tabBarIcon: ({ color, size }) => <Feather name="heart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

---

## Task 5 — explore.tsx: Pantalla "Cerca" (MEJORA 2)

**Files:**
- Modify: `app/(tabs)/explore.tsx`

Shows all restaurants grouped by city. Each restaurant card has name, city, dish count, and optional WhatsApp button.

- [ ] **Step 1: Rewrite explore.tsx**

```tsx
// app/(tabs)/explore.tsx
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Linking, Pressable,
  SectionList, StyleSheet, Text, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { backendGet } from '../services/backendApi';
import { BackendDish } from '../services/backendDishes';
import { BackendRestaurant } from '../services/backendRestaurants';

type RestaurantWithCount = BackendRestaurant & { dishCount: number };
type Section = { title: string; data: RestaurantWithCount[] };

function openWhatsApp(whatsapp: string, restaurantName: string) {
  const clean = whatsapp.replace(/\D/g, '');
  Linking.openURL(`https://wa.me/${clean}?text=${encodeURIComponent('Hola, te encontré en DishQuest — ' + restaurantName)}`).catch(() =>
    Alert.alert('Error', 'No se pudo abrir WhatsApp.')
  );
}

export default function CercaScreen() {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [restaurants, dishes] = await Promise.all([
          backendGet<BackendRestaurant[]>('/restaurants'),
          backendGet<BackendDish[]>('/dishes'),
        ]);
        // Count dishes per restaurant
        const countMap = new Map<number, number>();
        for (const d of dishes) {
          const rid = Number(d.restaurante_id);
          countMap.set(rid, (countMap.get(rid) ?? 0) + 1);
        }
        // Group by city
        const cityMap = new Map<string, RestaurantWithCount[]>();
        for (const r of restaurants) {
          const city = r.ciudad ?? 'Otra ciudad';
          const entry: RestaurantWithCount = { ...r, dishCount: countMap.get(Number(r.id)) ?? 0 };
          const list = cityMap.get(city) ?? [];
          list.push(entry);
          cityMap.set(city, list);
        }
        const built: Section[] = Array.from(cityMap.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([title, data]) => ({ title, data }));
        if (active) setSections(built);
      } catch { /* show empty */ }
      finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#E8521A" />
        <Text style={s.muted}>Cargando restaurantes...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF8F0' }}>
      <LinearGradient colors={['#E8521A', '#C43E0E']} style={s.header}>
        <Text style={s.headerTitle}>Cerca de ti</Text>
        <Text style={s.headerSub}>Restaurantes en Colombia</Text>
      </LinearGradient>

      <SectionList
        sections={sections}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 0, paddingBottom: 30 }}
        stickySectionHeadersEnabled
        renderSectionHeader={({ section }) => (
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>📍 {section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable style={s.card} onPress={() => router.push(`/restaurant/${item.id}`)}>
            <View style={s.avatarCircle}>
              <Text style={s.avatarText}>{item.nombre.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={s.cardBody}>
              <Text style={s.cardName}>{item.nombre}</Text>
              <Text style={s.cardCity}>{item.ciudad}</Text>
              <Text style={s.cardCount}>{item.dishCount} plato{item.dishCount !== 1 ? 's' : ''}</Text>
            </View>
            {item.whatsapp ? (
              <Pressable style={s.waBtn} onPress={() => openWhatsApp(item.whatsapp!, item.nombre)}>
                <Text style={s.waBtnText}>💬</Text>
              </Pressable>
            ) : null}
          </Pressable>
        )}
        ListEmptyComponent={<Text style={s.empty}>No se encontraron restaurantes.</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  muted: { color: '#666' },
  header: { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  sectionHeader: { backgroundColor: '#FFF8F0', paddingVertical: 8, paddingHorizontal: 0 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#E8521A', textTransform: 'uppercase', letterSpacing: 0.8 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    marginBottom: 10, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4,
  },
  avatarCircle: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#E8521A', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 20, color: '#fff', fontWeight: '700' },
  cardBody: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  cardCity: { fontSize: 12, color: '#666', marginTop: 1 },
  cardCount: { fontSize: 12, color: '#E8521A', fontWeight: '600', marginTop: 2 },
  waBtn: { backgroundColor: '#2D8C4E', borderRadius: 10, width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
  waBtnText: { fontSize: 18 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
});
```

---

## Task 6 — perfil.tsx: pantalla auth-aware (MEJORA 2)

**Files:**
- Modify: `app/(tabs)/perfil.tsx`

Shows login form inline if not authenticated; shows restaurant info with panel/logout if authenticated. Reads `partner_token` from AsyncStorage.

- [ ] **Step 1: Rewrite perfil.tsx**

```tsx
// app/(tabs)/perfil.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';

import { authService } from '../partner/services/AuthService';
import { backendGet } from '../services/backendApi';

type Restaurante = { id: number; nombre: string; ciudad: string };

export default function PerfilScreen() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [checking, setChecking] = useState(true);

  // Login form state
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  useFocusEffect(
    useCallback(() => {
      async function check() {
        setChecking(true);
        const token = await AsyncStorage.getItem('partner_token');
        if (!token) { setLoggedIn(false); setRestaurante(null); setChecking(false); return; }
        try {
          const rest = await backendGet<Restaurante>('/partner/me');
          setRestaurante(rest);
          setLoggedIn(true);
        } catch {
          setLoggedIn(false); setRestaurante(null);
        } finally { setChecking(false); }
      }
      check();
    }, [])
  );

  async function handleLogin() {
    setLoginError('');
    if (!email.trim() || !password.trim()) { setLoginError('Ingresa email y contraseña.'); return; }
    setLoggingIn(true);
    try {
      await authService.login(email.trim(), password);
      setShowLogin(false);
      setEmail(''); setPassword('');
      // Reload restaurant info
      const rest = await backendGet<Restaurante>('/partner/me');
      setRestaurante(rest);
      setLoggedIn(true);
    } catch (e: any) {
      setLoginError(e.message || 'Credenciales incorrectas.');
    } finally { setLoggingIn(false); }
  }

  async function handleLogout() {
    await authService.logout();
    setLoggedIn(false); setRestaurante(null);
  }

  if (checking) {
    return <View style={s.center}><ActivityIndicator size="large" color="#E8521A" /></View>;
  }

  // --- LOGGED IN ---
  if (loggedIn && restaurante) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFF8F0' }}>
        <LinearGradient colors={['#E8521A', '#C43E0E']} style={s.header}>
          <Text style={s.headerTitle}>{restaurante.nombre}</Text>
          <Text style={s.headerSub}>📍 {restaurante.ciudad}</Text>
        </LinearGradient>
        <View style={s.loggedBody}>
          <Pressable style={s.primaryBtn} onPress={() => router.push('/partner-dashboard')}>
            <Text style={s.primaryBtnText}>Mi panel</Text>
          </Pressable>
          <Pressable style={s.logoutBtn} onPress={handleLogout}>
            <Text style={s.logoutBtnText}>Cerrar sesión</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // --- NOT LOGGED IN ---
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.guestContainer} keyboardShouldPersistTaps="handled">
        <Text style={s.bigEmoji}>🍽️</Text>
        <Text style={s.guestTitle}>¿Tenés un restaurante en Colombia?</Text>
        <Text style={s.guestSub}>Registra tu negocio y aparece en DishQuest gratis.</Text>

        <Pressable style={s.primaryBtn} onPress={() => router.push('/partner/auth')}>
          <Text style={s.primaryBtnText}>Registrar mi restaurante</Text>
        </Pressable>

        <Pressable style={s.outlineBtn} onPress={() => setShowLogin(v => !v)}>
          <Text style={s.outlineBtnText}>Ya soy socio — Entrar</Text>
        </Pressable>

        {showLogin && (
          <View style={s.loginBox}>
            {loginError ? <Text style={s.errorText}>{loginError}</Text> : null}
            <TextInput
              style={s.input} placeholder="Correo electrónico" placeholderTextColor="#999"
              autoCapitalize="none" keyboardType="email-address"
              value={email} onChangeText={setEmail}
            />
            <TextInput
              style={s.input} placeholder="Contraseña" placeholderTextColor="#999"
              secureTextEntry value={password} onChangeText={setPassword}
            />
            <Pressable style={[s.primaryBtn, loggingIn && { opacity: 0.6 }]} onPress={handleLogin} disabled={loggingIn}>
              {loggingIn ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Entrar</Text>}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  loggedBody: { padding: 24, gap: 12 },
  guestContainer: { padding: 28, alignItems: 'center', gap: 14, paddingTop: 80 },
  bigEmoji: { fontSize: 64 },
  guestTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', textAlign: 'center' },
  guestSub: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
  primaryBtn: { backgroundColor: '#E8521A', borderRadius: 12, paddingVertical: 14, alignItems: 'center', width: '100%' },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  outlineBtn: { borderWidth: 1.5, borderColor: '#E8521A', borderRadius: 12, paddingVertical: 14, alignItems: 'center', width: '100%', backgroundColor: 'transparent' },
  outlineBtnText: { color: '#E8521A', fontWeight: '700', fontSize: 15 },
  logoutBtn: { borderWidth: 1.5, borderColor: '#CC2200', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  logoutBtnText: { color: '#CC2200', fontWeight: '700', fontSize: 15 },
  loginBox: { width: '100%', gap: 10, marginTop: 4 },
  input: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#EDE0D6',
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1A1A1A',
  },
  errorText: { color: '#CC2200', fontSize: 13, backgroundColor: '#FFE8E3', borderRadius: 8, padding: 10, textAlign: 'center' },
});
```

---

## Task 7 — dish/[id].tsx hero redesign (MEJORA 2)

**Files:**
- Modify: `app/dish/[id].tsx`

Adds 260px hero image with a LinearGradient overlay at the bottom. Dish name renders in white over the gradient. White card with borderRadius 24 slides up over the photo. Full-width WhatsApp button at bottom.

- [ ] **Step 1: Rewrite app/dish/[id].tsx**

Full replacement (keep all existing logic — only change the render output and styles):

```tsx
// app/dish/[id].tsx
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Linking, Pressable,
  ScrollView, StyleSheet, Text, View,
} from 'react-native';

import { backendGet } from '../services/backendApi';

type DishDetail = {
  id: number; restaurante_id: number; nombre: string;
  descripcion?: string; precio: number; categoria?: string;
  imagen_url?: string; disponible: number;
  tiene_descuento?: number; porcentaje_descuento?: number;
  acepta_domicilio?: number; acepta_reserva?: number;
  restaurante_nombre?: string; ciudad?: string;
  direccion?: string; whatsapp?: string;
  latitud?: number; longitud?: number; restaurante_email?: string;
};

const PLACEHOLDER_IMG = require('../../assets/images/dish-placeholder.png');
const DISH_IMAGES: Record<string, any> = {
  'ajiaco.jpg': require('../../assets/images/dishes/ajiaco.jpg'),
  'arroz-con-camarones.jpg': require('../../assets/images/dishes/arroz-con-camarones.jpg'),
  'bandeja-paisa.jpg': require('../../assets/images/dishes/bandeja-paisa.jpg'),
  'bowl-vegano-energetico.jpg': require('../../assets/images/dishes/bowl-vegano-energetico.jpg'),
  'burrito-mixto.jpg': require('../../assets/images/dishes/burrito-mixto.jpg'),
  'cafe-especial.jpg': require('../../assets/images/dishes/cafe-especial.jpg'),
  'cazuela-mariscos.jpg': require('../../assets/images/dishes/cazuela-mariscos.jpg'),
  'chorizo-artesanal.jpg': require('../../assets/images/dishes/chorizo-artesanal.jpg'),
  'churrasco-parrilla.jpg': require('../../assets/images/dishes/churrasco-parrilla.jpg'),
  'costillas-bbq.jpg': require('../../assets/images/dishes/costillas-bbq.jpg'),
  'desayuno-campesino.jpg': require('../../assets/images/dishes/desayuno-campesino.jpg'),
  'hamburguesa-artesanal.jpg': require('../../assets/images/dishes/hamburguesa-artesanal.jpg'),
  'hamburguesa-clasica.jpg': require('../../assets/images/dishes/hamburguesa-clasica.jpg'),
  'hamburguesa-doble.jpg': require('../../assets/images/dishes/hamburguesa-doble.jpg'),
  'hamburguesa-vegana.jpg': require('../../assets/images/dishes/hamburguesa-vegana.jpg'),
  'lasana-vegana.jpg': require('../../assets/images/dishes/lasana-vegana.jpg'),
  'mojarra-frita.jpg': require('../../assets/images/dishes/mojarra-frita.jpg'),
  'mondongo.jpg': require('../../assets/images/dishes/mondongo.jpg'),
  'mote-de-queso.jpg': require('../../assets/images/dishes/mote-de-queso.jpg'),
  'papas-artesanales.jpg': require('../../assets/images/dishes/papas-artesanales.jpg'),
  'pargo-rojo-frito.jpg': require('../../assets/images/dishes/pargo-rojo-frito.jpg'),
  'pasta-carbonara.jpg': require('../../assets/images/dishes/pasta-carbonara.jpg'),
  'perro-caliente-especial.jpg': require('../../assets/images/dishes/perro-caliente-especial.jpg'),
  'pizza-margarita.jpg': require('../../assets/images/dishes/pizza-margarita.jpg'),
  'punta-de-anca.jpg': require('../../assets/images/dishes/punta-de-anca.jpg'),
  'smoothie-antioxidante.jpg': require('../../assets/images/dishes/smoothie-antioxidante.jpg'),
  'tacos-al-pastor.jpg': require('../../assets/images/dishes/tacos-al-pastor.jpg'),
  'wrap-vegetal.jpg': require('../../assets/images/dishes/wrap-vegetal.jpg'),
};

function norm(s: string) {
  return s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function guessImage(name: string): string | null {
  const n = norm(name);
  if (n.includes('churrasco')) return 'churrasco-parrilla.jpg';
  if (n.includes('chorizo')) return 'chorizo-artesanal.jpg';
  if (n.includes('bandeja')) return 'bandeja-paisa.jpg';
  if (n.includes('ajiaco')) return 'ajiaco.jpg';
  if (n.includes('mondongo')) return 'mondongo.jpg';
  if (n.includes('mote')) return 'mote-de-queso.jpg';
  if (n.includes('carbonara')) return 'pasta-carbonara.jpg';
  if (n.includes('pizza')) return 'pizza-margarita.jpg';
  if (n.includes('hamburguesa') && n.includes('doble')) return 'hamburguesa-doble.jpg';
  if (n.includes('hamburguesa') && n.includes('vegana')) return 'hamburguesa-vegana.jpg';
  if (n.includes('hamburguesa') && n.includes('artesanal')) return 'hamburguesa-artesanal.jpg';
  if (n.includes('hamburguesa')) return 'hamburguesa-clasica.jpg';
  if (n.includes('lasa')) return 'lasana-vegana.jpg';
  if (n.includes('mojarra')) return 'mojarra-frita.jpg';
  if (n.includes('pargo')) return 'pargo-rojo-frito.jpg';
  if (n.includes('cazuela')) return 'cazuela-mariscos.jpg';
  if (n.includes('desayuno')) return 'desayuno-campesino.jpg';
  if (n.includes('smoothie')) return 'smoothie-antioxidante.jpg';
  if (n.includes('wrap')) return 'wrap-vegetal.jpg';
  if (n.includes('papas')) return 'papas-artesanales.jpg';
  if (n.includes('tacos')) return 'tacos-al-pastor.jpg';
  if (n.includes('burrito')) return 'burrito-mixto.jpg';
  return null;
}

function pickImage(imageUrl: string | undefined, name: string) {
  if (imageUrl?.trim()) {
    if (imageUrl.startsWith('http')) return { uri: imageUrl };
    const filename = imageUrl.trim().split('/').pop() ?? '';
    if (DISH_IMAGES[filename]) return DISH_IMAGES[filename];
  }
  const guessed = guessImage(name);
  return (guessed && DISH_IMAGES[guessed]) ? DISH_IMAGES[guessed] : PLACEHOLDER_IMG;
}

function openWhatsApp(whatsapp: string, dishName: string) {
  const clean = whatsapp.replace(/\D/g, '');
  const msg = encodeURIComponent(`Hola, me interesa el plato: ${dishName}`);
  Linking.openURL(`https://wa.me/${clean}?text=${msg}`).catch(() =>
    Alert.alert('Error', 'No se pudo abrir WhatsApp.')
  );
}

function openMaps(lat: number | undefined, lon: number | undefined, address: string, city: string) {
  const url = (lat && lon)
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address} ${city}`.trim())}`;
  Linking.openURL(url).catch(() => Alert.alert('Error', 'No se pudo abrir Google Maps.'));
}

export default function DishDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dish, setDish] = useState<DishDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const idNum = useMemo(() => Number(id), [id]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true); setError(null);
        if (!id || Number.isNaN(idNum)) throw new Error('ID inválido');
        const data = await backendGet<DishDetail>(`/dishes/${idNum}`);
        if (active) setDish(data);
      } catch (e: any) {
        if (active) { setDish(null); setError(e?.message || 'Error cargando detalle'); }
      } finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
  }, [id, idNum]);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#E8521A" />
        <Text style={s.muted}>Cargando plato...</Text>
      </View>
    );
  }

  if (error || !dish) {
    return (
      <View style={s.center}>
        <Text style={s.errorText}>{error || 'Plato no encontrado'}</Text>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const tieneDescuento = Boolean(dish.tiene_descuento);
  const pct = Number(dish.porcentaje_descuento) || 0;
  const precioOriginal = tieneDescuento && pct > 0 ? Math.round(dish.precio / (1 - pct / 100)) : null;
  const imgSource = pickImage(dish.imagen_url, dish.nombre);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF8F0' }}>
      {/* Hero photo with gradient overlay */}
      <View style={s.heroContainer}>
        <Image source={imgSource} style={s.hero} resizeMode="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.72)']}
          style={s.heroGradient}
        />
        <Pressable onPress={() => router.back()} style={s.backRowHero} hitSlop={12}>
          <Text style={s.backTextHero}>← Volver</Text>
        </Pressable>
        <Text style={s.heroName}>{dish.nombre}</Text>
      </View>

      {/* White card lifting over hero */}
      <ScrollView
        style={s.cardScroll}
        contentContainerStyle={s.cardContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Price row */}
        <View style={s.priceRow}>
          <Text style={s.price}>${dish.precio.toLocaleString('es-CO')}</Text>
          {precioOriginal && (
            <Text style={s.priceOld}>${precioOriginal.toLocaleString('es-CO')}</Text>
          )}
          {tieneDescuento && (
            <View style={s.discountBadge}>
              <Text style={s.discountBadgeText}>{pct > 0 ? `${pct}% OFF` : 'PROMO'}</Text>
            </View>
          )}
        </View>

        {dish.categoria ? <Text style={s.categoria}>{dish.categoria}</Text> : null}

        {dish.descripcion?.trim() ? (
          <>
            <Text style={s.sectionTitle}>Descripción</Text>
            <Text style={s.desc}>{dish.descripcion}</Text>
          </>
        ) : null}

        <Text style={s.sectionTitle}>Restaurante</Text>
        <Text style={s.restaurantName}>{dish.restaurante_nombre ?? `Restaurante #${dish.restaurante_id}`}</Text>
        {dish.ciudad ? <Text style={s.infoLine}>📍 {dish.ciudad}</Text> : null}
        {dish.direccion ? <Text style={s.infoLine}>{dish.direccion}</Text> : null}

        {(dish.acepta_domicilio || dish.acepta_reserva) && (
          <View style={s.actionsSection}>
            {dish.acepta_domicilio ? (
              <Pressable
                style={s.actionBtn}
                onPress={() => dish.whatsapp
                  ? openWhatsApp(dish.whatsapp, dish.nombre)
                  : Alert.alert('Sin contacto', 'Sin WhatsApp registrado.')
                }
              >
                <Text style={s.actionBtnText}>🛵 Pedir domicilio</Text>
              </Pressable>
            ) : null}
            {dish.acepta_reserva ? (
              <Pressable
                style={[s.actionBtn, s.reservaBtn]}
                onPress={() => dish.whatsapp
                  ? openWhatsApp(dish.whatsapp, `Reserva: ${dish.nombre}`)
                  : Alert.alert('Sin contacto', 'Sin WhatsApp registrado.')
                }
              >
                <Text style={s.actionBtnText}>📅 Reservar</Text>
              </Pressable>
            ) : null}
            {(dish.latitud || dish.direccion || dish.ciudad) ? (
              <Pressable
                style={[s.actionBtn, s.mapsBtn]}
                onPress={() => openMaps(dish.latitud, dish.longitud, dish.direccion ?? '', dish.ciudad ?? '')}
              >
                <Text style={s.actionBtnText}>📍 Ver en mapa</Text>
              </Pressable>
            ) : null}
          </View>
        )}

        {/* Full-width WhatsApp button */}
        {dish.whatsapp && (
          <Pressable
            style={s.waFullBtn}
            onPress={() => openWhatsApp(dish.whatsapp!, dish.nombre)}
          >
            <Text style={s.waFullBtnText}>💬 Contactar por WhatsApp</Text>
          </Pressable>
        )}

        {!dish.disponible ? (
          <Text style={s.unavailable}>⚠️ Este plato no está disponible actualmente</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: '#FFF8F0' },
  muted: { color: '#666' },
  errorText: { color: '#CC2200', fontWeight: '600', textAlign: 'center' },
  backBtn: { marginTop: 12, backgroundColor: '#E8521A', padding: 14, borderRadius: 10, alignItems: 'center', minWidth: 120 },
  backBtnText: { color: '#fff', fontWeight: '700' },

  heroContainer: { height: 260, position: 'relative' },
  hero: { width: '100%', height: 260 },
  heroGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 140 },
  backRowHero: { position: 'absolute', top: 48, left: 16 },
  backTextHero: { color: '#fff', fontSize: 15, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  heroName: {
    position: 'absolute', bottom: 16, left: 20, right: 20,
    fontSize: 24, fontWeight: '700', color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
  },

  cardScroll: { flex: 1, backgroundColor: '#FFF8F0', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24 },
  cardContent: { padding: 24, paddingBottom: 50 },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  price: { fontSize: 22, fontWeight: '700', color: '#E8521A' },
  priceOld: { fontSize: 15, color: '#aaa', textDecorationLine: 'line-through' },
  discountBadge: { backgroundColor: '#E8521A', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  discountBadgeText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  categoria: { fontSize: 13, color: '#888', marginBottom: 16 },
  sectionTitle: { marginTop: 20, marginBottom: 6, fontSize: 12, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 0.8 },
  desc: { fontSize: 15, color: '#333', lineHeight: 22 },
  restaurantName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  infoLine: { marginTop: 4, fontSize: 14, color: '#555' },

  actionsSection: { marginTop: 20, gap: 10 },
  actionBtn: { minHeight: 52, backgroundColor: '#E8521A', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  reservaBtn: { backgroundColor: '#1A1A1A' },
  mapsBtn: { backgroundColor: '#1a73e8' },

  waFullBtn: { marginTop: 20, backgroundColor: '#2D8C4E', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  waFullBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  unavailable: { marginTop: 16, fontSize: 13, color: '#CC2200', fontWeight: '600' },
});
```

---

## Task 8 — partner-dashboard.tsx: gradient header + metrics + AI menu (MEJORA 2 + 3)

**Files:**
- Modify: `app/partner-dashboard.tsx`
- Create: `.env` (add EXPO_PUBLIC_ANTHROPIC_KEY if not present)

The AI menu feature is a Modal flow. After camera → manipulator → base64 → Claude API → checkbox list → POST /partner/platos.

- [ ] **Step 1: Add env var (if .env doesn't exist)**

Create `.env` at project root:
```
EXPO_PUBLIC_ANTHROPIC_KEY=your_anthropic_key_here
```

- [ ] **Step 2: Rewrite app/partner-dashboard.tsx**

```tsx
// app/partner-dashboard.tsx
import { LinearGradient } from 'expo-linear-gradient';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Modal, Pressable,
  ScrollView, StyleSheet, Text, View,
} from 'react-native';

import { authService } from './partner/services/AuthService';
import { backendDelete, backendGet, backendPost, BASE_URL } from './services/backendApi';

type Restaurante = { id: number; nombre: string; ciudad: string; direccion?: string; whatsapp?: string };
type Plato = {
  id: number; nombre: string; descripcion?: string; precio: number;
  categoria?: string; disponible: number; tiene_descuento?: number; porcentaje_descuento?: number;
};
type DetectedDish = { nombre: string; descripcion: string; precio: number; categoria: string; selected: boolean };

// ── AI Menu helpers ──────────────────────────────────────────────
async function extractDishesFromImage(base64Image: string): Promise<DetectedDish[]> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_KEY;
  if (!apiKey) throw new Error('EXPO_PUBLIC_ANTHROPIC_KEY no está configurada.');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-20250514',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: base64Image },
          },
          {
            type: 'text',
            text: 'Analiza este menú de restaurante colombiano. Extrae cada plato y devuelve SOLO un JSON array con este formato exacto, sin texto adicional: [{"nombre":"nombre del plato","descripcion":"descripcion breve","precio":0,"categoria":"Entradas|Platos fuertes|Bebidas|Postres|Sopas"}]. Si el precio no está claro usa 0.',
          },
        ],
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error API Anthropic: ${response.status}`);
  }

  const data = await response.json();
  const text: string = data.content?.[0]?.text ?? '';
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('No se pudo extraer JSON de la respuesta.');
  const parsed: Omit<DetectedDish, 'selected'>[] = JSON.parse(match[0]);
  return parsed.map(d => ({ ...d, selected: true }));
}

// ── Main component ───────────────────────────────────────────────
export default function PartnerDashboard() {
  const router = useRouter();

  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // AI menu flow state
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiStep, setAiStep] = useState<'idle' | 'processing' | 'review' | 'importing'>('idle');
  const [detectedDishes, setDetectedDishes] = useState<DetectedDish[]>([]);
  const [aiError, setAiError] = useState('');

  useFocusEffect(
    useCallback(() => {
      async function load() {
        setLoading(true);
        const isLogged = await authService.isLoggedIn();
        if (!isLogged) { router.replace('/(tabs)/perfil'); return; }
        try {
          const [rest, dishes] = await Promise.all([
            backendGet<Restaurante>('/partner/me'),
            backendGet<Plato[]>('/partner/platos'),
          ]);
          setRestaurante(rest);
          setPlatos(dishes);
        } catch (e: any) {
          if (e?.message?.includes('401') || e?.message?.includes('Token')) {
            await authService.logout();
            router.replace('/(tabs)/perfil');
          } else {
            Alert.alert('Error', e.message || 'No se pudo cargar la información.');
          }
        } finally { setLoading(false); }
      }
      load();
    }, [router])
  );

  async function handleLogout() {
    await authService.logout();
    router.replace('/(tabs)/perfil');
  }

  function confirmDelete(plato: Plato) {
    Alert.alert('Eliminar plato', `¿Eliminar "${plato.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deletePlato(plato.id) },
    ]);
  }

  async function deletePlato(id: number) {
    setDeletingId(id);
    try {
      await backendDelete(`/partner/platos/${id}`);
      setPlatos(prev => prev.filter(p => p.id !== id));
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo eliminar el plato.');
    } finally { setDeletingId(null); }
  }

  // ── AI Menu flow ─────────────────────────────────────────────
  async function handleAiMenuPress() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara.'); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (result.canceled) return;

    setAiModalVisible(true);
    setAiStep('processing');
    setAiError('');
    setDetectedDishes([]);

    try {
      // Compress/resize before sending to API
      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      const base64Image = manipResult.base64;
      if (!base64Image) throw new Error('No se pudo procesar la imagen.');

      const dishes = await extractDishesFromImage(base64Image);
      setDetectedDishes(dishes);
      setAiStep('review');
    } catch (e: any) {
      setAiError(e.message || 'Error procesando la imagen.');
      setAiStep('idle');
    }
  }

  function toggleDish(index: number) {
    setDetectedDishes(prev => prev.map((d, i) => i === index ? { ...d, selected: !d.selected } : d));
  }

  async function handleImportDishes() {
    const toImport = detectedDishes.filter(d => d.selected);
    if (toImport.length === 0) { Alert.alert('Selecciona al menos un plato.'); return; }
    setAiStep('importing');
    try {
      for (const d of toImport) {
        await backendPost('/partner/platos', {
          nombre: d.nombre,
          descripcion: d.descripcion,
          precio: d.precio,
          categoria: d.categoria || 'General',
          imagen_url: '',
          disponible: 1,
          tiene_descuento: 0,
          porcentaje_descuento: 0,
          acepta_domicilio: 0,
          acepta_reserva: 0,
        });
      }
      // Refresh platos list
      const updated = await backendGet<Plato[]>('/partner/platos');
      setPlatos(updated);
      setAiModalVisible(false);
      setAiStep('idle');
      Alert.alert('¡Listo!', `${toImport.length} plato${toImport.length !== 1 ? 's' : ''} importado${toImport.length !== 1 ? 's' : ''} correctamente.`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudieron importar los platos.');
      setAiStep('review');
    }
  }

  // ── Derived metrics ──────────────────────────────────────────
  const platosActivos = platos.filter(p => p.disponible === 1).length;
  const platosConDescuento = platos.filter(p => p.tiene_descuento === 1).length;

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#E8521A" />
        <Text style={s.loadingText}>Cargando tu restaurante...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={s.root} contentContainerStyle={s.content}>
        {/* Gradient header */}
        <LinearGradient colors={['#E8521A', '#C43E0E']} style={s.header}>
          <View style={s.headerRow}>
            <View>
              <Text style={s.headerLabel}>Panel del socio</Text>
              <Text style={s.headerName}>{restaurante?.nombre ?? 'Mi restaurante'}</Text>
              {restaurante?.ciudad ? <Text style={s.headerCity}>📍 {restaurante.ciudad}</Text> : null}
            </View>
            <Pressable style={s.logoutBtn} onPress={handleLogout}>
              <Text style={s.logoutText}>Salir</Text>
            </Pressable>
          </View>

          {/* Metrics row */}
          <View style={s.metricsRow}>
            <View style={s.metricCard}>
              <Text style={s.metricValue}>—</Text>
              <Text style={s.metricLabel}>Vistas</Text>
            </View>
            <View style={s.metricCard}>
              <Text style={s.metricValue}>{platosActivos}</Text>
              <Text style={s.metricLabel}>Activos</Text>
            </View>
            <View style={s.metricCard}>
              <Text style={s.metricValue}>{platosConDescuento}</Text>
              <Text style={s.metricLabel}>Descuento</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Actions */}
        <View style={s.actionsRow}>
          <Pressable style={s.primaryBtn} onPress={() => router.push('/partner/add-dish')}>
            <Text style={s.primaryBtnText}>+ Agregar plato</Text>
          </Pressable>
          <Pressable style={s.aiBtn} onPress={handleAiMenuPress}>
            <Text style={s.aiBtnText}>📷 Subir menú con IA</Text>
          </Pressable>
          <Pressable style={s.secondaryBtn} onPress={() => router.push('/partner/restaurant-form')}>
            <Text style={s.secondaryBtnText}>Editar restaurante</Text>
          </Pressable>
        </View>

        {/* Dishes */}
        <Text style={s.sectionTitle}>Mis platos ({platos.length})</Text>

        {platos.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>🍽️</Text>
            <Text style={s.emptyText}>Aún no tienes platos. ¡Agrega el primero!</Text>
          </View>
        ) : (
          <FlatList
            data={platos}
            keyExtractor={p => String(p.id)}
            scrollEnabled={false}
            contentContainerStyle={{ gap: 10 }}
            renderItem={({ item }) => (
              <View style={s.platoCard}>
                <View style={s.platoTop}>
                  <View style={s.platoInfo}>
                    <Text style={s.platoNombre}>{item.nombre}</Text>
                    {item.categoria ? <Text style={s.platoCategoria}>{item.categoria}</Text> : null}
                    <Text style={s.platoPrecio}>${item.precio.toLocaleString('es-CO')}</Text>
                    {item.descripcion ? <Text style={s.platoDesc} numberOfLines={2}>{item.descripcion}</Text> : null}
                  </View>
                  <View style={s.statusCol}>
                    {item.disponible === 0
                      ? <View style={s.inactiveBadge}><Text style={s.inactiveText}>Inactivo</Text></View>
                      : <View style={s.activeBadge}><Text style={s.activeText}>Activo</Text></View>
                    }
                    {item.tiene_descuento
                      ? <View style={s.discountBadge}><Text style={s.discountText}>{Number(item.porcentaje_descuento) > 0 ? `${item.porcentaje_descuento}% OFF` : 'PROMO'}</Text></View>
                      : null
                    }
                  </View>
                </View>
                <View style={s.platoActions}>
                  <Pressable
                    style={s.editBtn}
                    onPress={() => router.push({
                      pathname: '/partner/edit-dish',
                      params: {
                        id: String(item.id), nombre: item.nombre,
                        descripcion: item.descripcion ?? '', precio: String(item.precio),
                        categoria: item.categoria ?? '', disponible: String(item.disponible),
                        tiene_descuento: String(item.tiene_descuento ?? 0),
                        porcentaje_descuento: String(item.porcentaje_descuento ?? 0),
                      },
                    })}
                  >
                    <Text style={s.editBtnText}>Editar</Text>
                  </Pressable>
                  <Pressable
                    style={[s.deleteBtn, deletingId === item.id && { opacity: 0.5 }]}
                    onPress={() => confirmDelete(item)}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={s.deleteBtnText}>Eliminar</Text>
                    }
                  </Pressable>
                </View>
              </View>
            )}
          />
        )}
      </ScrollView>

      {/* ── AI Menu Modal ── */}
      <Modal visible={aiModalVisible} animationType="slide" onRequestClose={() => { setAiModalVisible(false); setAiStep('idle'); }}>
        <View style={s.modalRoot}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>📷 Menú con IA</Text>
            <Pressable onPress={() => { setAiModalVisible(false); setAiStep('idle'); }}>
              <Text style={s.modalClose}>✕</Text>
            </Pressable>
          </View>

          {aiStep === 'processing' && (
            <View style={s.aiProcessing}>
              <ActivityIndicator size="large" color="#E8521A" />
              <Text style={s.aiProcessingText}>Analizando menú con IA...</Text>
              <Text style={s.aiProcessingSubText}>Puede tardar 10-30 segundos</Text>
            </View>
          )}

          {aiError ? (
            <View style={s.aiErrorBox}>
              <Text style={s.aiErrorText}>{aiError}</Text>
              <Pressable style={s.primaryBtn} onPress={() => { setAiError(''); setAiModalVisible(false); setAiStep('idle'); }}>
                <Text style={s.primaryBtnText}>Cerrar</Text>
              </Pressable>
            </View>
          ) : null}

          {aiStep === 'review' && (
            <>
              <Text style={s.reviewHint}>Selecciona los platos a importar:</Text>
              <FlatList
                data={detectedDishes}
                keyExtractor={(_, i) => String(i)}
                contentContainerStyle={{ gap: 8, padding: 16 }}
                renderItem={({ item, index }) => (
                  <Pressable
                    style={[s.detectedCard, item.selected && s.detectedCardSelected]}
                    onPress={() => toggleDish(index)}
                  >
                    <View style={s.detectedCheckbox}>
                      {item.selected && <Text style={s.detectedCheck}>✓</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.detectedNombre}>{item.nombre}</Text>
                      <Text style={s.detectedCategoria}>{item.categoria}</Text>
                      {item.descripcion ? <Text style={s.detectedDesc} numberOfLines={2}>{item.descripcion}</Text> : null}
                      <Text style={s.detectedPrecio}>
                        {item.precio > 0 ? `$${item.precio.toLocaleString('es-CO')}` : 'Precio no detectado'}
                      </Text>
                    </View>
                  </Pressable>
                )}
              />
              <View style={s.reviewActions}>
                <Pressable style={s.primaryBtn} onPress={handleImportDishes}>
                  <Text style={s.primaryBtnText}>
                    Importar {detectedDishes.filter(d => d.selected).length} plato{detectedDishes.filter(d => d.selected).length !== 1 ? 's' : ''}
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          {aiStep === 'importing' && (
            <View style={s.aiProcessing}>
              <ActivityIndicator size="large" color="#E8521A" />
              <Text style={s.aiProcessingText}>Importando platos...</Text>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF8F0' },
  content: { paddingBottom: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#666', fontSize: 14 },

  header: { paddingTop: 52, paddingBottom: 0, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 20 },
  headerLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  headerName: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 2 },
  headerCity: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  metricsRow: { flexDirection: 'row', paddingBottom: 20, gap: 10 },
  metricCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 12, padding: 12, alignItems: 'center' },
  metricValue: { fontSize: 22, fontWeight: '700', color: '#fff' },
  metricLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  actionsRow: { padding: 20, gap: 10 },
  primaryBtn: { backgroundColor: '#E8521A', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  aiBtn: { backgroundColor: '#1A1A1A', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  aiBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryBtn: { borderWidth: 1.5, borderColor: '#E8521A', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  secondaryBtnText: { color: '#E8521A', fontWeight: '700', fontSize: 15 },

  sectionTitle: { paddingHorizontal: 20, marginBottom: 10, fontSize: 12, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 0.8 },
  emptyBox: { alignItems: 'center', padding: 30, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center' },

  platoCard: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#EDE0D6', gap: 10 },
  platoTop: { flexDirection: 'row', gap: 10 },
  platoInfo: { flex: 1, gap: 2 },
  platoNombre: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  platoCategoria: { fontSize: 12, color: '#888' },
  platoPrecio: { fontSize: 15, fontWeight: '700', color: '#E8521A', marginTop: 2 },
  platoDesc: { fontSize: 13, color: '#666', lineHeight: 18 },
  statusCol: { gap: 6, alignItems: 'flex-end' },
  activeBadge: { backgroundColor: '#E8F5E9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  activeText: { fontSize: 11, color: '#2E7D32', fontWeight: '600' },
  inactiveBadge: { backgroundColor: '#f0f0f0', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  inactiveText: { fontSize: 11, color: '#999', fontWeight: '600' },
  discountBadge: { backgroundColor: '#FFF0E8', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  discountText: { fontSize: 11, color: '#E8521A', fontWeight: '700' },

  platoActions: { flexDirection: 'row', gap: 10 },
  editBtn: { flex: 1, backgroundColor: '#FFF0E8', borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E8521A' },
  editBtnText: { color: '#E8521A', fontWeight: '700', fontSize: 14 },
  deleteBtn: { flex: 1, backgroundColor: '#CC2200', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  deleteBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Modal
  modalRoot: { flex: 1, backgroundColor: '#FFF8F0' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 52, borderBottomWidth: 1, borderBottomColor: '#EDE0D6' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  modalClose: { fontSize: 20, color: '#666' },
  aiProcessing: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  aiProcessingText: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  aiProcessingSubText: { fontSize: 13, color: '#666' },
  aiErrorBox: { flex: 1, justifyContent: 'center', padding: 24, gap: 16 },
  aiErrorText: { color: '#CC2200', fontSize: 14, textAlign: 'center' },
  reviewHint: { paddingHorizontal: 16, paddingTop: 16, fontSize: 14, color: '#666' },
  detectedCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: '#EDE0D6', flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  detectedCardSelected: { borderColor: '#E8521A' },
  detectedCheckbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#E8521A', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  detectedCheck: { color: '#E8521A', fontWeight: '700', fontSize: 14 },
  detectedNombre: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  detectedCategoria: { fontSize: 12, color: '#E8521A', marginTop: 2 },
  detectedDesc: { fontSize: 13, color: '#666', marginTop: 4, lineHeight: 18 },
  detectedPrecio: { fontSize: 14, fontWeight: '600', color: '#2D8C4E', marginTop: 4 },
  reviewActions: { padding: 16, borderTopWidth: 1, borderTopColor: '#EDE0D6' },
});
```

- [ ] **Step 3: Verify expo-file-system is available**

```powershell
cd "d:\DishQuest-Mobile"
node -e "require('./node_modules/expo-file-system/build/index')" 2>&1
```

If missing: `npx expo install expo-file-system`

---

## Task 9 — PhotoEditor component (MEJORA 4)

**Files:**
- Create: `components/PhotoEditor.tsx`

Reusable full-screen modal. Accepts `uri` and `onConfirm(uri)` / `onCancel()`. Toolbar: Rotar (rotate 90° cumulative), Recortar (toggle crop mode with PanResponder corner handles), Usar foto, Cancelar.

The crop box is represented as `{ x, y, width, height }` in pixels relative to the displayed image. On confirm, `ImageManipulator.manipulateAsync` applies pending rotate + optional crop.

- [ ] **Step 1: Create components/PhotoEditor.tsx**

```tsx
// components/PhotoEditor.tsx
import * as ImageManipulator from 'expo-image-manipulator';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Dimensions, Image, PanResponder,
  Pressable, StyleSheet, Text, View,
} from 'react-native';

const SCREEN = Dimensions.get('window');
const DISPLAY_W = SCREEN.width;
const DISPLAY_H = SCREEN.height * 0.6;
const MIN_CROP = 60;

type CropBox = { x: number; y: number; w: number; h: number };
type Props = {
  uri: string;
  onConfirm: (uri: string) => void;
  onCancel: () => void;
};

type Corner = 'tl' | 'tr' | 'bl' | 'br';

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

export function PhotoEditor({ uri, onConfirm, onCancel }: Props) {
  const [rotation, setRotation] = useState(0);
  const [cropMode, setCropMode] = useState(false);
  const [cropBox, setCropBox] = useState<CropBox>({ x: 40, y: 40, w: DISPLAY_W - 80, h: DISPLAY_H - 80 });
  const [processing, setProcessing] = useState(false);
  const [imgSize, setImgSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    Image.getSize(uri, (w, h) => setImgSize({ width: w, height: h }), () => {});
  }, [uri]);

  // Scale factor: original pixels per display pixel
  const scale = useMemo(() => {
    if (!imgSize) return 1;
    return imgSize.width / DISPLAY_W;
  }, [imgSize]);

  function makePanResponder(corner: Corner) {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => cropMode,
      onPanResponderMove: (_, gs) => {
        setCropBox(prev => {
          let { x, y, w, h } = prev;
          switch (corner) {
            case 'tl':
              x = clamp(prev.x + gs.dx, 0, prev.x + prev.w - MIN_CROP);
              y = clamp(prev.y + gs.dy, 0, prev.y + prev.h - MIN_CROP);
              w = prev.w - (x - prev.x);
              h = prev.h - (y - prev.y);
              break;
            case 'tr':
              y = clamp(prev.y + gs.dy, 0, prev.y + prev.h - MIN_CROP);
              w = clamp(prev.w + gs.dx, MIN_CROP, DISPLAY_W - prev.x);
              h = prev.h - (y - prev.y);
              break;
            case 'bl':
              x = clamp(prev.x + gs.dx, 0, prev.x + prev.w - MIN_CROP);
              w = prev.w - (x - prev.x);
              h = clamp(prev.h + gs.dy, MIN_CROP, DISPLAY_H - prev.y);
              break;
            case 'br':
              w = clamp(prev.w + gs.dx, MIN_CROP, DISPLAY_W - prev.x);
              h = clamp(prev.h + gs.dy, MIN_CROP, DISPLAY_H - prev.y);
              break;
          }
          return { x, y, w, h };
        });
      },
    });
  }

  const panTL = useRef(makePanResponder('tl')).current;
  const panTR = useRef(makePanResponder('tr')).current;
  const panBL = useRef(makePanResponder('bl')).current;
  const panBR = useRef(makePanResponder('br')).current;

  async function handleConfirm() {
    setProcessing(true);
    try {
      const actions: ImageManipulator.Action[] = [];
      if (rotation !== 0) actions.push({ rotate: rotation });
      if (cropMode) {
        actions.push({
          crop: {
            originX: Math.round(cropBox.x * scale),
            originY: Math.round(cropBox.y * scale),
            width: Math.round(cropBox.w * scale),
            height: Math.round(cropBox.h * scale),
          },
        });
      }
      if (actions.length === 0) { onConfirm(uri); return; }
      const result = await ImageManipulator.manipulateAsync(uri, actions, {
        compress: 0.85,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      onConfirm(result.uri);
    } finally { setProcessing(false); }
  }

  return (
    <View style={s.root}>
      {/* Image preview */}
      <View style={s.imageContainer}>
        <Image
          source={{ uri }}
          style={[s.image, { transform: [{ rotate: `${rotation}deg` }] }]}
          resizeMode="contain"
        />

        {/* Crop overlay */}
        {cropMode && (
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {/* Dark overlay */}
            <View style={[s.cropDark, { top: 0, left: 0, right: 0, height: cropBox.y }]} />
            <View style={[s.cropDark, { top: cropBox.y + cropBox.h, left: 0, right: 0, bottom: 0 }]} />
            <View style={[s.cropDark, { top: cropBox.y, left: 0, width: cropBox.x, height: cropBox.h }]} />
            <View style={[s.cropDark, { top: cropBox.y, left: cropBox.x + cropBox.w, right: 0, height: cropBox.h }]} />

            {/* Crop border */}
            <View style={[s.cropBorder, { left: cropBox.x, top: cropBox.y, width: cropBox.w, height: cropBox.h }]}>
              {/* Rule-of-thirds lines */}
              <View style={[s.gridLine, { position: 'absolute', left: '33%', top: 0, bottom: 0, width: 1 }]} />
              <View style={[s.gridLine, { position: 'absolute', left: '66%', top: 0, bottom: 0, width: 1 }]} />
              <View style={[s.gridLine, { position: 'absolute', top: '33%', left: 0, right: 0, height: 1 }]} />
              <View style={[s.gridLine, { position: 'absolute', top: '66%', left: 0, right: 0, height: 1 }]} />
            </View>

            {/* Corner handles */}
            {(['tl', 'tr', 'bl', 'br'] as Corner[]).map(corner => {
              const pan = { tl: panTL, tr: panTR, bl: panBL, br: panBR }[corner];
              const style = {
                tl: { top: cropBox.y - 10, left: cropBox.x - 10 },
                tr: { top: cropBox.y - 10, left: cropBox.x + cropBox.w - 10 },
                bl: { top: cropBox.y + cropBox.h - 10, left: cropBox.x - 10 },
                br: { top: cropBox.y + cropBox.h - 10, left: cropBox.x + cropBox.w - 10 },
              }[corner];
              return (
                <View key={corner} style={[s.handle, style]} {...pan.panHandlers} />
              );
            })}
          </View>
        )}
      </View>

      {/* Toolbar */}
      <View style={s.toolbar}>
        <Pressable style={s.toolBtn} onPress={() => setRotation(r => (r + 90) % 360)}>
          <Text style={s.toolIcon}>↺</Text>
          <Text style={s.toolLabel}>Rotar</Text>
        </Pressable>

        <Pressable style={[s.toolBtn, cropMode && s.toolBtnActive]} onPress={() => setCropMode(v => !v)}>
          <Text style={s.toolIcon}>✂</Text>
          <Text style={s.toolLabel}>Recortar</Text>
        </Pressable>

        <Pressable style={[s.toolBtn, s.toolBtnConfirm]} onPress={handleConfirm} disabled={processing}>
          {processing
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={[s.toolIcon, { color: '#fff' }]}>✓</Text>
          }
          <Text style={[s.toolLabel, { color: '#fff' }]}>Usar foto</Text>
        </Pressable>

        <Pressable style={[s.toolBtn, s.toolBtnCancel]} onPress={onCancel}>
          <Text style={s.toolIcon}>✕</Text>
          <Text style={s.toolLabel}>Cancelar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  imageContainer: { width: DISPLAY_W, height: DISPLAY_H, overflow: 'hidden' },
  image: { width: DISPLAY_W, height: DISPLAY_H },
  cropDark: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.55)' },
  cropBorder: { position: 'absolute', borderWidth: 1.5, borderColor: '#fff' },
  gridLine: { backgroundColor: 'rgba(255,255,255,0.3)' },
  handle: {
    position: 'absolute', width: 22, height: 22,
    backgroundColor: '#fff', borderRadius: 4,
  },
  toolbar: {
    flex: 1, flexDirection: 'row', backgroundColor: '#111',
    alignItems: 'center', justifyContent: 'space-around',
    paddingHorizontal: 12, paddingVertical: 16,
  },
  toolBtn: {
    alignItems: 'center', gap: 4, padding: 10,
    borderRadius: 10, minWidth: 68,
  },
  toolBtnActive: { backgroundColor: '#333' },
  toolBtnConfirm: { backgroundColor: '#2D8C4E' },
  toolBtnCancel: { backgroundColor: '#333' },
  toolIcon: { fontSize: 22, color: '#fff' },
  toolLabel: { fontSize: 11, color: '#ccc' },
});
```

---

## Task 10 — Integrate PhotoEditor in add-dish and edit-dish (MEJORA 4)

**Files:**
- Modify: `app/partner/add-dish.tsx`
- Modify: `app/partner/edit-dish.tsx`

Both screens get a camera button alongside the gallery picker. When a photo is selected/taken, the PhotoEditor component is rendered as a full-screen overlay (using a `Modal`) until the user confirms or cancels.

- [ ] **Step 1: Update add-dish.tsx**

Replace the `pickImage` function and add the PhotoEditor Modal. Changes are minimal — only the image section changes:

```tsx
// app/partner/add-dish.tsx
// Add to imports:
import { Modal } from 'react-native';
import { PhotoEditor } from '../../components/PhotoEditor';

// Add state after existing imageUri state:
const [editingUri, setEditingUri] = useState<string | null>(null);

// Replace pickImage with two functions:
async function pickFromGallery() {
  Keyboard.dismiss();
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) { Alert.alert('Permiso requerido', 'Se necesita permiso para acceder a tus fotos.'); return; }
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
  if (!result.canceled) setEditingUri(result.assets[0].uri);
}

async function pickFromCamera() {
  Keyboard.dismiss();
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) { Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara.'); return; }
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
  if (!result.canceled) setEditingUri(result.assets[0].uri);
}

// Replace the image picker section in JSX with:
<View style={styles.imageRow}>
  <Pressable style={[styles.imagePicker, { flex: 1 }]} onPress={pickFromGallery}>
    <Text style={styles.imagePickerText}>🖼 Galería</Text>
  </Pressable>
  <Pressable style={[styles.imagePicker, { flex: 1 }]} onPress={pickFromCamera}>
    <Text style={styles.imagePickerText}>📷 Cámara</Text>
  </Pressable>
</View>
{imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}

{/* PhotoEditor modal */}
<Modal visible={!!editingUri} animationType="slide">
  {editingUri && (
    <PhotoEditor
      uri={editingUri}
      onConfirm={uri => { setImageUri(uri); setEditingUri(null); }}
      onCancel={() => setEditingUri(null)}
    />
  )}
</Modal>

// Also add to styles:
imageRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
```

- [ ] **Step 2: Update edit-dish.tsx**

Same pattern — add camera + gallery pickers + PhotoEditor modal. Also adds `imageUri` local state (currently the form uses only `imagenUrl` string, so we keep both: picked URI for local preview, and URL for saving).

```tsx
// app/partner/edit-dish.tsx
// Add to imports:
import * as ImagePicker from 'expo-image-picker';
import { Image, Modal } from 'react-native';
import { PhotoEditor } from '../../components/PhotoEditor';

// Add state:
const [imageUri, setImageUri] = useState<string | null>(null);
const [editingUri, setEditingUri] = useState<string | null>(null);

// Add after imagenUrl state initialization to pre-fill if URL is a local URI:
// (No change needed — imagenUrl holds any URL/URI string)

// Add two picker functions (same as add-dish above).

// In handleSave, send imageUri if present, else imagenUrl:
imagen_url: imageUri || imagenUrl.trim(),

// Add image section in JSX (after URL TextInput):
<View style={styles.imageRow}>
  <Pressable style={[styles.imagePicker, { flex: 1 }]} onPress={pickFromGallery}>
    <Text style={styles.imagePickerText}>🖼 Galería</Text>
  </Pressable>
  <Pressable style={[styles.imagePicker, { flex: 1 }]} onPress={pickFromCamera}>
    <Text style={styles.imagePickerText}>📷 Cámara</Text>
  </Pressable>
</View>
{imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}
<Modal visible={!!editingUri} animationType="slide">
  {editingUri && (
    <PhotoEditor
      uri={editingUri}
      onConfirm={uri => { setImageUri(uri); setEditingUri(null); }}
      onCancel={() => setEditingUri(null)}
    />
  )}
</Modal>

// Add to styles:
imageRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
imagePicker: { backgroundColor: '#eee', padding: 14, borderRadius: 10, alignItems: 'center' },
imagePickerText: { fontWeight: '600', color: '#333' },
preview: { width: '100%', height: 180, borderRadius: 10, marginBottom: 16 },
```

---

## Task 11 — Final type check

**Files:** none (verification only)

- [ ] **Step 1: Run TypeScript check**

```powershell
cd "d:\DishQuest-Mobile"
npx tsc --noEmit
```

Expected: no output (exit 0). If errors appear, fix them before proceeding.

- [ ] **Step 2: Verify all new files exist**

```powershell
Get-ChildItem "d:\DishQuest-Mobile\app\(tabs)" -Filter "*.tsx" | Select-Object Name
Get-ChildItem "d:\DishQuest-Mobile\components" -Filter "*.tsx" | Select-Object Name
```

Expected output includes:
- `index.tsx`, `explore.tsx`, `perfil.tsx`, `favoritos.tsx`, `_layout.tsx`
- `FiltersBar.tsx`, `PhotoEditor.tsx`

---

## Self-Review

### Spec coverage
| Requirement | Task |
|---|---|
| Predictive city filter | Task 2 (FiltersBar) + Task 3 (index.tsx uses it) |
| Static city list | Task 2 (CITIES constant) |
| Dropdown closes on select, X clears | Task 2 |
| LinearGradient header index.tsx | Task 3 |
| Tendencia/Nuevo badges | Task 3 (DishCard) |
| WhatsApp button on card | Task 3 (DishCard) |
| Placeholder avatar for no-image | Task 3 (LinearGradient fallback) |
| 4 tabs with Feather icons | Task 4 |
| headerShown: false | Task 4 |
| explore.tsx → Cerca (restaurants by city) | Task 5 |
| perfil.tsx auth-aware | Task 6 |
| dish/[id].tsx hero 260px + gradient | Task 7 |
| partner-dashboard gradient header | Task 8 |
| Metrics row (Vistas/Activos/Descuento) | Task 8 |
| AI menu camera + manipulator + Claude API | Task 8 |
| Checkbox list to select dishes | Task 8 |
| POST /partner/platos for each selected | Task 8 |
| PhotoEditor rotate/crop/PanResponder | Task 9 |
| PhotoEditor in add-dish | Task 10 |
| PhotoEditor in edit-dish | Task 10 |
| npx tsc --noEmit | Task 11 |
| expo-linear-gradient installed first | Task 1 |
| favoritos.tsx placeholder | Task 1 |

### Placeholder scan
None found — all steps contain actual code.

### Type consistency
- `CropBox` type defined in Task 9, used only within `PhotoEditor.tsx` — consistent.
- `DetectedDish` defined and used only within `partner-dashboard.tsx` — consistent.
- `authService.login()` signature: `(email, password) => Promise<boolean>` — matches usage in Task 6 and Task 8.
- `backendGet/backendPost/backendDelete` imported from `./services/backendApi` in dashboard, `../services/backendApi` in tabs — paths correct per file location.
- `FiltersBar` Props interface is backward-compatible (keeps `cities` prop, marks it unused) — no changes needed in index.tsx call site beyond Task 3's full rewrite.
