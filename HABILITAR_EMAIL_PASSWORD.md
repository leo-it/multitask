# Habilitar Email/Password en Firebase

Si recibes el error `PASSWORD_LOGIN_DISABLED`, significa que el método de autenticación con email y contraseña no está habilitado en Firebase Console.

## Pasos para Habilitar Email/Password

1. **Ve a Firebase Console**
   - Abre [https://console.firebase.google.com](https://console.firebase.google.com)
   - Selecciona tu proyecto: `multitask-f44a8`

2. **Navega a Authentication**
   - En el menú lateral izquierdo, haz clic en **"Authentication"** (Autenticación)
   - O ve directamente a: [https://console.firebase.google.com/project/multitask-f44a8/authentication](https://console.firebase.google.com/project/multitask-f44a8/authentication)

3. **Ve a la pestaña "Sign-in method"**
   - Haz clic en la pestaña **"Sign-in method"** (Método de inicio de sesión) en la parte superior

4. **Habilita Email/Password**
   - Busca **"Email/Password"** en la lista de proveedores
   - Haz clic en **"Email/Password"**
   - Activa el toggle **"Enable"** (Habilitar)
   - Opcionalmente, puedes habilitar también **"Email link (passwordless sign-in)"** si lo deseas
   - Haz clic en **"Save"** (Guardar)

5. **Verifica que esté habilitado**
   - Deberías ver que **"Email/Password"** aparece como **"Enabled"** (Habilitado) en la lista

## Configuración Recomendada

Para esta aplicación, te recomendamos:

- ✅ **Email/Password**: Habilitado
- ✅ **Email link (passwordless sign-in)**: Opcional (no necesario para esta app)
- ✅ **Email verification**: Habilitado (ya debería estar habilitado por defecto)

## Después de Habilitar

Una vez que hayas habilitado Email/Password:

1. Espera unos segundos para que los cambios se propaguen
2. Intenta registrar un nuevo usuario nuevamente
3. Deberías recibir el correo de verificación en tu email

## Nota Importante

Si el usuario ya fue creado (aunque no recibiste el correo), es posible que necesites:

1. Verificar manualmente el email del usuario en Firebase Console
2. O eliminar el usuario y crearlo nuevamente después de habilitar Email/Password

Para verificar/eliminar usuarios:
- Ve a **Authentication** > **Users** en Firebase Console
- Busca el usuario por email
- Puedes hacer clic en el usuario para ver sus detalles
- Puedes hacer clic en los tres puntos (⋮) para eliminar el usuario si es necesario
