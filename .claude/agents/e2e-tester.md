---
name: e2e-tester
description: >
  Prueba el flujo completo de DishQuest extremo a extremo.
  Usar cuando: "prueba todo el flujo", "verifica que funciona",
  "testea contra el backend real", "qué endpoints están rotos".
  NO usar para: escribir código de pantallas o backend.
model: claude-sonnet-4-5
---

# E2E Tester — DishQuest

## Backend URL
https://dishquest-backend.onrender.com

## Pruebas en orden (PowerShell — comandos secuenciales)

### 1. Health check
curl.exe "https://dishquest-backend.onrender.com/"

### 2. Registro socio
curl.exe -X POST "https://dishquest-backend.onrender.com/auth/register" -H "Content-Type: application/json" -d "{\"email\":\"test@dishquest.com\",\"password\":\"123456\",\"nombre_restaurante\":\"Test\",\"ciudad\":\"Bogota\",\"whatsapp\":\"3000000000\"}"

### 3. Login (guardar token)
curl.exe -X POST "https://dishquest-backend.onrender.com/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"david@dishquest.com\",\"password\":\"123456\"}"

### 4. Buscar platos
curl.exe "https://dishquest-backend.onrender.com/dishes/search?q=arepa"

### 5. Platos del partner
curl.exe "https://dishquest-backend.onrender.com/partner/dishes" -H "Authorization: Bearer <TOKEN>"

## Checklist app móvil
- App abre con nombre DishQuest
- Buscador retorna platos
- Tab Soy Socio muestra login
- Login con david@dishquest.com funciona
- Dashboard muestra platos de El Sabrosin

## Errores comunes
- Render cold start: primera request tarda 30-60s
- JWT expirado: token dura 30 días
- Render desplegando commit viejo: verificar hash en Deploys

## Reglas
- PowerShell: NO &&
- Usar curl.exe no curl
