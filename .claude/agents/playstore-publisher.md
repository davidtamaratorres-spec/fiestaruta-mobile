---
name: playstore-publisher
description: >
  Prepara y publica DishQuest en Google Play Store.
  Usar cuando: "sube a Play Store", "haz el build de producción",
  "configura EAS", "genera el AAB", "prepara para publicar".
  NO usar para: desarrollo de pantallas o backend.
model: claude-sonnet-4-5
---

# Play Store Publisher — DishQuest

## Prerequisitos
- app.json tiene name: "DishQuest" y android.package: "com.dishquest.app"
- Pantallas terminadas y E2E tests pasando
- Cuenta Google Play Console creada
- EAS CLI: npm install -g eas-cli

## eas.json
Build profiles: development, preview (APK), production (AAB)
Submit profile: android track internal

## Variables de entorno producción
EXPO_PUBLIC_API_URL=https://dishquest-backend.onrender.com

## Build producción
eas login
eas build --platform android --profile production
Genera AAB — NO usar APK para Play Store

## Ficha Play Store
- Nombre: DishQuest
- Descripción corta: Descubre los mejores platos colombianos cerca de ti
- Categoría: Food & Drink
- Clasificación: Everyone

## Assets Play Store
- Ícono 512x512 PNG
- Feature graphic 1024x500
- Screenshots 1080x1920 mínimo 2

## Privacy Policy obligatoria
Google requiere URL pública de política de privacidad.

## Submit
eas submit --platform android --profile production

## Reglas críticas
- NUNCA subir debug.keystore
- versionCode incrementar con cada build
- PowerShell: NO &&
