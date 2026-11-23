// =============================================================
// Catálogo de equipamiento de MAK FITNESS (valores por defecto)
//
// La fuente de verdad en producción es la tabla Supabase
// `gimnasio_equipamiento` (editable desde /admin/equipamiento).
// Esta lista solo se usa si la tabla aún no existe o está vacía.
//
// `activo: false` = equipo que NO se ha confirmado en el gimnasio.
// El motor nunca usa equipo inactivo.
//
// `incremento_kg` = salto de peso de la máquina (2,5 kg, 3 kg...).
// Solo alimenta los botones + / − del registro de series; el socio
// puede escribir cualquier peso.
// =============================================================

export const ZONAS = {
  peso_libre: 'Peso libre',
  maquinas: 'Máquinas',
  calistenia: 'Calistenia',
  cardio: 'Cardio',
  funcional: 'Funcional',
  general: 'General',
}

export const EQUIPAMIENTO_POR_DEFECTO = [
  // Siempre disponible
  { codigo: 'peso_corporal', nombre: 'Peso corporal', zona: 'general', activo: true, sistema: true },
  { codigo: 'colchoneta', nombre: 'Colchonetas', zona: 'general', activo: true },

  // Peso libre
  { codigo: 'mancuernas', nombre: 'Mancuernas', zona: 'peso_libre', activo: true, incremento_kg: 2 },
  { codigo: 'barra_olimpica', nombre: 'Barra olímpica y discos', zona: 'peso_libre', activo: true, incremento_kg: 2.5 },
  { codigo: 'barra_z', nombre: 'Barra Z', zona: 'peso_libre', activo: true, incremento_kg: 2.5 },
  { codigo: 'banco_plano', nombre: 'Banco plano', zona: 'peso_libre', activo: true },
  { codigo: 'banco_inclinado', nombre: 'Banco inclinado / ajustable', zona: 'peso_libre', activo: true },
  { codigo: 'banco_declinado', nombre: 'Banco press pecho declinado', zona: 'peso_libre', activo: true, nuevo: true },
  { codigo: 'rack_sentadilla', nombre: 'Rack de sentadilla', zona: 'peso_libre', activo: true },

  // Máquinas
  { codigo: 'polea', nombre: 'Poleas / cruce de poleas', zona: 'maquinas', activo: true, incremento_kg: 2.5 },
  { codigo: 'maquina_jalon', nombre: 'Jalón al pecho', zona: 'maquinas', activo: true, incremento_kg: 2.5 },
  { codigo: 'maquina_remo', nombre: 'Remo sentado', zona: 'maquinas', activo: true, incremento_kg: 2.5 },
  { codigo: 'prensa_piernas', nombre: 'Prensa de piernas', zona: 'maquinas', activo: true, incremento_kg: 5 },
  { codigo: 'maquina_extension', nombre: 'Extensión de cuádriceps', zona: 'maquinas', activo: true, incremento_kg: 2.5 },
  { codigo: 'maquina_curl_femoral', nombre: 'Curl femoral', zona: 'maquinas', activo: true, incremento_kg: 2.5 },
  { codigo: 'maquina_press_pecho', nombre: 'Press de pecho en máquina', zona: 'maquinas', activo: true, incremento_kg: 2.5 },
  { codigo: 'maquina_pec_deck', nombre: 'Pec deck / aperturas', zona: 'maquinas', activo: true, incremento_kg: 2.5 },
  { codigo: 'maquina_press_hombro', nombre: 'Press de hombro en máquina', zona: 'maquinas', activo: true, incremento_kg: 2.5 },
  { codigo: 'maquina_hip_thrust', nombre: 'Máquina de hip thrust', zona: 'maquinas', activo: true, incremento_kg: 3, nuevo: true },
  { codigo: 'maquina_smith', nombre: 'Máquina Smith', zona: 'maquinas', activo: false, incremento_kg: 2.5 },
  { codigo: 'maquina_abductores', nombre: 'Abductores / aductores', zona: 'maquinas', activo: false, incremento_kg: 2.5 },
  { codigo: 'maquina_gemelos', nombre: 'Gemelos en máquina', zona: 'maquinas', activo: false, incremento_kg: 2.5 },

  // Calistenia
  { codigo: 'barras_paralelas', nombre: 'Barras paralelas', zona: 'calistenia', activo: true, nuevo: true },
  { codigo: 'barra_dominadas', nombre: 'Barra de dominadas', zona: 'calistenia', activo: true, nuevo: true },
  { codigo: 'silla_romana', nombre: 'Silla romana (lumbar)', zona: 'calistenia', activo: true, nuevo: true },

  // Cardio
  { codigo: 'caminadora', nombre: 'Caminadora', zona: 'cardio', activo: true },
  { codigo: 'bicicleta_estatica', nombre: 'Bicicleta estática', zona: 'cardio', activo: true },
  { codigo: 'eliptica', nombre: 'Elíptica', zona: 'cardio', activo: false },
  { codigo: 'remo_ergometro', nombre: 'Remo ergómetro', zona: 'cardio', activo: false },

  // Funcional
  { codigo: 'cuerda_saltar', nombre: 'Cuerda para saltar', zona: 'funcional', activo: true },
  { codigo: 'kettlebell', nombre: 'Kettlebells', zona: 'funcional', activo: false, incremento_kg: 4 },
  { codigo: 'balon_medicinal', nombre: 'Balón medicinal', zona: 'funcional', activo: false },
  { codigo: 'cajon_pliometrico', nombre: 'Cajón pliométrico', zona: 'funcional', activo: false },
]

/** Devuelve un Map codigo -> equipo, siempre con peso corporal activo. */
export function indexarEquipamiento(lista) {
  const fuente =
    Array.isArray(lista) && lista.length
      ? lista
      : EQUIPAMIENTO_POR_DEFECTO

  const mapa = new Map()

  for (const item of fuente) {
    if (!item?.codigo) continue
    mapa.set(String(item.codigo), {
      ...item,
      activo: item.activo !== false,
      incremento_kg:
        item.incremento_kg === null || item.incremento_kg === undefined
          ? null
          : Number(item.incremento_kg),
    })
  }

  mapa.set('peso_corporal', {
    codigo: 'peso_corporal',
    nombre: 'Peso corporal',
    zona: 'general',
    activo: true,
    sistema: true,
  })

  return mapa
}
