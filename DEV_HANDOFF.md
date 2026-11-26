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

## Cambios 2026-11-23 (3): inicio, MAIK, lesiones, visor de ejecución

- Inicio: panel "Hoy" (`components/HomeHoy.js`) con el próximo día de rutina, botón "Empezar" que abre la rutina en ese día (evento `mak:abrir-rutina`), anillo semanal, días entrenados, racha, días de membresía y consejo del día.
- MAIK: recorrido actualizado (9 pasos, saltar, teclado ←/→/Esc, clave `onboarding-v6` para que todos lo vean una vez) y asistente con preguntas frecuentes por pantalla e instalación de la app.
- Lesiones: paso "Tu salud primero" (`components/PrecaucionesSalud.js`, `lib/precauciones.js`). Molestia leve → `observaciones` ("Precauciones: …"), la rutina la cuida. Dolor actual/condición médica → `limitaciones` ("Revisión: …"), revisa el entrenador y se muestra una guía segura (`components/GuiaRevisionSalud.js`) en lugar del bloqueo.
- Rutina: aviso "Cuida tu …" y botón de alternativa segura en ejercicios que cargan la zona; motor v4 excluye esos ejercicios.
- Ejecución: ya no se muestran imágenes en las tarjetas; botón "Ver ejecución" abre la demostración a pantalla completa por encima de todo (antes el visor quedaba detrás del modal).
- Entrenamiento: barra fija arriba con progreso y tiempo.

## Cambios 2026-11-23 (4): inicio para celular y barra de entrenamiento

- Accesos del inicio rediseñados (`.mak-tile*` en globals.css): tarjetas con color por sección, ícono grande, título de 22 px y texto de 14 px como mínimo.
- Encabezado con saludo según la hora de Ecuador; código de ingreso compacto en una fila.
- Corregido: el panel "Hoy" mostraba "Crea tu rutina" aunque el socio ya tenía una.
- Entrenamiento: barra fija oscura con ejercicios hechos, porcentaje, tiempo y botón Terminar/Finalizar (lleva al cierre).
- Corregido: el botón Finalizar seguía exigiendo pesos múltiplos de 2,5 kg en la app.
- Consejos del plan agrupados en un desplegable para llegar antes a los días; tamaños de letra mínimos de 12 px en toda la app.

## Cambios 2026-11-23 (5): selector de peso con pin y descanso en primer plano

- `components/PesoSelector.js`: al tocar el peso se abre un selector a pantalla completa. Máquina = pila de placas con pin (tocar o deslizar), Barra = discos por lado con suma automática (barra de 20/15/10 kg), Mancuernas = rack. Botones ±, peso sugerido y opción "Escribir" para cualquier valor exacto. Vibración ligera al elegir.
- El tipo se detecta por el equipamiento del ejercicio; el salto de placas usa `incremento_kg` (por defecto 2,5 kg).
- Repeticiones con botones − / +.
- `RestTimer` se dibuja en `document.body` (portal): la animación de la ventana de rutina rompía `position: fixed` y el descanso solo se veía al final de la página.

## Cambios 2026-11-23 (6): pantallas de carga con muñequitos

- `components/MakCargando.js` + estilos `.mk-*` en globals.css: figuras originales (SVG + CSS) haciendo dominadas, flexiones, abdominales, sentadillas (sprite de 3 cuadros) y jumping jacks; rotan cada 3,6 s con frases ("Ajustando el pin…").
- Usado en: login, `app/loading.js` (entre pantallas), guardar perfil y generar rutina, iniciar entrenamiento, búsqueda de alternativas y panel de equipamiento.
- `portal` para mostrarlo encima de ventanas con animación; respeta "reducir movimiento".

## Cambios 2026-11-23 (7): rutinas distintas para todos y objetivo secundario

- Diagnóstico: en producción las rutinas las genera el motor SQL `mak-determinista-v3`; con el mismo perfil produce la misma rutina. El motor v4 estaba apagado.
- Motor v4 listo para activar: guarda en `socio_rutinas_generadas` (tabla real), semilla por socio y momento, y reparto entre socios (penaliza los ejercicios más presentes en rutinas activas de otros). Prueba: 30 socios con perfil idéntico → 0 rutinas iguales, 43 % de coincidencia promedio, 73 ejercicios distintos.
- `supabase/migrations/20261123_motor_v4_ejercicios.sql`: registra los 112 ejercicios v4 en `app_ejercicios` (excluidos del motor v3 con un equipo inactivo). Probado en Postgres 16 con réplica del esquema.
- Objetivo secundario opcional (`lib/objetivos.js`), guardado como línea en `observaciones`; el motor v4 ajusta reps, descansos, volumen o cardio según el secundario.
- Variantes: si el ejercicio viene del motor anterior, se usa la función SQL de variantes.

## Cambios 2026-11-23 (8): rutinas lógicas según el cuerpo de cada socio

- `lib/rutinas/perfilCorporal.js`: IMC (peso/talla²), categoría y edad (del perfil o de `miembros.fecha_nacimiento`). Sobrepeso principiante u obesidad → sin dominadas, fondos, colgarse, flexiones completas ni saltos/trote; prioridad a máquinas; cardio de bajo impacto. Obesidad II-III → además sin ejercicios exigentes a una pierna ni silla romana, y volumen inicial reducido. ≥55 años → sin impacto ni carga axial pesada; ≥65 → volumen reducido. Principiante con peso normal → sin dominadas ni fondos completos. Bajo peso + "bajar grasa" → plan de tonificación con aviso.
- Estructura semanal distinta por objetivo (pérdida de grasa con días de circuito, tonificación con día de glúteo, salud con cuerpo completo…), no solo otras repeticiones.
- 4 ejercicios nuevos de bajo impacto (116 en total). Migración `20261123_motor_v4_ejercicios.sql` regenerada y probada.
- La rutina muestra "Hecha para ti" (nivel, IMC, edad, días, minutos) y qué motor la generó.
- Pruebas: 1.296 combinaciones (6 tipos de cuerpo × 6 objetivos × 3 niveles × 4 frecuencias × 3 duraciones): 0 ejercicios no aptos, 0 días con menos de 7 ejercicios, 0 sesiones fuera de tiempo.

## Cambios 2026-11-25 (9): estabilización para producción

- La rutina activa se lee directamente de `socio_rutinas_generadas` cuando el motor v4 está activo (`estadoConRutinaV4`); si la función SQL antigua falla, se arma el estado desde las tablas (`estadoDesdeTablas`). Si el perfil cambió después de generar la rutina, se pide actualizarla.
- Guardado seguro (`lib/rutinas/generacion.js`): inserta la rutina nueva inactiva, desactiva las anteriores y activa la nueva; si algo falla restaura la anterior. Errores visibles arriba de la pantalla (`AvisoFlotante`) con detalle técnico.
- `/api/rutina/motor` indica qué motor está activo; `/api/rutina/diagnostico` prueba todo el flujo sin cambiar la rutina (en producción solo administradores).
- `supabase/migrations/20261123_finalizar_pesos_libres.sql`: `finalizar_mi_entrenamiento_app()` ya no exige pesos múltiplos de 2,5 kg.
- Motor: repeticiones realistas en ejercicios con peso corporal (p. ej. dominadas 5-8 en intermedio, no 15-20); sin zancadas ni búlgara para principiantes con obesidad o de 55+ años; un solo ejercicio lumbar aislado por día.
- Guía de MAIK dinámica (`AppWelcomeGuide`): sube el elemento señalado cerca del borde superior y coloca el cuadro debajo (o arriba) sin taparlo; si no hay espacio, usa una versión compacta sin el personaje. Probado en PC, tablet y celular: el cuadro no cubre el elemento señalado (salvo un 24 % del panel "Hoy" en pantallas de 360×640).

## Cambios 2026-11-25 (10): cédula corregida en el sistema administrativo

- La cuenta de la app se crea con la cédula como contraseña inicial (o una clave aleatoria si la cédula no era válida). Si luego se corregía la cédula en el sistema administrativo, Supabase Auth conservaba la contraseña anterior y el socio no podía entrar.
- `app/api/auth/login/route.js` (`sincronizarClaveInicial`): si el inicio de sesión falla, el socio nunca cambió su contraseña (`clave_cambiada = false`) y escribió la cédula que hoy tiene `miembros.cedula`, se actualiza su contraseña de Auth a esa cédula (sin puntos, espacios ni guiones, igual que `lib/mak-provisionar-socio.mjs` del sistema administrativo), se marca `tipo_clave_inicial = 'cedula'` y se reintenta. Si ya cambió su contraseña, no se toca nada.
- Login: texto de ayuda "¿Primera vez? Tu contraseña inicial es tu número de cédula."

## Cambios 2026-11-26 (11): accesos de socios y restablecer contraseña

- Nueva sección de administración `/admin/accesos` (solo códigos de `MAK_ADMIN_CODIGOS`), con navegación compartida `AdminNav` junto a Equipamiento. En inicio el botón se llama "Administración".
- Buscar socio por código, cédula o nombre. Diagnóstico de lo que impide entrar: sin cuenta, cuenta desactivada, identidad de Auth faltante o con marca de otro socio, correo técnico distinto o sin confirmar, usuario bloqueado, cédula inválida, contraseña personal o temporal.
- "Restablecer contraseña" (`POST /api/admin/accesos`): pone la cédula (sin puntos, espacios ni guiones) como contraseña; si la cédula no es válida genera una clave temporal `MAK-XXXXXX` y obliga a cambiarla. También repara la identidad (marca de socio, correo confirmado, desbloqueo). Deja `clave_cambiada = false`. Botón para copiar el mensaje para el socio. "Activar acceso" si la cuenta estaba desactivada.
- `cambiar-password` ahora guarda `ultimo_cambio_clave_at`.
