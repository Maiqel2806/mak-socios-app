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
