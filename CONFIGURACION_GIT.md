# Configuración de Git para Email Personal

Este documento explica cómo configurar Git para usar un email personal en este proyecto, sin afectar tu configuración global de Git (útil cuando trabajas en una PC del trabajo).

## Configuración Local (Solo este proyecto)

### 1. Inicializar el repositorio (si aún no lo has hecho)

```bash
git init
```

### 2. Configurar email y nombre personal

```bash
# Configurar email personal
git config --local user.email "tu-email-personal@ejemplo.com"

# Configurar nombre personal
git config --local user.name "Tu Nombre Personal"
```

### 3. Verificar la configuración

```bash
# Ver toda la configuración local
git config --local --list

# Ver solo el email
git config --local user.email

# Ver solo el nombre
git config --local user.name
```

## Configuración Global vs Local

- **Configuración Global**: Afecta a todos los repositorios Git en tu máquina
  ```bash
  git config --global user.email "email@ejemplo.com"
  ```

- **Configuración Local**: Solo afecta a este repositorio específico
  ```bash
  git config --local user.email "email-personal@ejemplo.com"
  ```

La configuración **local tiene prioridad** sobre la global, por lo que este proyecto usará el email personal aunque tengas configurado un email laboral globalmente.

## Verificar qué email se usará

```bash
# Ver el email que se usará (local tiene prioridad)
git config user.email

# Ver de dónde viene la configuración
git config --show-origin user.email
```

## Configurar SSH Key (Opcional)

Si usas SSH para autenticarte con GitHub/GitLab y quieres usar una clave diferente:

1. **Generar una nueva SSH key**:
```bash
ssh-keygen -t ed25519 -C "tu-email-personal@ejemplo.com" -f ~/.ssh/id_ed25519_personal
```

2. **Agregar la clave al ssh-agent**:
```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519_personal
```

3. **Configurar SSH para este proyecto**:
```bash
# Crear o editar ~/.ssh/config
cat >> ~/.ssh/config << EOF

Host github-personal
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_personal
EOF
```

4. **Cambiar el remote del repositorio**:
```bash
git remote set-url origin git@github-personal:usuario/repositorio.git
```

## Ejemplo Completo

```bash
# 1. Inicializar repositorio
git init

# 2. Configurar email y nombre personal
git config --local user.email "personal@gmail.com"
git config --local user.name "Tu Nombre"

# 3. Verificar
git config --local --list

# 4. Hacer tu primer commit
git add .
git commit -m "Initial commit"

# 5. Agregar remote (si usas GitHub)
git remote add origin https://github.com/tu-usuario/organizador-tareas.git

# 6. Push inicial
git branch -M main
git push -u origin main
```

## Troubleshooting

### El email sigue siendo el del trabajo

Verifica que la configuración local esté correcta:
```bash
git config --local user.email
```

Si muestra el email del trabajo, vuelve a configurarlo:
```bash
git config --local user.email "tu-email-personal@ejemplo.com"
```

### Ver todos los niveles de configuración

```bash
# Ver configuración del sistema
git config --system --list

# Ver configuración global
git config --global --list

# Ver configuración local
git config --local --list

# Ver configuración efectiva (con prioridades)
git config --list --show-origin
```

## Notas Importantes

- ✅ La configuración local **no afecta** otros repositorios Git
- ✅ Puedes tener diferentes emails para diferentes proyectos
- ✅ La configuración local tiene **prioridad** sobre la global
- ✅ Si eliminas el repositorio (`.git`), se pierde la configuración local
