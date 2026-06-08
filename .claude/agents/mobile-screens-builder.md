---
name: mobile-screens-builder
description: >
  Construye y reemplaza todas las pantallas de DishQuest Mobile.
  Usar cuando: "construye la pantalla de inicio", "crea el home de platos",
  "reemplaza el código de FestQuest", "haz las pantallas de DishQuest".
  NO usar para: backend, base de datos, EAS builds.
model: claude-sonnet-4-5
---

# Mobile Screens Builder — DishQuest

## Contexto
- App: Expo/React Native con expo-router en D:\DishQuest-Mobile
- Backend live: https://dishquest-backend.onrender.com
- La carpeta app/(tabs)/ contiene código de FestQuest que debe ser REEMPLAZADO
- Backup en D:\DishQuest-Mobile-BACKUP-20260530 — NO modificar

## Pantallas a construir

### 1. app/(tabs)/index.tsx — HomeScreen
- Buscador: input de texto + filtro por departamento colombiano
- Lista de platos: foto, nombre, precio, restaurante, ciudad
- Pull-to-refresh
- Llamar: GET /dishes/search?q=arepas&ciudad=Sincelejo

### 2. app/dish/[id].tsx — DishDetail
- Foto grande del plato
- Nombre, descripción, precio
- Nombre del restaurante y ciudad
- Botón WhatsApp si hay número

### 3. app/restaurant/[id].tsx — RestaurantProfile
- Nombre, ciudad, descripción del restaurante
- Lista de platos del restaurante
- Promociones activas

### 4. app/(tabs)/partner.tsx — PartnerAccess
- Formulario login email + password
- Link a registro nuevo socio
- Guardar token JWT en SecureStore
- Redirigir a partner-dashboard

### 5. app/partner-dashboard.tsx — PartnerDashboard
- Nombre del restaurante logueado
- Lista de platos con Editar/Eliminar
- Botón Agregar plato
- Header Authorization: Bearer <token>

## Servicios disponibles (NO reescribir)
- app/services/api.ts
- app/services/AuthService.ts
- app/services/backendApi.ts

## Colores DishQuest
- Primario: #E8521A (naranja)
- Fondo: #FFF8F0 (crema)
- Texto: #1A1A1A

## Reglas
- TypeScript estricto
- expo-router para navegación
- StyleSheet.create para estilos
- ActivityIndicator para loading
- Errores visibles al usuario
- PowerShell: comandos secuenciales, NO &&
