import { YouthDriver } from '../models';

interface DriverNamePool {
  nationality: string;
  firstNames: string[];
  lastNames: string[];
}

const NAME_POOLS: DriverNamePool[] = [
  {
    nationality: 'España',
    firstNames: ['Mateo', 'Lucas', 'Hugo', 'Martín', 'Alejandro', 'Álvaro', 'Pablo', 'Leo', 'Daniel', 'Marcos'],
    lastNames: ['Navarro', 'Delgado', 'Romero', 'Serrano', 'Torres', 'Medina', 'Reyes', 'Castro', 'Iglesias', 'Vázquez'],
  },
  {
    nationality: 'Reino Unido',
    firstNames: ['Oliver', 'George', 'Harry', 'Jack', 'Arthur', 'Freddie', 'Archie', 'Leo', 'Charlie', 'Henry'],
    lastNames: ['Smith', 'Taylor', 'Davies', 'Evans', 'Wilson', 'Thomas', 'Roberts', 'Walker', 'Wright', 'Robinson'],
  },
  {
    nationality: 'Francia',
    firstNames: ['Gabriel', 'Léo', 'Raphaël', 'Louis', 'Arthur', 'Jules', 'Maël', 'Lucas', 'Adam', 'Hugo'],
    lastNames: ['Moreau', 'Laurent', 'Simon', 'Michel', 'Lefebvre', 'Leroy', 'Roux', 'David', 'Bertrand', 'Morel'],
  },
  {
    nationality: 'Alemania',
    firstNames: ['Noah', 'Matteo', 'Leon', 'Paul', 'Emil', 'Felix', 'Jonas', 'Elias', 'Lukas', 'Maximilian'],
    lastNames: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann'],
  },
  {
    nationality: 'Italia',
    firstNames: ['Leonardo', 'Francesco', 'Alessandro', 'Lorenzo', 'Mattia', 'Tommaso', 'Gabriele', 'Riccardo', 'Edoardo', 'Matteo'],
    lastNames: ['Rossi', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno'],
  },
  {
    nationality: 'Brasil',
    firstNames: ['Miguel', 'Arthur', 'Gael', 'Heitor', 'Bernardo', 'Davi', 'Gabriel', 'Noah', 'Pedro', 'Lucas'],
    lastNames: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes'],
  },
  {
    nationality: 'Japón',
    firstNames: ['Haruto', 'Sota', 'Yuto', 'Riku', 'Haruki', 'Ren', 'Kento', 'Taiga', 'Hinata', 'Kaito'],
    lastNames: ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato'],
  },
  {
    nationality: 'Países Bajos',
    firstNames: ['Sem', 'Lucas', 'Milan', 'Daan', 'Levi', 'Finn', 'Liam', 'Jesse', 'Luuk', 'Bram'],
    lastNames: ['De Jong', 'Jansen', 'De Vries', 'Van de Berg', 'Van Dijk', 'Bakker', 'Janssen', 'Visser', 'Smit', 'Meijer'],
  },
  {
    nationality: 'Argentina',
    firstNames: ['Mateo', 'Bautista', 'Juan', 'Felipe', 'Benicio', 'Joaquín', 'Santino', 'Ignacio', 'Valentino', 'Tomás'],
    lastNames: ['González', 'Rodríguez', 'López', 'Martínez', 'Gómez', 'Díaz', 'Álvarez', 'Romero', 'Sosa', 'Benítez'],
  },
  {
    nationality: 'Australia',
    firstNames: ['Oliver', 'Noah', 'Leo', 'William', 'Henry', 'Jack', 'Theodore', 'Hudson', 'Charlie', 'Luca'],
    lastNames: ['Smith', 'Jones', 'Williams', 'Brown', 'Wilson', 'Taylor', 'Johnson', 'White', 'Martin', 'Anderson'],
  },
];

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let youthCounter = 0;

/**
 * Procedurally generates a single youth driver.
 * Satisfies AC-05.1 & RF-5.2:
 * - Age between 16 and 19.
 * - Reduced base stats (Pace: 55-72, Consistency: 50-70).
 * - High potential (82-98).
 * - Morale: 70-85.
 * - Unique ID and realistic names/nationalities.
 */
export function generateSingleYouthDriver(seedPrefix = 'youth'): YouthDriver {
  youthCounter += 1;
  const pool = NAME_POOLS[getRandomInt(0, NAME_POOLS.length - 1)];
  const firstName = pool.firstNames[getRandomInt(0, pool.firstNames.length - 1)];
  const lastName = pool.lastNames[getRandomInt(0, pool.lastNames.length - 1)];

  const uniqueSuffix = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}-${youthCounter}`;
  const id = `${seedPrefix}-${uniqueSuffix}`;

  const age = getRandomInt(16, 19);
  const pace = getRandomInt(55, 72);
  const consistency = getRandomInt(50, 70);
  const potential = getRandomInt(Math.max(82, pace + 10), 98);
  const morale = getRandomInt(70, 85);

  return {
    id,
    name: `${firstName} ${lastName}`,
    age,
    nationality: pool.nationality,
    pace,
    consistency,
    potential,
    morale,
    teamId: null,
  };
}

/**
 * Generates an annual batch of prospective youth drivers.
 * Satisfies AC-05.1.
 */
export function generateYouthDriverPool(count = 8, seasonNumber = 1): YouthDriver[] {
  const drivers: YouthDriver[] = [];
  const generatedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let driver = generateSingleYouthDriver(`youth-s${seasonNumber}`);
    // Prevent duplicate names within the same batch
    while (generatedNames.has(driver.name)) {
      driver = generateSingleYouthDriver(`youth-s${seasonNumber}`);
    }
    generatedNames.add(driver.name);
    drivers.push(driver);
  }

  return drivers;
}
