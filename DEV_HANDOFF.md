# MAK Socios — Estado de desarrollo

## Proyecto
- App: MAK Socios
- Framework: Next.js 16.4.2
- Rama: master
- App administrativa MAK FITNESS es un proyecto separado.

## Estado actual

### Autenticación
- Login de socios mediante codigo_acceso + contraseña.
- Cuenta del socio permanece aunque la membresía venza.
- Los beneficios premium dependen de la membresía activa.

### Perfil físico
- Objetivo.
- Nivel.
- Días de entrenamiento.
- Tiempo de sesión.
- Peso, altura y datos físicos.
- Limitaciones con revisión previa.

### Rutinas
- Motor actual en Supabase: mak-determinista-v3.
- Rutinas según objetivo, nivel, días, tiempo y equipamiento real de MAK FITNESS.
- Calentamiento y cierre diferenciados del trabajo principal.
- Para una sesión de 60 min se utilizan hasta ~45 min de trabajo principal.
- Motor evita equipamiento no disponible.
- V2 queda conservada como histórico.

### Variantes
- RPC: obtener_variantes_ejercicio_app(uuid)
- API: /api/rutina/variantes
- Botón "Ver variantes".
- Hasta 2 alternativas biomecánicamente compatibles.
- Conserva patrón de movimiento, grupo muscular y nivel.
- "Usar esta variante hoy" no modifica la rutina base.
- Popup de variantes corregido para desktop/mobile.

### Ejecución de entrenamiento
Tablas Supabase:
- socio_entrenamientos
- socio_entrenamiento_ejercicios
- socio_entrenamiento_series

RPC:
- iniciar_mi_entrenamiento_app(integer)
- obtener_mi_entrenamiento_en_curso_app()

API:
- /api/entrenamiento

UI:
- components/WorkoutExecutionView.js
- RoutinePlanView debe usar WorkoutExecutionView como única vista de ejecución.

## Próximo trabajo
1. Probar Iniciar entrenamiento end-to-end.
2. Registrar peso, repeticiones y RIR por serie.
3. Descanso/temporizador entre series.
4. Aplicar variantes también durante una sesión iniciada.
5. Finalizar/cancelar entrenamiento correctamente.
6. Guardar duración y RPE de sesión.
7. Crear módulo Progreso usando historial real.
8. Usar historial para progresión futura de rutinas.

## Pendientes posteriores
- Cambio de contraseña.
- Aprovisionamiento automático de cuentas MAK Socios.
- Migración masiva solo cuando la app esté lista.
- Snack Bar.
- Seguridad final y revocación de credenciales antiguas comprometidas cuando se confirme que ningún servicio las usa.
- PWA/pulido final.
- Coach inteligente futuro.

## Principios del proyecto
- No borrar datos reales.
- No hacer migración masiva todavía.
- No usar ejercicios/equipamiento inexistente en MAK FITNESS.
- Las limitaciones físicas no deben ser interpretadas automáticamente como diagnóstico médico.
- Mantener historial de rutinas y entrenamientos.
- Priorizar lógica correcta antes de pulido visual final.

## Cambios 2026-11-23 (piloto: errores y mejoras)

### Corregido en la app
1. Estatura y peso aceptan decimales con coma o punto (`lib/numeros.js`). El input de estatura no tenía `step` y el navegador rechazaba 170,5.
2. Registro de series: cualquier peso (se quitó la regla de múltiplos de 2,5 kg en UI y API). Botones + / − usan el salto de cada máquina (`incremento_kg`) y botón "Igual que la serie anterior".
7. Demostraciones de ejercicios: `components/ExerciseDemo.js` alterna posición inicial/final (imágenes de dominio público en `public/ejercicios`, ~2,9 MB). Funciona también con rutinas del motor v3 (búsqueda por nombre en `lib/rutinas/medios.js`).

### Motor de rutinas v4 (`lib/rutinas/`)
- `motor.js`: rutinas distintas por nivel y en cada generación (semilla), mínimo 7 ejercicios, bloques de fuerza, superseries, funcional/core y finalizador cardio, ajuste al tiempo máximo. Validado con 450 combinaciones de perfil (0 fallos) y 3.240 días sin exceder el tiempo.
- `ejercicios.js`: 112 ejercicios + movilidad/estiramientos, incluye hip thrust en máquina, paralelas, dominadas, flexiones, banco declinado y silla romana.
- `equipamiento.js`: catálogo por defecto. Fuente real: tabla `gimnasio_equipamiento`.
- Panel `/admin/equipamiento` (solo códigos en `MAK_ADMIN_CODIGOS`): activar/desactivar máquinas, salto de peso, ejercicios propios para máquinas nuevas y vista previa de rutinas.

### Variables de entorno nuevas
- `MAK_ADMIN_CODIGOS=MAK0001` → códigos de acceso con permiso de administración.
- `MOTOR_RUTINAS=v4` → NO activar hasta completar la Parte 2 de la migración.

### Migración
`supabase/migrations/20261123_motor_rutinas_v4.sql`
- Parte 1 (segura): tablas nuevas + catálogo inicial. Revisar equipos con `activo = false`.
- Parte 2 (pendiente): ajustar `guardar_mi_serie_entrenamiento_app` (2,5 kg), `iniciar_mi_entrenamiento_con_variantes_app` (leer rutina v4) y tipo de estatura. Requiere la definición actual de esas funciones.

## Cambios 2026-11-23 (2): app competitiva y responsive

- Entrenamiento: temporizador de descanso automático (vibración + sonido, ±15 s, saltar), pantalla siempre encendida (Wake Lock), "Última vez" por ejercicio, peso sugerido por doble progresión (`lib/progresion.js`), aviso de récord personal y barra de progreso de la sesión.
- API nueva: `POST /api/entrenamiento/historial` (solo lectura).
- Progreso: racha de semanas, total de entrenamientos, volumen de 8 semanas, récords personales (1RM estimado) y últimos entrenamientos (`lib/historial.js`).
- Login rediseñado: dos columnas en PC/TV, tarjeta en móvil, aviso de Bloq Mayús.
- PWA instalable: `app/manifest.js`, iconos `public/icono-*.png`, `app/apple-icon.png`.
- Responsive: 4 accesos por fila en PC, escalado automático en pantallas ≥1700 px (TV), foco visible para control remoto, áreas seguras del iPhone en modo instalado.
- SQL: `supabase/migrations/20261123_pesos_libres_series.sql` (cualquier peso al registrar series).
