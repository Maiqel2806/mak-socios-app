'use client'

const POSES = {
  saluda: 0,
  explica: 1,
  piensa: 2,
  motiva: 3,
  entrena: 4,
  celebra: 5,
  aprueba: 6,
  descansa: 7,
}

export default function MaikPose({
  pose = 'saluda',
  size = 74,
  className = '',
}) {
  const numero = POSES[pose] ?? 0
  const columna = numero % 4
  const fila = Math.floor(numero / 4)

  return (
    <span
      className={`maik-pose ${className}`}
      role="img"
      aria-label={`MAIK ${pose}`}
      style={{
        width: size,
        height: size,
        backgroundPosition: `${columna / 3 * 100}% ${fila * 100}%`,
      }}
    />
  )
}
