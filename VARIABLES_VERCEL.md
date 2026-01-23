# Variables de Entorno para Vercel

Esta es la lista completa de variables de entorno que debes configurar en Vercel para que la aplicación funcione correctamente en producción.

## 📋 Variables Requeridas

### 🗄️ Base de Datos (PostgreSQL)

```
DATABASE_URL
```
**Valor:** Tu URL de conexión a Neon PostgreSQL (o tu base de datos PostgreSQL)
**Ejemplo:** `postgresql://usuario:password@ep-xxxxx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

---

### 🔥 Firebase Client (Cliente - Públicas)

Estas variables son públicas y se exponen al navegador (por eso empiezan con `NEXT_PUBLIC_`):

```
NEXT_PUBLIC_FIREBASE_API_KEY
```
**Valor:** `AIzaSyB-S_YqVJielus_RSPXiyUSSOvKJXi3YGs`

```
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
```
**Valor:** `multitask-f44a8.firebaseapp.com`

```
NEXT_PUBLIC_FIREBASE_PROJECT_ID
```
**Valor:** `multitask-f44a8`

```
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
```
**Valor:** `multitask-f44a8.firebasestorage.app`

```
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
```
**Valor:** `847454394674`

```
NEXT_PUBLIC_FIREBASE_APP_ID
```
**Valor:** `1:847454394674:web:e524eabe33dbb3842edf2b`

---

### 🔐 Firebase Admin SDK (Servidor - Privadas)

Estas variables son privadas y solo se usan en el servidor:

```
FIREBASE_PROJECT_ID
```
**Valor:** `multitask-f44a8`

```
FIREBASE_CLIENT_EMAIL
```
**Valor:** `firebase-adminsdk-fbsvc@multitask-f44a8.iam.gserviceaccount.com`

```
FIREBASE_PRIVATE_KEY
```
**Valor:** (El private key completo con los `\n` incluidos)
```
-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3gOWCZn4A9FBr\n9C821ZCYcFUww6k6LEEW57jAVFyneOlBUIkV75vWl29d+28ynBkz0P+FwnTlafD4\nbhW7YfeEWyM6qly6yK5audFUALCBGh++KVZwVW87ywnmKwD5b153zuD4Bzqx0pVM\nk3NrEU1pL7OjEYXRsmK7vi7m9J1hOkZz1TLKp5SZrspnrogwThO/QGukMjV09Eik\nykOhPUd22Be+CL9vol/+sgHUygQElKpyT+NObsG2YjfcCeirNVbO26NPZtAO4jCW\ncnoPU5FoFHr4enI2xxLhLHVk+AX4QuNCxG55fqmCnSNVihkxI4PMJKL/9MwqOBDP\nv3tXP3+3AgMBAAECggEAS32ibXfepGPd5dtpxQQs3RlxYoNLzhvAlzyy26SZDWiH\nhRAtpTGSicB411AF2esvzwpO5GcwEeT4ditLk2/lFLUtlAfb6BeA6uAAxq8V7bai\nkmeNIN90yENqCh9s4jC3y0/3avIGans4Ym1SkRxoHTq7iv09cRwS1CuUPf0p9YIC\nAjdGqhUE04E/cGivclcJSuVl/GV4TBAK6oXL3syZJp9pQGgj+A91E6AabIkMXzjw\nsMkazaMMZpUHii0hrm1NSKyOT82CIfniypYrriKSM8GPhOXmLGs8rMr6SKcadmt/\nh/5yYb0lqZKlN5IextyV+GNIThS23oPrdrsGbuba2QKBgQDpXTGSe40+/3A5Am9n\nmtPJAJoIDqoopRw9/TnkkKsVHlqcdHxfZQekyDuhi4Jr0nZt5XuZ4WyUFLr6QHGz\nGp3c9CbZt1dfYv1UDWQ5wo1gYgHEG/8csa2dCA77j0wNU1qB8DI2VtQURlpTz+Z8\nTEg6hm8YHQMrLHIwyP8HuxrlEwKBgQDJTZXNZfX3+ZNSloj0LLP/bfGXkn+GuaQT\nGZNUgomYMGVnKMH406RlZ2Oy10aeDT7L34s5pbI84l5TbQE3zOVW386AJ5xDlWsu\nxz11cQ2N38f+dc5luabGxn+UXiR+IdYfEePdaqKJZcVj/KOjV2TJqqZytVG68IKa\nEa+Ct60jTQKBgQCh5+uFwryrcZPNqdfbHLtFIGq9nlcGHg+rHm41Gv3niAi7tcG4\neaLE+7sLiHwzDHDoLCgGCjVHw945085Owe+2pZnywVYYMtipoSThQg7OSREKm5Xy\ntX9LjJTAiZntQOBxeFGOC83WRz1SGtLBeDdAi5a2NyLEqHCNUlZGadTuCwKBgQDC\n4JY2Ow/s2TLzEAJTh/dVP0VT/CHy9kLNrsO/W4QCzk9Ml9t4nMMY3AdbeibGGYKC\ncc3hp/QuFuNEFlHIiFY5TP8nd7FCiCM0LPPlfuWlRE/jmn6OYjT/V+joZF8lsHIO\nsA4NKw9gviJikpCEL7XFuavbfoc5115H8vkbLd+yPQKBgEjyabSIGomxnCfW6lS/\nUwv1XR37EzYXSZSDXH3r8XjDwU3WIVeQM0iqLV+CiMadSu1Z+kEPzc4p+WD240bO\nBH45h6t0oGW1HE2aykFKaAtSFBRyh35MX9fvmvp5KNhX9cU3n7PNvnlYY4KJ1cr6\nDhEQJNVXpwhAZ9+MZJEbM9T5\n-----END PRIVATE KEY-----\n
```

**⚠️ IMPORTANTE:** Cuando copies el `FIREBASE_PRIVATE_KEY` en Vercel, asegúrate de incluir los `\n` (saltos de línea escapados). Puedes copiarlo directamente desde tu archivo `.env` local.

---

### ⚙️ Variables Opcionales

```
NOTIFICACIONES_SECRET
```
**Valor:** (Opcional) Un secreto para proteger el endpoint de procesamiento de notificaciones
**Ejemplo:** `secret-para-procesar-notificaciones`

```
NODE_ENV
```
**Valor:** Vercel lo configura automáticamente como `production`, no necesitas agregarlo manualmente.

---

## 📝 Cómo Configurarlas en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **Environment Variables**
4. Agrega cada variable una por una:
   - **Name:** El nombre de la variable (ej: `DATABASE_URL`)
   - **Value:** El valor correspondiente
   - **Environment:** Selecciona `Production`, `Preview`, y `Development` según necesites
5. Haz clic en **Save**
6. Después de agregar todas las variables, **redespliega** tu aplicación para que los cambios surtan efecto

---

## ✅ Checklist

- [ ] `DATABASE_URL` (tu URL de Neon PostgreSQL)
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] `FIREBASE_PROJECT_ID`
- [ ] `FIREBASE_CLIENT_EMAIL`
- [ ] `FIREBASE_PRIVATE_KEY` (con los `\n` incluidos)
- [ ] `NOTIFICACIONES_SECRET` (opcional)

---

## 🔍 Verificación

Después de configurar las variables y redesplegar, verifica que:

1. ✅ La aplicación carga correctamente
2. ✅ Puedes registrarte con un nuevo usuario
3. ✅ Recibes el correo de verificación de Firebase
4. ✅ Puedes iniciar sesión después de verificar tu correo
5. ✅ Las categorías y recordatorios funcionan correctamente

---

## ⚠️ Notas Importantes

- **Nunca** compartas estas variables públicamente
- Las variables que empiezan con `NEXT_PUBLIC_` son visibles en el navegador, pero aún así no deben compartirse públicamente
- El `FIREBASE_PRIVATE_KEY` es especialmente sensible, manténlo seguro
- Si cambias alguna variable, asegúrate de redesplegar la aplicación
