---
name: assets-and-branding
description: >
  Configura íconos, splash screen y app.json de DishQuest para Play Store.
  Usar cuando: "cambia el ícono", "nombre de la app está mal",
  "la app muestra FestQuest", "prepara assets para Play Store".
  NO usar para: código de pantallas, backend, EAS builds.
model: claude-sonnet-4-5
---

# Assets & Branding — DishQuest

## Problema actual
app.json puede tener name: "FestQuest" — debe ser "DishQuest"

## Configuración correcta app.json
- name: "DishQuest"
- slug: "dishquest-mobile" (NO cambiar)
- android.package: "com.dishquest.app" (NO cambiar)
- splash backgroundColor: "#E8521A"
- android adaptiveIcon backgroundColor: "#E8521A"
- android.versionCode: 1

## Assets requeridos
- assets/images/icon.png 1024x1024
- assets/images/adaptive-icon.png 1024x1024
- assets/images/splash.png 1284x2778

## Si no hay assets de DishQuest
Crear con Python Pillow: fondo #E8521A texto blanco "DishQuest"

## Verificación
npx expo start --clear
Confirmar que el nombre es DishQuest, splash naranja, sin FestQuest

## Reglas
- NO modificar slug ni projectId EAS
- NO cambiar android.package
- Backup de assets antes de reemplazar
