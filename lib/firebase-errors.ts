export function getFirebaseErrorMessage(error: any): string {
  if (!error) {
    return 'Ocurrió un error inesperado. Por favor intenta nuevamente.'
  }

  if (error.error && error.error.message === 'PASSWORD_LOGIN_DISABLED') {
    return 'El método de autenticación con email y contraseña no está habilitado. Por favor habilita "Email/Password" en Firebase Console.'
  }

  if (error.message === 'PASSWORD_LOGIN_DISABLED') {
    return 'El método de autenticación con email y contraseña no está habilitado. Por favor habilita "Email/Password" en Firebase Console.'
  }

  if (!error.code) {
    return error.message || 'Ocurrió un error inesperado. Por favor intenta nuevamente.'
  }

  const errorMessages: Record<string, string> = {
    'auth/operation-not-allowed': 'El método de autenticación no está habilitado. Por favor contacta al administrador.',
    'auth/user-not-found': 'No existe una cuenta con este correo electrónico.',
    'auth/wrong-password': 'La contraseña es incorrecta.',
    'auth/invalid-credential': 'El correo electrónico o la contraseña son incorrectos.',
    'auth/invalid-email': 'El correo electrónico no es válido.',
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada. Por favor contacta al administrador.',
    'auth/email-already-in-use': 'Este correo electrónico ya está registrado.',
    'auth/email-already-exists': 'Este correo electrónico ya está registrado.',
    'auth/weak-password': 'La contraseña es muy débil. Por favor usa una contraseña más segura (mínimo 6 caracteres).',
    'auth/too-many-requests': 'Demasiados intentos fallidos. Por favor intenta más tarde.',
    'auth/network-request-failed': 'Error de conexión. Por favor verifica tu conexión a internet.',
    'auth/popup-closed-by-user': 'La ventana de autenticación fue cerrada.',
    'auth/cancelled-popup-request': 'Solo se puede abrir una ventana de autenticación a la vez.',
    'auth/popup-blocked': 'La ventana emergente fue bloqueada por el navegador.',
    'auth/account-exists-with-different-credential': 'Ya existe una cuenta con este correo usando otro método de autenticación.',
    'auth/requires-recent-login': 'Por seguridad, por favor inicia sesión nuevamente.',
    'auth/invalid-verification-code': 'El código de verificación es inválido o ha expirado.',
    'auth/invalid-verification-id': 'El ID de verificación es inválido.',
    'auth/missing-verification-code': 'Por favor ingresa el código de verificación.',
    'auth/missing-verification-id': 'Error de verificación. Por favor intenta nuevamente.',
    'auth/quota-exceeded': 'Se ha excedido la cuota de solicitudes. Por favor intenta más tarde.',
    'auth/unauthorized-domain': 'Este dominio no está autorizado para esta aplicación.',
    'auth/configuration-not-found': 'La configuración de Firebase no se encontró.',
    'auth/invalid-api-key': 'La clave de API de Firebase no es válida.',
    'auth/app-not-authorized': 'Esta aplicación no está autorizada para usar Firebase.',
  }

  return errorMessages[error.code] || error.message || 'Ocurrió un error inesperado. Por favor intenta nuevamente.'
}
