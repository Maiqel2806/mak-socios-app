-- =====================================================================
-- MAK Socios · Activar el motor de rutinas v4 (parte 2)
-- Fecha: 2026-11-23
--
-- Registra los 116 ejercicios del motor v4 en public.app_ejercicios con
-- el mismo id que usa la app, para que los entrenamientos puedan
-- referenciarlos. No modifica ni borra ejercicios existentes.
--
-- Para que el motor ANTERIOR (v3) no los use, se vinculan a un equipo
-- inactivo "solo_motor_v4". Se puede ejecutar más de una vez.
-- =====================================================================

do $$
declare
  r record;
  v_equipo uuid;
  v_tipo text;
  v_patron text;
  v_nivel text;
  v_ok int := 0;
  v_error int := 0;
begin
  -- Equipo marcador (inactivo) para excluirlos del motor anterior
  select id into v_equipo from public.app_equipamiento where codigo = 'solo_motor_v4';
  if v_equipo is null then
    begin
      insert into public.app_equipamiento (codigo, nombre, categoria, cantidad, detalle, activo, orden)
      values ('solo_motor_v4', 'Solo motor v4 (no usar)', 'otros', 0, 'Marcador técnico: excluye del motor anterior los ejercicios del motor v4.', false, 9999)
      returning id into v_equipo;
    exception when others then
      raise notice 'No se pudo crear el equipo marcador: %', sqlerrm;
    end;
  end if;

  -- Valores de respaldo tomados de un ejercicio existente (por si hay restricciones de valores)
  select tipo, patron_movimiento, nivel into v_tipo, v_patron, v_nivel
  from public.app_ejercicios where coalesce(activo, true) limit 1;

  for r in
    select * from (values
    ('4bc9c066-6077-5f2d-bff8-588888abe547', 'Press de banca con barra', 'Pecho', 'intermedio', 'Barra olímpica y discos + Banco plano', 'Escápulas juntas y hacia abajo, pies firmes. Baja la barra controlada a la línea del pecho y empuja sin despegar glúteos.', '/ejercicios/Barbell_Bench_Press_-_Medium_Grip/0.webp', 'v4_press_banca_barra', 'fuerza', 'emp_h', true),
    ('7cb5b485-dc88-56bc-9f0b-d9f392546072', 'Press de banca con mancuernas', 'Pecho', 'principiante', 'Mancuernas + Banco plano', 'Codos a unos 45° del torso. Baja hasta sentir estiramiento en el pecho y junta las mancuernas arriba sin chocarlas.', '/ejercicios/Dumbbell_Bench_Press/0.webp', 'v4_press_banca_mancuernas', 'fuerza', 'emp_h', true),
    ('090fa9a4-dae2-574f-94e7-228ae34f50cd', 'Press de pecho en máquina', 'Pecho', 'principiante', 'Press de pecho en máquina', 'Ajusta el asiento para que las manijas queden a la altura media del pecho. Empuja sin bloquear codos y regresa lento.', '/ejercicios/Leverage_Chest_Press/0.webp', 'v4_press_pecho_maquina', 'fuerza', 'emp_h', true),
    ('7b829e0f-2e64-57dc-917a-940d0f8382d2', 'Flexiones de pecho', 'Pecho', 'principiante', 'Peso corporal', 'Cuerpo en línea recta de cabeza a talones. Baja el pecho hasta casi tocar el suelo con codos a 45°.', '/ejercicios/Pushups/0.webp', 'v4_flexiones', 'calistenia', 'emp_h', true),
    ('c8b5f6ae-c8e7-5ba7-8532-2b94ea18815d', 'Flexiones inclinadas (manos en banco)', 'Pecho', 'principiante', 'Banco plano', 'Versión más accesible de la flexión. Manos en el banco, abdomen firme y baja el pecho hacia el borde.', '/ejercicios/Incline_Push-Up/0.webp', 'v4_flexiones_inclinadas', 'calistenia', 'emp_h', true),
    ('b90e6991-66ec-51ce-ac83-069f47209adc', 'Flexiones con pies elevados', 'Pecho', 'intermedio', 'Banco plano', 'Pies sobre el banco para cargar la parte alta del pecho y hombros. No dejes caer la cadera.', '/ejercicios/Push-Ups_With_Feet_Elevated/0.webp', 'v4_flexiones_pies_elevados', 'calistenia', 'emp_h_inc', true),
    ('7736ec6c-a771-55ad-8620-6212e0595be3', 'Flexiones pliométricas', 'Pecho', 'avanzado', 'Peso corporal', 'Empuja explosivo para despegar las manos del suelo y aterriza suave con codos semiflexionados.', '/ejercicios/Plyo_Push-up/0.webp', 'v4_flexiones_pliometricas', 'funcional', 'funcional', true),
    ('3e635d5b-59e4-557e-97db-46a5b90872a8', 'Press inclinado con mancuernas', 'Pecho', 'principiante', 'Mancuernas + Banco inclinado / ajustable', 'Banco a 30°. Baja las mancuernas a la parte alta del pecho y empuja en línea recta sobre los hombros.', '/ejercicios/Hammer_Grip_Incline_DB_Bench_Press/0.webp', 'v4_press_inclinado_mancuernas', 'fuerza', 'emp_h_inc', true),
    ('7593c450-10a7-5d93-900c-870645bd3879', 'Press inclinado con barra', 'Pecho', 'intermedio', 'Barra olímpica y discos + Banco inclinado / ajustable', 'Barra a la clavícula, codos ligeramente por debajo de la barra. Mantén el pecho alto durante todo el recorrido.', '/ejercicios/Barbell_Incline_Bench_Press_-_Medium_Grip/0.webp', 'v4_press_inclinado_barra', 'fuerza', 'emp_h_inc', true),
    ('ab6ab7e4-b643-53a7-9f93-3f1624b53321', 'Press declinado con barra', 'Pecho', 'intermedio', 'Barra olímpica y discos + Banco press pecho declinado', 'Asegura bien los pies en el banco declinado. Baja la barra a la parte baja del pecho; pide ayuda para sacar la barra.', '/ejercicios/Decline_Barbell_Bench_Press/0.webp', 'v4_press_declinado_barra', 'fuerza', 'emp_h_dec', true),
    ('8154590f-8cd4-5a52-847c-5ef5970bfc10', 'Press declinado con mancuernas', 'Pecho', 'principiante', 'Mancuernas + Banco press pecho declinado', 'Enfatiza la parte baja del pecho. Controla la bajada y junta las mancuernas arriba sin perder tensión.', '/ejercicios/Decline_Dumbbell_Bench_Press/0.webp', 'v4_press_declinado_mancuernas', 'fuerza', 'emp_h_dec', true),
    ('08f987d8-f683-5e99-abcb-301e7a110187', 'Aperturas en banco declinado', 'Pecho', 'intermedio', 'Mancuernas + Banco press pecho declinado', 'Codos ligeramente flexionados y fijos. Abre en arco hasta sentir estiramiento y cierra apretando el pecho.', '/ejercicios/Decline_Dumbbell_Flyes/0.webp', 'v4_aperturas_declinadas', 'fuerza', 'ais_pecho', false),
    ('ab104045-8f92-5f70-bfc9-9da311efd1ce', 'Aperturas con mancuernas', 'Pecho', 'principiante', 'Mancuernas + Banco plano', 'Imagina abrazar un barril. No bajes más allá de la línea de los hombros.', '/ejercicios/Dumbbell_Flyes/0.webp', 'v4_aperturas_mancuernas', 'fuerza', 'ais_pecho', false),
    ('3366ca90-9ef7-50bd-96f2-617a43a403a7', 'Aperturas en pec deck', 'Pecho', 'principiante', 'Pec deck / aperturas', 'Espalda pegada al respaldo. Junta las manijas al frente apretando el pecho y abre controlando 2-3 segundos.', '/ejercicios/Butterfly/0.webp', 'v4_pec_deck', 'fuerza', 'ais_pecho', false),
    ('aa670b6b-d1ed-53c6-88b9-3c45cd4adc28', 'Cruce de poleas', 'Pecho', 'intermedio', 'Poleas / cruce de poleas', 'Un pie adelante, torso levemente inclinado. Cruza las manos frente a la cadera manteniendo los codos suaves.', '/ejercicios/Cable_Crossover/0.webp', 'v4_cruce_poleas', 'fuerza', 'ais_pecho', false),
    ('4c324cf9-c7f1-5b90-96ad-849730c1215e', 'Fondos en paralelas (pecho)', 'Pecho', 'intermedio', 'Barras paralelas', 'Inclina el torso hacia adelante y baja hasta que los hombros queden a la altura de los codos. Sube sin balancearte.', '/ejercicios/Dips_-_Chest_Version/0.webp', 'v4_fondos_paralelas_pecho', 'calistenia', 'fondos', true),
    ('b7e46f18-db6e-59f1-9ffb-d1c2bd06545b', 'Fondos en paralelas (tríceps)', 'Tríceps', 'intermedio', 'Barras paralelas', 'Torso vertical y codos pegados. Baja hasta 90° de codo y extiende completamente arriba.', '/ejercicios/Parallel_Bar_Dip/0.webp', 'v4_fondos_paralelas_triceps', 'calistenia', 'fondos', true),
    ('2ae8ba77-eb19-541a-8492-eb5135e7ff44', 'Fondos en banco', 'Tríceps', 'principiante', 'Banco plano', 'Manos en el borde del banco, cadera cerca. Baja flexionando codos hacia atrás, sin encoger hombros.', '/ejercicios/Bench_Dips/0.webp', 'v4_fondos_banco', 'calistenia', 'triceps', false),
    ('c76a6ff2-effb-5e33-a2a7-8204767f633d', 'Extensión de tríceps en polea con cuerda', 'Tríceps', 'principiante', 'Poleas / cruce de poleas', 'Codos pegados a las costillas. Extiende y separa la cuerda abajo; solo se mueve el antebrazo.', '/ejercicios/Triceps_Pushdown_-_Rope_Attachment/0.webp', 'v4_jalon_triceps_cuerda', 'fuerza', 'triceps', false),
    ('229e7492-1730-57a1-be28-d6245564b6b3', 'Extensión de tríceps en polea con barra', 'Tríceps', 'principiante', 'Poleas / cruce de poleas', 'Hombros abajo, codos fijos. Extiende por completo y sube controlando hasta 90°.', '/ejercicios/Triceps_Pushdown/0.webp', 'v4_jalon_triceps_barra', 'fuerza', 'triceps', false),
    ('8ef3c5c3-1f1a-5d62-8b96-713d4d41b09c', 'Extensión de tríceps sobre la cabeza en polea', 'Tríceps', 'intermedio', 'Poleas / cruce de poleas', 'De espaldas a la polea, codos apuntando al frente. Extiende hacia adelante sin arquear la espalda.', '/ejercicios/Cable_Rope_Overhead_Triceps_Extension/0.webp', 'v4_extension_triceps_overhead', 'fuerza', 'triceps', false),
    ('0b27fa0c-5b04-5133-960f-e596ac56b505', 'Press francés con barra Z', 'Tríceps', 'intermedio', 'Barra Z + Banco plano', 'Brazos perpendiculares, baja la barra hacia la frente doblando solo los codos. Sube sin abrir los codos.', '/ejercicios/EZ-Bar_Skullcrusher/0.webp', 'v4_press_frances', 'fuerza', 'triceps', false),
    ('1d51cf08-8258-5311-9d4f-351290ccc29b', 'Patada de tríceps con mancuerna', 'Tríceps', 'principiante', 'Mancuernas + Banco plano', 'Torso paralelo al suelo y brazo pegado. Extiende el codo atrás y aprieta 1 segundo.', '/ejercicios/Tricep_Dumbbell_Kickback/0.webp', 'v4_patada_triceps', 'fuerza', 'triceps', false),
    ('880ab949-95be-5800-a3b1-162b7bd9308a', 'Flexiones cerradas', 'Tríceps', 'intermedio', 'Peso corporal', 'Manos debajo del pecho y codos rozando el cuerpo al bajar. Mantén el abdomen firme.', '/ejercicios/Push-Ups_-_Close_Triceps_Position/0.webp', 'v4_flexiones_diamante', 'calistenia', 'triceps', true),
    ('5bb219ee-8671-5551-8998-7a00812ef6ab', 'Dominadas', 'Espalda', 'intermedio', 'Barra de dominadas', 'Agarre algo más ancho que hombros. Lleva el pecho hacia la barra bajando escápulas; baja completo y controlado.', '/ejercicios/Pullups/0.webp', 'v4_dominadas', 'calistenia', 'tir_v', true),
    ('374bcf12-b02e-5a19-987b-937cba35d8e3', 'Dominadas supinas (chin-up)', 'Espalda', 'intermedio', 'Barra de dominadas', 'Palmas hacia ti, agarre al ancho de hombros. Sube hasta pasar la barbilla y baja sin soltar la tensión.', '/ejercicios/Chin-Up/0.webp', 'v4_dominadas_supinas', 'calistenia', 'tir_v', true),
    ('3aea0ca2-85da-5ab9-ad1a-7e44b9e3158b', 'Dominadas lastradas', 'Espalda', 'avanzado', 'Barra de dominadas + Mancuernas', 'Sujeta una mancuerna entre los pies o con cinturón. Mismas reglas técnicas que la dominada estricta.', '/ejercicios/Weighted_Pull_Ups/0.webp', 'v4_dominadas_lastradas', 'calistenia', 'tir_v', true),
    ('71b12699-36c7-5a8e-986e-49cf7ff8cae4', 'Dominadas negativas', 'Espalda', 'principiante', 'Barra de dominadas + Banco plano', 'Sube con ayuda del banco y baja lo más lento posible (3-5 segundos). Construye fuerza para la dominada completa.', '/ejercicios/Band_Assisted_Pull-Up/0.webp', 'v4_dominada_negativa', 'calistenia', 'tir_v', true),
    ('a44f0e84-eac7-5a9d-a375-3f26d3f127a7', 'Dominadas escapulares', 'Espalda', 'principiante', 'Barra de dominadas', 'Colgado con brazos estirados, sube unos centímetros solo bajando y juntando las escápulas.', '/ejercicios/Scapular_Pull-Up/0.webp', 'v4_dominada_escapular', 'calistenia', 'tir_v', false),
    ('337c8b0c-3ffa-5e93-8198-129ab1260231', 'Jalón al pecho', 'Espalda', 'principiante', 'Jalón al pecho', 'Pecho alto, lleva la barra a la clavícula llevando codos hacia los bolsillos. Sube controlado sin balancearte.', '/ejercicios/Wide-Grip_Lat_Pulldown/0.webp', 'v4_jalon_pecho', 'fuerza', 'tir_v', true),
    ('a3ba7b5b-fd7b-53e8-b1bf-b991cc36ba4e', 'Jalón con agarre cerrado', 'Espalda', 'principiante', 'Jalón al pecho', 'Agarre neutro cerrado. Codos pegados al torso y aprieta la espalda al final.', '/ejercicios/Close-Grip_Front_Lat_Pulldown/0.webp', 'v4_jalon_cerrado', 'fuerza', 'tir_v', true),
    ('65ad88c1-f5db-535a-b416-4ff75b549f78', 'Pullover en polea con brazos rectos', 'Espalda', 'intermedio', 'Poleas / cruce de poleas', 'Brazos casi rectos, lleva la cuerda desde arriba hasta los muslos usando los dorsales.', '/ejercicios/Rope_Straight-Arm_Pulldown/0.webp', 'v4_jalon_brazo_recto', 'fuerza', 'tir_v', false),
    ('15a1fa42-664e-57e3-99e6-2f84ac48430d', 'Remo sentado en máquina', 'Espalda', 'principiante', 'Remo sentado', 'Espalda neutra, tira hacia el ombligo juntando escápulas. Estira los brazos sin redondear la espalda.', '/ejercicios/Seated_Cable_Rows/0.webp', 'v4_remo_sentado', 'fuerza', 'tir_h', true),
    ('5c0b5d48-75ea-5cf5-b230-3e262f503ecb', 'Remo con mancuerna a una mano', 'Espalda', 'principiante', 'Mancuernas + Banco plano', 'Rodilla y mano en el banco. Lleva la mancuerna hacia la cadera sin girar el torso.', '/ejercicios/One-Arm_Dumbbell_Row/0.webp', 'v4_remo_mancuerna', 'fuerza', 'tir_h', true),
    ('cc903532-47c4-5cc7-bee2-bba4fb4e3b79', 'Remo con barra', 'Espalda', 'intermedio', 'Barra olímpica y discos', 'Bisagra de cadera a 45°, espalda neutra. Lleva la barra al abdomen bajo y baja sin perder la postura.', '/ejercicios/Bent_Over_Barbell_Row/0.webp', 'v4_remo_barra', 'fuerza', 'tir_h', true),
    ('3cd2bc94-1758-584d-b219-a1fa5729182b', 'Remo invertido en barra', 'Espalda', 'principiante', 'Rack de sentadilla', 'Barra a la altura de la cadera en el rack. Cuerpo recto, lleva el pecho a la barra. Pies más adelante = más difícil.', '/ejercicios/Inverted_Row/0.webp', 'v4_remo_invertido', 'calistenia', 'tir_h', true),
    ('50956e25-ccf6-540e-9915-00df95a1b740', 'Face pull en polea', 'Hombros', 'principiante', 'Poleas / cruce de poleas', 'Polea a la altura de la cara. Tira hacia la frente separando la cuerda y rotando hombros hacia afuera.', '/ejercicios/Face_Pull/0.webp', 'v4_face_pull', 'fuerza', 'hombro_post', false),
    ('ff464549-6e1a-58b6-b0ac-45433cb5b550', 'Pájaros con mancuernas', 'Hombros', 'principiante', 'Mancuernas', 'Torso inclinado, brazos casi rectos. Abre hacia los lados apretando la parte posterior del hombro.', '/ejercicios/Reverse_Flyes/0.webp', 'v4_pajaro_mancuernas', 'fuerza', 'hombro_post', false),
    ('f147d5a9-cacc-5884-b423-1cd725ec939a', 'Pec deck invertido', 'Hombros', 'principiante', 'Pec deck / aperturas', 'Pecho contra el respaldo. Abre los brazos hacia atrás sin encoger los hombros.', '/ejercicios/Reverse_Machine_Flyes/0.webp', 'v4_pec_deck_invertido', 'fuerza', 'hombro_post', false),
    ('194613f1-6c5f-50b6-a65e-a7bf693dfd5c', 'Press de hombro con mancuernas', 'Hombros', 'principiante', 'Mancuernas + Banco inclinado / ajustable', 'Sentado con respaldo vertical. Empuja sobre la cabeza sin arquear la zona lumbar.', '/ejercicios/Dumbbell_Shoulder_Press/0.webp', 'v4_press_hombro_mancuernas', 'fuerza', 'emp_v', true),
    ('464c16f4-6f24-5e99-a4e1-e616c3216193', 'Press de hombro en máquina', 'Hombros', 'principiante', 'Press de hombro en máquina', 'Manijas a la altura de los hombros al inicio. Empuja sin bloquear y baja controlado.', '/ejercicios/Leverage_Shoulder_Press/0.webp', 'v4_press_hombro_maquina', 'fuerza', 'emp_v', true),
    ('b97d243c-f028-5da3-a568-460e09bc46cd', 'Press militar con barra', 'Hombros', 'intermedio', 'Barra olímpica y discos + Rack de sentadilla', 'De pie, glúteos y abdomen apretados. Empuja la barra en línea recta pasando la cabeza hacia atrás.', '/ejercicios/Barbell_Shoulder_Press/0.webp', 'v4_press_militar', 'fuerza', 'emp_v', true),
    ('8faa8b2c-c714-50d9-ac2d-b44a28f2e58f', 'Press Arnold', 'Hombros', 'intermedio', 'Mancuernas + Banco inclinado / ajustable', 'Empieza con palmas hacia ti y rota mientras empujas. Movimiento fluido y controlado.', '/ejercicios/Arnold_Dumbbell_Press/0.webp', 'v4_press_arnold', 'fuerza', 'emp_v', true),
    ('18686597-85d6-5406-a42e-e3a113dcca08', 'Press de hombro en polea', 'Hombros', 'principiante', 'Poleas / cruce de poleas', 'Poleas bajas a cada lado. Empuja hacia arriba juntando las manos sin arquear la espalda.', '/ejercicios/Seated_Cable_Shoulder_Press/0.webp', 'v4_press_hombro_polea', 'fuerza', 'emp_v', false),
    ('fad7df34-cdb6-5b53-b16f-6fe282122061', 'Elevaciones laterales con mancuernas', 'Hombros', 'principiante', 'Mancuernas', 'Sube hasta la altura de los hombros con codos levemente flexionados. Piensa en alejar las manos, no en subirlas.', '/ejercicios/Side_Lateral_Raise/0.webp', 'v4_elevaciones_laterales', 'fuerza', 'hombro_lat', false),
    ('f6721c42-ac4c-5c7d-92b8-3ba82c1dd8eb', 'Elevación lateral en polea', 'Hombros', 'intermedio', 'Poleas / cruce de poleas', 'Polea baja del lado contrario. Tensión constante durante todo el recorrido.', '/ejercicios/Cable_Seated_Lateral_Raise/0.webp', 'v4_elevaciones_laterales_polea', 'fuerza', 'hombro_lat', false),
    ('1586ebb9-487a-544c-8552-0447d4add72a', 'Remo al mentón con mancuernas', 'Hombros', 'intermedio', 'Mancuernas', 'Agarre amplio, sube los codos hasta la altura de los hombros, no más arriba.', '/ejercicios/Standing_Dumbbell_Upright_Row/0.webp', 'v4_remo_al_menton', 'fuerza', 'hombro_lat', false),
    ('d4e2b458-f524-513f-be49-29760ddcc5dd', 'Curl de bíceps con mancuernas', 'Bíceps', 'principiante', 'Mancuernas', 'Codos pegados, sube girando la palma hacia arriba. Baja en 2-3 segundos.', '/ejercicios/Dumbbell_Bicep_Curl/0.webp', 'v4_curl_mancuernas', 'fuerza', 'biceps', false),
    ('bbb2d647-05b0-5ad8-8ac7-bd81cd6d3392', 'Curl martillo', 'Bíceps', 'principiante', 'Mancuernas', 'Agarre neutro (pulgares arriba). Trabaja bíceps y antebrazo sin balancear el cuerpo.', '/ejercicios/Hammer_Curls/0.webp', 'v4_curl_martillo', 'fuerza', 'biceps', false),
    ('b5fd94e8-451e-5c71-aecc-96520bd3fd8b', 'Curl con barra Z', 'Bíceps', 'principiante', 'Barra Z', 'Codos fijos al costado. Sube sin echar el torso atrás y aprieta arriba.', '/ejercicios/Close-Grip_EZ_Bar_Curl/0.webp', 'v4_curl_barra_z', 'fuerza', 'biceps', false),
    ('0877decc-6f6c-5c21-8eaf-7ec67a5adbeb', 'Curl de bíceps en polea', 'Bíceps', 'principiante', 'Poleas / cruce de poleas', 'Tensión constante. Mantén los codos quietos y controla la bajada.', '/ejercicios/Cable_Hammer_Curls_-_Rope_Attachment/0.webp', 'v4_curl_polea', 'fuerza', 'biceps', false),
    ('3f1e2a52-ab79-57df-b246-f838d3585f55', 'Curl inclinado con mancuernas', 'Bíceps', 'intermedio', 'Mancuernas + Banco inclinado / ajustable', 'Recostado a 45°, brazos colgando detrás del torso. Gran estiramiento del bíceps.', '/ejercicios/Alternate_Incline_Dumbbell_Curl/0.webp', 'v4_curl_inclinado', 'fuerza', 'biceps', false),
    ('07d833cb-888c-522e-b011-c54d173ac150', 'Curl concentrado', 'Bíceps', 'principiante', 'Mancuernas + Banco plano', 'Codo apoyado en la cara interna del muslo. Sube lento y aprieta 1 segundo.', '/ejercicios/Concentration_Curls/0.webp', 'v4_curl_concentrado', 'fuerza', 'biceps', false),
    ('e9c8c2ce-7ffa-59df-9c94-176040dee8d9', 'Sentadilla con barra', 'Cuádriceps', 'intermedio', 'Barra olímpica y discos + Rack de sentadilla', 'Barra sobre trapecios, pies al ancho de hombros. Baja con el pecho alto hasta romper el paralelo si tu movilidad lo permite.', '/ejercicios/Barbell_Squat/0.webp', 'v4_sentadilla_barra', 'fuerza', 'sentadilla', true),
    ('86b5ce68-9010-5f61-b7d5-90969b117767', 'Sentadilla frontal', 'Cuádriceps', 'avanzado', 'Barra olímpica y discos + Rack de sentadilla', 'Barra sobre los deltoides frontales, codos altos. Torso muy vertical durante toda la bajada.', '/ejercicios/Front_Squat_Clean_Grip/0.webp', 'v4_sentadilla_frontal', 'fuerza', 'sentadilla', true),
    ('79e7b8e7-917c-5960-a2e2-073df6d0b98e', 'Sentadilla goblet', 'Cuádriceps', 'principiante', 'Mancuernas', 'Mancuerna pegada al pecho. Baja entre las rodillas con la espalda recta y talones apoyados.', '/ejercicios/Goblet_Squat/0.webp', 'v4_sentadilla_goblet', 'fuerza', 'sentadilla', true),
    ('d0af9245-f7bf-5dcc-817a-c663d19805da', 'Prensa de piernas', 'Cuádriceps', 'principiante', 'Prensa de piernas', 'Espalda baja pegada al respaldo. Baja hasta 90° de rodilla y empuja con todo el pie sin bloquear.', '/ejercicios/Leg_Press/0.webp', 'v4_prensa', 'fuerza', 'sentadilla', true),
    ('6e55522c-28f6-5d55-8444-f5c27b3deeab', 'Sentadilla con peso corporal', 'Cuádriceps', 'principiante', 'Peso corporal', 'Brazos al frente para equilibrar. Cadera atrás y abajo, rodillas en la línea de los pies.', '/ejercicios/Bodyweight_Squat/0.webp', 'v4_sentadilla_peso_corporal', 'funcional', 'sentadilla', true),
    ('bc5aa81b-ab93-5cc6-9316-b321161306e4', 'Sentadilla con salto', 'Cuádriceps', 'intermedio', 'Peso corporal', 'Baja a media sentadilla y salta explosivo. Aterriza suave y encadena la siguiente.', '/ejercicios/Freehand_Jump_Squat/0.webp', 'v4_sentadilla_salto', 'funcional', 'funcional', true),
    ('de0881ab-3c98-589a-8752-669175fb5db0', 'Peso muerto rumano con barra', 'Isquiotibiales', 'intermedio', 'Barra olímpica y discos', 'Rodillas suaves, lleva la cadera atrás deslizando la barra por los muslos hasta sentir los isquios. Espalda neutra.', '/ejercicios/Romanian_Deadlift/0.webp', 'v4_peso_muerto_rumano', 'fuerza', 'bisagra', true),
    ('0783d9eb-6afa-5da4-97af-69ad30d9fc8e', 'Peso muerto rumano con mancuernas', 'Isquiotibiales', 'principiante', 'Mancuernas', 'Mancuernas cerca de las piernas. Cadera atrás, espalda neutra; sube apretando glúteos.', '/ejercicios/Stiff-Legged_Dumbbell_Deadlift/0.webp', 'v4_peso_muerto_rumano_mancuernas', 'fuerza', 'bisagra', true),
    ('b7ef1d56-39ab-57f9-ac66-d4d818e0b4d3', 'Peso muerto convencional', 'Isquiotibiales', 'avanzado', 'Barra olímpica y discos', 'Barra sobre el medio del pie. Pecho alto, empuja el suelo y bloquea con glúteos. Nunca redondees la zona lumbar.', '/ejercicios/Barbell_Deadlift/0.webp', 'v4_peso_muerto', 'fuerza', 'bisagra', true),
    ('3ca510c6-a01b-5321-92e1-d65405e85ebf', 'Buenos días con barra', 'Isquiotibiales', 'avanzado', 'Barra olímpica y discos + Rack de sentadilla', 'Barra en trapecios, rodillas suaves. Inclina el torso llevando la cadera atrás sin redondear.', '/ejercicios/Good_Morning/0.webp', 'v4_buenos_dias', 'fuerza', 'bisagra', true),
    ('e795cfc9-ab00-539c-a971-c2df450249e2', 'Hip thrust en máquina', 'Glúteos', 'principiante', 'Máquina de hip thrust', 'Espalda alta apoyada, pies al ancho de cadera. Empuja con talones hasta alinear rodillas-cadera-hombros y aprieta 1 segundo.', '/ejercicios/Barbell_Hip_Thrust/0.webp', 'v4_hip_thrust_maquina', 'fuerza', 'cadera', true),
    ('9f7a851b-51d5-537a-9cb8-f7d123357bd8', 'Hip thrust con barra', 'Glúteos', 'intermedio', 'Barra olímpica y discos + Banco plano', 'Usa almohadilla en la barra. Barbilla hacia el pecho, sube con glúteos sin hiperextender la zona lumbar.', '/ejercicios/Barbell_Hip_Thrust/0.webp', 'v4_hip_thrust_barra', 'fuerza', 'cadera', true),
    ('589b34f6-bfe2-5919-9993-3594914205bf', 'Puente de glúteo', 'Glúteos', 'principiante', 'Peso corporal', 'Tumbado boca arriba, talones cerca de la cadera. Sube apretando glúteos y baja sin tocar el suelo.', '/ejercicios/Butt_Lift_Bridge/0.webp', 'v4_puente_gluteo', 'fuerza', 'cadera', false),
    ('482e12fe-85e6-5b3f-a843-8284c12cb94d', 'Puente de glúteo a una pierna', 'Glúteos', 'intermedio', 'Peso corporal', 'Una pierna estirada al aire. Mantén la pelvis nivelada durante la subida.', '/ejercicios/Single_Leg_Glute_Bridge/0.webp', 'v4_puente_gluteo_unilateral', 'fuerza', 'cadera', false),
    ('a5ad2f34-ff2f-5dfb-8572-caeee33a7c05', 'Patada de glúteo en polea', 'Glúteos', 'principiante', 'Poleas / cruce de poleas', 'Tobillera en la polea baja. Lleva la pierna atrás apretando el glúteo sin arquear la espalda.', '/ejercicios/One-Legged_Cable_Kickback/0.webp', 'v4_patada_gluteo_polea', 'fuerza', 'cadera', false),
    ('61da343b-ebd9-59a2-9b9e-8f71e10aca30', 'Abductores en máquina', 'Glúteos', 'principiante', 'Abductores / aductores', 'Espalda apoyada, abre las piernas controlando y aguanta 1 segundo afuera.', '/ejercicios/Thigh_Abductor/0.webp', 'v4_abductores_maquina', 'fuerza', 'abductor', false),
    ('8f303fb2-cad7-5b4d-83b7-fddc0f2112cf', 'Abducción de cadera en polea', 'Glúteos', 'principiante', 'Poleas / cruce de poleas', 'De pie de lado a la polea, lleva la pierna hacia afuera sin inclinar el torso.', '/ejercicios/Cable_Hip_Adduction/0.webp', 'v4_abduccion_polea', 'fuerza', 'abductor', false),
    ('c5c8fed3-04b3-54b4-8ff4-6ed18cd1040a', 'Zancadas con mancuernas', 'Cuádriceps', 'principiante', 'Mancuernas', 'Paso largo, baja la rodilla trasera casi al suelo. Torso erguido y empuja con el talón delantero.', '/ejercicios/Dumbbell_Lunges/0.webp', 'v4_zancadas_mancuernas', 'fuerza', 'zancada', true),
    ('02989f72-241c-5bd7-a278-ce28e3cddb4d', 'Zancadas caminando', 'Cuádriceps', 'principiante', 'Peso corporal', 'Avanza alternando piernas con pasos controlados. Mantén el abdomen firme.', '/ejercicios/Bodyweight_Walking_Lunge/0.webp', 'v4_zancadas_caminando', 'funcional', 'zancada', true),
    ('fb2252a0-0697-5249-8d24-bf1a1fcaafbb', 'Sentadilla búlgara', 'Cuádriceps', 'intermedio', 'Mancuernas + Banco plano', 'Pie trasero sobre el banco. Baja vertical y empuja con la pierna delantera.', '/ejercicios/Split_Squat_with_Dumbbells/0.webp', 'v4_sentadilla_bulgara', 'fuerza', 'zancada', true),
    ('fa4cde16-549e-5c01-a57d-e0a40ac27b67', 'Subidas al banco (step-up)', 'Cuádriceps', 'principiante', 'Mancuernas + Banco plano', 'Sube empujando con la pierna de arriba sin impulsarte con la de abajo. Baja controlado.', '/ejercicios/Dumbbell_Step_Ups/0.webp', 'v4_step_up', 'funcional', 'zancada', true),
    ('78242bd3-75ce-5c3c-aee5-8d013e90c712', 'Zancada atrás con barra', 'Cuádriceps', 'avanzado', 'Barra olímpica y discos + Rack de sentadilla', 'Paso atrás estable, rodilla trasera cerca del suelo. Requiere buen equilibrio.', '/ejercicios/Barbell_Lunge/0.webp', 'v4_zancada_atras_barra', 'fuerza', 'zancada', true),
    ('38211bc7-eb75-569a-b5f9-aa2d432c8498', 'Extensión de cuádriceps', 'Cuádriceps', 'principiante', 'Extensión de cuádriceps', 'Rodilla alineada con el eje de la máquina. Extiende y aprieta 1 segundo arriba.', '/ejercicios/Leg_Extensions/0.webp', 'v4_extension_cuadriceps', 'fuerza', 'cuad_ais', false),
    ('e63746d5-c125-5108-9f42-14f73875a7ea', 'Curl femoral en máquina', 'Isquiotibiales', 'principiante', 'Curl femoral', 'Cadera pegada al banco. Flexiona llevando talones hacia los glúteos y baja lento.', '/ejercicios/Lying_Leg_Curls/0.webp', 'v4_curl_femoral', 'fuerza', 'isquio_ais', false),
    ('e51a33db-2294-5358-a6a6-76657ecbbf82', 'Curl femoral a una pierna', 'Isquiotibiales', 'intermedio', 'Curl femoral', 'Trabaja cada pierna por separado para corregir desbalances.', '/ejercicios/Seated_Leg_Curl/0.webp', 'v4_curl_femoral_unilateral', 'fuerza', 'isquio_ais', false),
    ('bd1d3b81-4d78-5b06-b9a1-3bdfff791b2c', 'Elevación de talones de pie', 'Pantorrillas', 'principiante', 'Peso corporal', 'Sobre un escalón o disco. Sube lo más alto posible y baja hasta estirar el talón.', '/ejercicios/Calf_Raise_On_A_Dumbbell/0.webp', 'v4_gemelos_pie', 'fuerza', 'gemelos', false),
    ('39927e2c-754e-5c95-86f9-64ca40fd2fa3', 'Gemelos en prensa', 'Pantorrillas', 'principiante', 'Prensa de piernas', 'Punta de los pies en el borde de la plataforma. Rodillas extendidas sin bloquear.', '/ejercicios/Calf_Press_On_The_Leg_Press_Machine/0.webp', 'v4_gemelos_prensa', 'fuerza', 'gemelos', false),
    ('96bb5ce5-c6e6-53ea-94e0-d94f2a5a7cc4', 'Gemelos en máquina', 'Pantorrillas', 'principiante', 'Gemelos en máquina', 'Recorrido completo con pausa abajo de 1 segundo.', '/ejercicios/Seated_Calf_Raise/0.webp', 'v4_gemelos_maquina', 'fuerza', 'gemelos', false),
    ('a6865de8-40c9-572f-bc8a-b01a5bc64cf1', 'Hiperextensiones en silla romana', 'Zona lumbar', 'principiante', 'Silla romana (lumbar)', 'Cadera en el borde del cojín. Baja con la espalda neutra y sube hasta alinear el cuerpo, sin hiperextender.', '/ejercicios/Hyperextensions_Back_Extensions/0.webp', 'v4_hiperextension_silla_romana', 'fuerza', 'lumbar', false),
    ('edc062ae-c9de-51d9-9ed1-29cc660b4b47', 'Hiperextensiones lastradas', 'Zona lumbar', 'intermedio', 'Silla romana (lumbar) + Mancuernas', 'Abraza un disco o mancuerna al pecho. Mismo control que la versión sin peso.', '/ejercicios/Weighted_Ball_Hyperextension/0.webp', 'v4_hiperextension_lastrada', 'fuerza', 'lumbar', false),
    ('bec609b1-97b3-53fc-94a6-b41736dd2082', 'Superman', 'Zona lumbar', 'principiante', 'Peso corporal', 'Boca abajo, eleva brazos y piernas a la vez y sostén 2 segundos.', '/ejercicios/Superman/0.webp', 'v4_superman', 'core', 'lumbar', false),
    ('d5b193bf-0e82-5064-b29f-6dd52477166a', 'Plancha frontal', 'Core', 'principiante', 'Peso corporal', 'Antebrazos bajo los hombros, glúteos y abdomen apretados. No dejes caer la cadera.', '/ejercicios/Plank/0.webp', 'v4_plancha', 'core', 'core_anti', false),
    ('44ca5a27-53d7-5810-ab36-bbfde712df7e', 'Plancha lateral', 'Core', 'principiante', 'Peso corporal', 'Codo bajo el hombro, cuerpo en línea. Cambia de lado a mitad del tiempo.', '/ejercicios/Side_Bridge/0.webp', 'v4_plancha_lateral', 'core', 'core_rot', false),
    ('1e95e84b-e45f-581e-a426-0f29bf4feecc', 'Dead bug', 'Core', 'principiante', 'Peso corporal', 'Zona lumbar pegada al suelo. Estira brazo y pierna contrarios lentamente.', '/ejercicios/Dead_Bug/0.webp', 'v4_dead_bug', 'core', 'core_anti', false),
    ('c9a47917-ed18-5970-815b-e3194f401d12', 'Rueda abdominal', 'Core', 'avanzado', 'Peso corporal', 'De rodillas, rueda hacia adelante sin arquear la espalda y regresa con el abdomen.', '/ejercicios/Ab_Roller/0.webp', 'v4_rueda_abdominal', 'core', 'core_anti', false),
    ('a1317c5b-c00d-5de2-9c55-c9b5dd833fe4', 'Crunch en polea alta', 'Core', 'intermedio', 'Poleas / cruce de poleas', 'De rodillas, flexiona el tronco llevando los codos a las rodillas. La cadera no se mueve.', '/ejercicios/Cable_Crunch/0.webp', 'v4_crunch_polea', 'core', 'core_flex', false),
    ('471e7c11-180e-5794-95b5-2ddb342f8b4e', 'Crunch abdominal', 'Core', 'principiante', 'Peso corporal', 'Despega solo los hombros del suelo exhalando. No tires del cuello.', '/ejercicios/Crunches/0.webp', 'v4_crunch', 'core', 'core_flex', false),
    ('5cfaddf4-a409-5f55-9efb-4c2effa27ef7', 'Crunch inverso', 'Core', 'principiante', 'Peso corporal', 'Lleva las rodillas al pecho despegando la cadera del suelo, baja lento.', '/ejercicios/Reverse_Crunch/0.webp', 'v4_crunch_inverso', 'core', 'core_flex', false),
    ('16bd431d-0374-5fc8-87c6-1e6f2b61dd5a', 'Crunch en banco declinado', 'Core', 'intermedio', 'Banco press pecho declinado', 'Pies asegurados. Sube a media altura manteniendo tensión abdominal.', '/ejercicios/Decline_Crunch/0.webp', 'v4_crunch_declinado', 'core', 'core_flex', false),
    ('b3a8275d-517c-55b4-9555-355bc23e834a', 'Elevación de rodillas en paralelas', 'Core', 'principiante', 'Barras paralelas', 'Apoyado en antebrazos o brazos estirados, sube las rodillas al pecho sin balanceo.', '/ejercicios/Knee_Hip_Raise_On_Parallel_Bars/0.webp', 'v4_elevacion_rodillas_paralelas', 'calistenia', 'core_flex', false),
    ('fbac4575-6344-536e-aab2-e05fc2cf2510', 'Elevación de piernas colgado', 'Core', 'avanzado', 'Barra de dominadas', 'Colgado de la barra, sube las piernas rectas hasta 90° controlando la bajada.', '/ejercicios/Hanging_Leg_Raise/0.webp', 'v4_elevacion_piernas_colgado', 'calistenia', 'core_flex', false),
    ('7dcff1e2-b175-5547-a579-605cf16fe081', 'Press Pallof', 'Core', 'principiante', 'Poleas / cruce de poleas', 'De lado a la polea, empuja al frente y resiste la rotación 2 segundos.', '/ejercicios/Pallof_Press/0.webp', 'v4_pallof', 'core', 'core_rot', false),
    ('314ab625-ec1b-5cca-97f5-3637db7575f4', 'Leñador en polea', 'Core', 'intermedio', 'Poleas / cruce de poleas', 'Rota desde la cadera y el tronco llevando la polea en diagonal.', '/ejercicios/Standing_Cable_Wood_Chop/0.webp', 'v4_lenador_polea', 'core', 'core_rot', false),
    ('68c1b5ab-5ebf-52dc-9bc1-29ed057617ee', 'Giros rusos', 'Core', 'intermedio', 'Peso corporal', 'Torso inclinado atrás, gira de lado a lado con control.', '/ejercicios/Russian_Twist/0.webp', 'v4_giros_rusos', 'core', 'core_rot', false),
    ('a4af769f-203e-50e0-88be-a5450c613a86', 'Escaladores (mountain climbers)', 'Core', 'principiante', 'Peso corporal', 'Posición de plancha alta, lleva las rodillas al pecho alternando a ritmo constante.', '/ejercicios/Mountain_Climbers/0.webp', 'v4_mountain_climbers', 'funcional', 'funcional', true),
    ('c8cb108e-d919-5015-aeeb-f2f8ed9b8ec7', 'Burpees', 'Cuerpo completo', 'intermedio', 'Peso corporal', 'Baja a plancha, flexión opcional, recoge piernas y salta. Ritmo constante, técnica primero.', null, 'v4_burpees', 'funcional', 'funcional', true),
    ('317c5005-b8bc-5562-bcfd-1f47af1ec98c', 'Thruster con mancuernas', 'Cuerpo completo', 'intermedio', 'Mancuernas', 'Sentadilla frontal con mancuernas y al subir empuja sobre la cabeza en un solo movimiento.', '/ejercicios/Kettlebell_Thruster/0.webp', 'v4_thruster_mancuernas', 'funcional', 'funcional', true),
    ('e6f6fd29-8bed-5ee6-8586-aaabf0d4a730', 'Caminata del granjero', 'Cuerpo completo', 'principiante', 'Mancuernas', 'Mancuernas pesadas a los lados, camina erguido con pasos cortos y abdomen firme.', '/ejercicios/Farmers_Walk/0.webp', 'v4_caminata_granjero', 'funcional', 'funcional', true),
    ('2de2a431-56b2-5704-830d-4df79c10cc5a', 'Swing con kettlebell', 'Cuerpo completo', 'intermedio', 'Kettlebells', 'Impulso desde la cadera (no con los brazos). Sube la kettlebell a la altura del pecho.', '/ejercicios/One-Arm_Kettlebell_Swings/0.webp', 'v4_swing_kettlebell', 'funcional', 'funcional', true),
    ('966c6760-67f7-5081-b637-13560d4c1c4f', 'Lanzamientos de balón medicinal', 'Cuerpo completo', 'principiante', 'Balón medicinal', 'Sube el balón sobre la cabeza y lánzalo al suelo con fuerza usando abdomen.', '/ejercicios/One-Arm_Medicine_Ball_Slam/0.webp', 'v4_slam_balon', 'funcional', 'funcional', true),
    ('78804335-afd0-593e-b15e-c537d08a0840', 'Saltos al cajón', 'Cuádriceps', 'intermedio', 'Cajón pliométrico', 'Salta con ambos pies y aterriza suave. Baja caminando, no saltando.', '/ejercicios/Front_Box_Jump/0.webp', 'v4_salto_cajon', 'funcional', 'funcional', true),
    ('a83ad304-0d8b-5c3f-9ed0-a37e1aba6999', 'Saltar la cuerda', 'Cardio', 'principiante', 'Cuerda para saltar', 'Saltos pequeños sobre las puntas, muñecas giran la cuerda.', '/ejercicios/Rope_Jumping/0.webp', 'v4_saltar_cuerda', 'funcional', 'funcional', false),
    ('d23f1a35-b123-5294-9a9f-ce27988cc196', 'Sentadilla al banco a ritmo', 'Cuádriceps', 'principiante', 'Banco plano', 'Siéntate suave en el banco y ponte de pie sin impulso. Ritmo constante, sin saltar.', '/ejercicios/Chair_Squat/0.webp', 'v4_sentadilla_banco_ritmo', 'funcional', 'funcional', true),
    ('26959ab6-9ed0-53fd-86a9-44b033e75ff7', 'Subida al banco con elevación de rodilla', 'Cuádriceps', 'principiante', 'Banco plano', 'Sube al banco, eleva la rodilla contraria y baja controlado. Alterna piernas.', '/ejercicios/Step-up_with_Knee_Raise/0.webp', 'v4_step_up_rodilla', 'funcional', 'funcional', true),
    ('fa5d19e2-e8b6-58a1-8646-f314c590e8cb', 'Press de pecho de pie en polea', 'Pecho', 'principiante', 'Poleas / cruce de poleas', 'De pie con un pie adelante, empuja las manijas al frente y regresa controlado.', '/ejercicios/Standing_Cable_Chest_Press/0.webp', 'v4_press_pecho_polea_pie', 'fuerza', 'emp_h', true),
    ('c1bf2db4-e834-5569-8262-ae1e5528d22b', 'Elevación diagonal en polea', 'Core', 'principiante', 'Poleas / cruce de poleas', 'Desde la cadera hacia arriba en diagonal, girando el tronco con el abdomen firme.', '/ejercicios/Standing_Cable_Lift/0.webp', 'v4_elevacion_polea_diagonal', 'core', 'core_rot', false),
    ('65a5afe3-e4c9-50b8-9133-ce519108cb5e', 'Jumping jacks', 'Cardio', 'principiante', 'Peso corporal', 'Abre piernas y brazos a la vez de forma rítmica.', '/ejercicios/Star_Jump/0.webp', 'v4_jumping_jacks', 'funcional', 'funcional', false),
    ('3c6e01c1-db76-53d4-8dc2-9cfbda8c560e', 'Caminata inclinada en caminadora', 'Cardio', 'principiante', 'Caminadora', 'Inclinación 8-12%, ritmo en el que puedas hablar con dificultad. Sin sostenerte de las barras.', '/ejercicios/Walking_Treadmill/0.webp', 'v4_caminadora_inclinada', 'cardio', 'cardio', false),
    ('20bcc49b-c5b7-5cfc-9416-97094b65ef3a', 'Intervalos en caminadora', 'Cardio', 'intermedio', 'Caminadora', 'Alterna 30 s rápido / 60 s suave. Ajusta la velocidad a tu nivel.', '/ejercicios/Running_Treadmill/0.webp', 'v4_intervalos_caminadora', 'cardio', 'cardio', false),
    ('f755c7fe-529d-5bcd-b81f-09a0ef1b17e7', 'Bicicleta estática', 'Cardio', 'principiante', 'Bicicleta estática', 'Cadencia constante, resistencia moderada. Rodilla levemente flexionada abajo.', '/ejercicios/Bicycling_Stationary/0.webp', 'v4_bicicleta', 'cardio', 'cardio', false),
    ('de64bbc2-5d09-5227-bc3c-2ca801f4e01d', 'Intervalos en bicicleta', 'Cardio', 'intermedio', 'Bicicleta estática', 'Alterna 20 s a máxima intensidad / 40 s suave.', '/ejercicios/Recumbent_Bike/0.webp', 'v4_intervalos_bicicleta', 'cardio', 'cardio', false),
    ('afb79463-8bb9-5d86-a822-ce218662c214', 'Elíptica', 'Cardio', 'principiante', 'Elíptica', 'Ritmo constante empujando y tirando con brazos y piernas.', '/ejercicios/Elliptical_Trainer/0.webp', 'v4_eliptica', 'cardio', 'cardio', false),
    ('99a8d608-59cc-56eb-8450-7c762cf65c49', 'Remo ergómetro', 'Cardio', 'principiante', 'Remo ergómetro', 'Piernas - espalda - brazos al tirar; brazos - espalda - piernas al regresar.', '/ejercicios/Rowing_Stationary/0.webp', 'v4_remo_cardio', 'cardio', 'cardio', false)
    ) as v(id, nombre, grupo, nivel, equipo, tecnica, imagen, codigo, tipo, patron, compuesto)
  loop
    begin
      insert into public.app_ejercicios
        (id, nombre, grupo_muscular, nivel, equipamiento, descripcion, tecnica, imagen_url,
         activo, requiere_equipamiento, codigo, tipo, patron_movimiento, es_compuesto)
      values
        (r.id::uuid, r.nombre, r.grupo, r.nivel, r.equipo, r.tecnica, r.tecnica, r.imagen,
         true, true, r.codigo, r.tipo, r.patron, r.compuesto)
      on conflict (id) do nothing;
      v_ok := v_ok + 1;
    exception when others then
      begin
        insert into public.app_ejercicios
          (id, nombre, grupo_muscular, nivel, equipamiento, descripcion, tecnica, imagen_url,
           activo, requiere_equipamiento, codigo, tipo, patron_movimiento, es_compuesto)
        values
          (r.id::uuid, r.nombre, r.grupo, coalesce(v_nivel, r.nivel), r.equipo, r.tecnica, r.tecnica, r.imagen,
           true, true, r.codigo, coalesce(v_tipo, r.tipo), coalesce(v_patron, r.patron), r.compuesto)
        on conflict (id) do nothing;
        v_ok := v_ok + 1;
      exception when others then
        v_error := v_error + 1;
        raise notice 'No se pudo registrar %: %', r.codigo, sqlerrm;
      end;
    end;

    if v_equipo is not null then
      begin
        insert into public.app_ejercicio_equipamiento (ejercicio_id, equipamiento_id, grupo_requisito, notas)
        select r.id::uuid, v_equipo, 1, 'Exclusivo motor v4'
        where not exists (
          select 1 from public.app_ejercicio_equipamiento x
          where x.ejercicio_id = r.id::uuid and x.equipamiento_id = v_equipo
        );
      exception when others then
        null;
      end;
    end if;
  end loop;

  raise notice 'Ejercicios del motor v4 registrados: %. Con error: %.', v_ok, v_error;
end
$$;

-- Verificación: debe devolver 116
select count(*) as ejercicios_motor_v4 from public.app_ejercicios where codigo like 'v4\_%';
