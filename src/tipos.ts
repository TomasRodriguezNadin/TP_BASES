export const Experiencia = {
    "principiante": 0,
    "mediano": 1,
    "experimentado": 2
} as const;

export type claveExperiencia = keyof typeof Experiencia;
