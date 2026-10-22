# PRD: F1 Manager Web (Arcade)

| Documento | Product Requirements Document (PRD) |
| :--- | :--- |
| **Versión** | 1.1 (MVP - Especificación Cerrada) |
| **Estado** | Aprobado para desarrollo |
| **Referencia** | [briefing.md](file:///home/cristian-dev/dev/f1manager/briefing.md) |
| **Tipo de Proyecto** | Personal y educativo |

---

## 1. Resumen Ejecutivo y Objetivos

### 1.1. Propósito del Producto
Crear un juego de gestión deportiva arcade para navegador web, centrado en la Fórmula 1, rápido y accesible. El jugador asume el rol de Director de Equipo (*Team Principal*), tomando decisiones estratégicas de personal, monoplaza, finanzas y academia a lo largo de un periplo de hasta **10 temporadas**, con posibilidad de cambiar de escudería y culminando en una **pantalla de legado**.

### 1.2. Principios de Diseño
* **Arcade & Ágil:** Sesiones directas sin microgestión en pista; cada Gran Premio se resuelve en pocos clics.
* **Local-First & Offline:** Cero dependencia de servidores o autenticación. Todo el estado vive y se procesa en el dispositivo del usuario, con opción de exportar/importar partida en JSON.
* **Simulación Transparente y Configurable:** Resultados determinados por coche, piloto y circuito, con ponderaciones centralizadas en un archivo de configuración accesible y calibrable.

### 1.3. Métricas de Éxito del MVP
* **Rejugabilidad:** Jugadores completando al menos 3 a 5 temporadas consecutivas en una misma partida (con meta de completar las 10 temporadas).
* **Retención:** El jugador retoma su partida guardada localmente durante varios días seguidos.
* **Estabilidad y Portabilidad:** Cero pérdidas de datos y portabilidad garantizada mediante importación/exportación JSON.

---

## 2. Stack Tecnológico y Arquitectura Técnica

### 2.1. Tecnologías Principales
* **Framework Web:** **Next.js** (App Router).
* **Despliegue y Ejecución:** Exportación estática (*Static Site Generation / SSG* / `output: 'export'`) para permitir ejecución 100% *client-side* sin servidor Node.js en producción.
* **Capacidades PWA:**
  * *Service Worker* para cacheo exhaustivo de assets estáticos (código, imágenes, estilos, fuentes).
  * Web App Manifest (`manifest.json`) para instalación en pantalla de inicio en Android, iOS y escritorio.
* **Persistencia y Portabilidad de Datos:**
  * **IndexedDB** como base de datos principal en el cliente para partidas guardadas, historial de temporadas, estadísticas y estado actual.
  * Módulo de **Exportación / Importación en JSON** para copias de seguridad locales y transferencia entre dispositivos.
* **Backend y Autenticación:** **Ninguno en el MVP**. No existen APIs externas, ni base de datos remota, ni inicio de sesión.

---

## 3. Modelo de Datos y Entidades

### 3.1. Perfil del Jugador / Team Principal (`ManagerProfile`)
* `id`: Identificador único.
* `currentTeamId`: ID de la escudería actual.
* `currentSeason`: Temporada en curso (1 a 10).
* `currentRaceIndex`: Índice del Gran Premio actual (0 a 23).
* `tpRating`: **Rating oculto de Team Principal (0 a 100)**. Calculado dinámicamente según cumplimiento de objetivos de la directiva, victorias, podios, eficiencia financiera y títulos. Determina el interés de otros equipos en contratar al jugador.
* `careerStats`: Historial de carreras disputadas, victorias, podios, puntos y campeonatos ganados.

### 3.2. Escudería (`Team`)
* `id`: Identificador único.
* `name`: Nombre de la escudería real.
* `budget`: Presupuesto disponible en cuenta bancaria.
* `boardExpectations`: Objetivo de la junta directiva (ej. posición mínima en el Mundial de Constructores).
* `reputation`: Nivel de prestigio base para negociaciones y patrocinios.
* `carId`: Referencia a su monoplaza.
* `driverIds`: Array de IDs de los 2 pilotos titulares.
* `engineerId`: ID del jefe de ingenieros titular.
* `facilities`: Nivel de Fábrica y Simulador.
* `youthDriverIds`: Array de 1-2 jóvenes promesas de la academia.

### 3.3. Coche (`Car`)
* `topSpeed`: Velocidad punta (valor numérico base).
* `downforce`: Carga aerodinámica / paso por curva (valor numérico base).
* `reliability`: Fiabilidad (determina la probabilidad de averías mecánicas y abandonos).

### 3.4. Piloto (`Driver`)
* `id`, `name`, `age`, `nationality`: Datos biográficos.
* `pace`: Ritmo y velocidad pura en pista.
* `consistency`: Consistencia (reduce errores no forzados en clasificación y carrera).
* `potential`: Margen de crecimiento anual de sus estadísticas.
* `morale`: Estado anímico (afectado por resultados recientes y cumplimiento de expectativas).
* `salary`: Salario por temporada.
* `contractYears`: Años restantes de contrato.

### 3.5. Jefe de Ingenieros (`ChiefEngineer`)
* `id`, `name`: Identificación.
* `developmentEfficiency`: Eficiencia de desarrollo (acelera tiempos y reduce costes de mejoras del coche).
* `setupPerformance`: Capacidad de puesta a punto (bonificación a los atributos del coche según el circuito).
* `morale`: Estado anímico (fluctúa con los resultados deportivos y éxitos/fracasos técnicos; determina probabilísticamente si una mejora en desarrollo resulta exitosa o fallida).
* `salary`: Salario por temporada.
* `contractYears`: Años restantes de contrato.

### 3.6. Circuito (`Circuit`)
* `id`, `name`, `country`: Datos del Gran Premio.
* `round`: Número de ronda en el calendario (1 a 24).
* `topSpeedDemand`: Ponderación de exigencia en velocidad punta (0.0 a 1.0).
* `downforceDemand`: Ponderación de exigencia en carga aerodinámica (0.0 a 1.0).
* `reliabilityDemand`: Grado de severidad para la mecánica (probabilidad base de incidencias).
* `laps`: Número de vueltas (dato de contexto visual para la pantalla final).

### 3.7. Instalaciones (`Facilities`)
* `factoryLevel`: Nivel de fábrica (acelera y abarata paquetes de mejora del monoplaza).
* `simulatorLevel`: Nivel de simulador (acelera el desarrollo anual de pilotos titulares y promesas).

### 3.8. Patrocinadores (`SponsorContract`)
* `id`, `name`: Marca patrocinadora.
* `baseIncomePerRace`: Pago fijo garantizado por Gran Premio.
* `bonusTarget`: Meta de posición en carrera (ej. "Top 10").
* `bonusIncome`: Recompensa extra si se cumple la meta.
* `remainingRaces`: Carreras de vigencia del contrato.

---

## 4. Requisitos Funcionales del MVP

### RF-1: Gestión de Partida y Selección de Escudería
* **RF-1.1:** Al iniciar una nueva partida, el jugador escoge cualquiera de las escuderías oficiales con sus estadísticas, presupuesto inicial y objetivos de la directiva.
* **RF-1.2:** Se inicializa el perfil de Team Principal con un `tpRating` acorde a la dificultad del equipo elegido.
* **RF-1.3:** Solo existe una partida activa por dispositivo, guardada automáticamente en `IndexedDB`.

### RF-2: Panel de Fábrica, Finanzas y Reparaciones por DNF
* **RF-2.1:** **Balance Económico:** Panel con saldo actual, ingresos proyectados (patrocinios + premios) y costes fijos (salarios y mantenimiento).
* **RF-2.2:** **Costes de Reparación por Incidentes / DNF:** Si un monoplaza sufre un abandono (accidente o avería mecánica grave), se aplica una sanción económica por coste de reparación que se deduce del presupuesto al término del Gran Premio.
* **RF-2.3:** **Bancarrota:** Si el saldo negativo de la escudería excede el límite de deuda permitido, se declara la quiebra del equipo y se fuerza el fin de contrato del Director Deportivo.

### RF-3: Desarrollo del Coche
* **RF-3.1:** Inversión en mejorar los 3 atributos del coche: *Top Speed*, *Downforce* y *Reliability*.
* **RF-3.2:** **Límite de Concurrencia:** La escudería puede tener un máximo de **2 desarrollos en paralelo simultáneos**, condicionado a disponer de presupuesto suficiente.
* **RF-3.3:** Tiempos de desarrollo medidos en número de Grandes Premios. El nivel de Fábrica y la eficiencia del Jefe de Ingenieros reducen el coste y tiempo de cada mejora.
* **RF-3.4:** **Éxito vs. Fallo Técnico:** Al cumplirse el plazo, se evalúa si la mejora es exitosa o fallida en función de la `morale` del Jefe de Ingenieros. Si falla:
  * El atributo no incrementa su rendimiento.
  * El Jefe de Ingenieros sufre una pérdida fija y leve de **3 puntos de moral**.
  * Se habilita la opción de **reintentar la mejora con un 50% de descuento** sobre el coste base.

### RF-4: Mercado de Personal (Fichajes y Renovaciones)
* **RF-4.1:** Catálogo de pilotos e ingenieros con estadísticas visibles, salarios y años de contrato.
* **RF-4.2:** Ofertas de contratación y renovación antes del término del año.
* **RF-4.3:** Si un contrato vence sin renovación, el empleado pasa a la agencia libre.

### RF-5: Academia Mínima de Jóvenes Pilotos
* **RF-5.1:** Límite estricto de 1 a 2 plazas para jóvenes promesas.
* **RF-5.2:** **Generación Procedural y Ficticia:** Cada temporada se genera una hornada de pilotos ficticios juveniles con bajo `Pace` y alto `Potential`.
* **RF-5.3:** **Coste Operativo:** Las jóvenes promesas **no tienen un salario individual separado**; sus costes de manutención y entrenamiento quedan íntegramente cubiertos por el coste de mantenimiento de las instalaciones del `Simulador`.
* **RF-5.4:** Progresión acelerada anual según el nivel del `Simulador`.
* **RF-5.5:** Opción de ascender a una joven promesa al asiento titular en cualquier momento en que haya una plaza vacante.

### RF-6: Motor de Simulación del Fin de Semana (24 Carreras Reales)
* **RF-6.1:** **Calendario Oficial Completo:** La temporada consta de las **24 carreras reales** de la temporada de F1.
* **RF-6.2:** **Configuración Modular (`simulationConfig.ts`):** Todos los coeficientes y pesos de cálculo viven en un archivo de configuración tipado y desacoplado, lo que permite calibrar el equilibrio sin tocar la lógica del juego.
* **RF-6.3:** **Fórmula de Clasificación (Qualy):**
  El índice de rendimiento en clasificación ($R_{\text{qualy}}$) para cada piloto se calcula como:
  $$R_{\text{qualy}} = w_{\text{car\_q}} \cdot \text{CarPerf} + w_{\text{driver\_q}} \cdot \text{DriverQualy} + \text{SetupBonus} + \epsilon_{\text{qualy}}$$
  * **Pesos por defecto:**
    * Monoplaza ($w_{\text{car\_q}}$): **0.50** (ponderando *Top Speed* y *Downforce* según las demandas del circuito).
    * Piloto ($w_{\text{driver\_q}}$): **0.40** ($0.7 \cdot \text{Pace} + 0.3 \cdot \text{Consistency}$).
    * Circuito / Puesta a punto ($\text{SetupBonus}$): **0.10** (Jefe de ingenieros y adecuación).
    * Ruido aleatorio ($\epsilon_{\text{qualy}}$): distribución normal acotada.
  * **Incidentes de Qualy:** Probabilidad de error o problema mecánico leve que desplaza al piloto a las últimas posiciones de parrilla.
* **RF-6.4:** **Fórmula de Carrera y DNF Binario:**
  * **Evaluación de DNF (Abandono):** Probabilidad binaria de abandono:
    $$P(\text{DNF}) = (1 - \text{Reliability}) \cdot \text{ReliabilityDemand} \cdot k_{\text{mech}} + (1 - \text{Consistency}) \cdot k_{\text{crash}}$$
    Si ocurre DNF, el piloto no finaliza, no puntúa y el equipo recibe la sanción económica de reparación.
  * **Rendimiento en Carrera:**
    $$R_{\text{race}} = w_{\text{grid}} \cdot \text{GridPosScore} + w_{\text{car\_r}} \cdot \text{CarPerf} + w_{\text{driver\_r}} \cdot (\text{Pace} \times \text{MoraleMultiplier}) + \text{SetupBonus} + \epsilon_{\text{race}}$$
    * **Pesos por defecto:**
      * Posición de salida ($w_{\text{grid}}$): **0.35**
      * Rendimiento del monoplaza ($w_{\text{car\_r}}$): **0.35**
      * Piloto ($w_{\text{driver\_r}}$): **0.20**
      * Circuito / Puesta a punto: **0.10**
* **RF-6.5:** **Pantalla de Clasificación Final:**
  * Tabla con posiciones 1 a 20, mención explícita de abandonos (DNF) con etiqueta corta (*"Fallo mecánico"* o *"Accidente"*), puntos oficiales F1 (25, 18, 15, 12, 10, 8, 6, 4, 2, 1).
  * Desglose financiero: ingresos de patrocinador (base + bonos conseguidos) menos costes de reparación proporcionales al nivel de mejora del monoplaza en caso de DNF.
  * Tablas actualizadas del Mundial de Pilotos y de Constructores.
* **RF-6.6:** **Fluctuación de Moral Post-Carrera:** Al término del Gran Premio:
  * Si el piloto o la escudería cumple o supera las expectativas deportivas: $+5$ puntos fijos de moral.
  * Si rinde por debajo de lo esperado o sufre abandono por accidente: $-5$ puntos fijos de moral.

### RF-7: IA de Escuderías Rivales
* **RF-7.1:** Los 9 equipos rivales mejoran sus coches de forma autónoma.
* **RF-7.2:** Participan en el mercado de fichajes contratando personal disponible y renovando sus estrellas.
* **RF-7.3:** Sufren el impacto económico de sus propios DNF y resultados.

### RF-8: Ciclo entre Temporadas, Mercado de Team Principal y Pantalla de Legado
* **RF-8.1:** **Fin de Temporada:** Reparto de premios económicos de la FIA según puesto en Constructores y envejecimiento/desarrollo de pilotos.
* **RF-8.2:** **Cálculo del Rating de Team Principal (`tpRating`):**
  * Cumplir o superar objetivos de la directiva aumenta el `tpRating`.
  * No alcanzar objetivos, generar déficits o encadenar malos resultados disminuye el `tpRating`.
* **RF-8.3:** **Mercado de Fichajes de Team Principal (Movilidad de Equipos):**
  * Al finalizar una temporada, el jugador puede recibir **ofertas de otras escuderías** si su `tpRating` cumple con el prestigio del equipo interesado.
  * El jugador puede elegir:
    1. Renovar y continuar en su escudería actual.
    2. Aceptar la oferta de una nueva escudería para la siguiente temporada.
* **RF-8.4:** **Destitución no binaria:**
  * Si la directiva actual destituye al jugador por bajo rendimiento, este pasa a la agencia libre de directores.
  * Si su `tpRating` le otorga acceso a escuderías de menor o igual rango, recibirá ofertas de rescate.
  * Solo se produce *Game Over* definitivo si ninguna escudería le ofrece contrato o si se produce bancarrota total.
* **RF-8.5:** **Límite de 10 Temporadas y Pantalla de Legado:**
  * El juego tiene una duración máxima de **10 temporadas**.
  * Al finalizar la 10ª temporada, se desbloquea la **Pantalla de Legado**, mostrando:
    * Historial de títulos de Pilotos y Constructores conseguidos.
    * Equipos dirigidos a lo largo de la trayectoria.
    * Récord total de victorias, podios y puntos.
    * Valoración final de la carrera y rango honorífico de Team Principal.

### RF-9: Persistencia Local, PWA y Exportación/Importación JSON
* **RF-9.1:** Guardado automático local en `IndexedDB` tras cada Gran Premio y decisión de gestión.
* **RF-9.2:** Funcionamiento 100% desconectado (*offline-first*) vía Service Worker.
* **RF-9.3:** **Exportar Partida (`Export JSON`):** Botón accesible en el menú de ajustes que descarga un archivo `f1manager_save_[timestamp].json` con el estado íntegro de la partida.
* **RF-9.4:** **Importar Partida (`Import JSON`):** Modal que permite seleccionar un archivo JSON, valida su estructura y esquema de datos, y sobreescribe el estado local para continuar la partida en otro navegador o dispositivo.

---

## 5. Matriz de Alcance: MVP vs. Fuera de Alcance

| Funcionalidad | En el MVP | Fuera del Alcance (Futuro) | Justificación / Detalle |
| :--- | :---: | :---: | :--- |
| **Elección de escudería real** |  Sí | — | Base de la experiencia. |
| **Calendario de 24 carreras reales** |  Sí | — | Fidelidad a la temporada completa de F1. |
| **Simulación de Qualy y Carrera con pantalla final** |  Sí | — | Enfoque arcade directo con fórmulas configurables. |
| **DNF binario y costes de reparación** |  Sí | — | Consecuencia económica de fiabilidad/errores. |
| **Mercado de fichajes (Pilotos e Ingenieros)** |  Sí | — | Core loop de gestión. |
| **Mejoras del coche (3 atributos básicos)** |  Sí | — | Top Speed, Downforce, Reliability. |
| **Academia mínima (1-2 jóvenes)** |  Sí | — | Desarrollo a medio y largo plazo. |
| **Movilidad entre escuderías y Rating oculto de TP** |  Sí | — | Ofertas de otros equipos y opciones tras despido. |
| **Límite de 10 temporadas y Pantalla de Legado** |  Sí | — | Cierre narrativo y rejugabilidad competitiva. |
| **Exportar / Importar JSON** |  Sí | — | Seguridad y portabilidad local-first. |
| **Persistencia offline local-first** |  Sí | — | Sin backend ni cuenta de usuario. |
| **Equipo B / Escudería filial** | ❌ No |  Sí | Excluido explícitamente en el briefing. |
| **Otras categorías (F2, F3 jugables)** | ❌ No |  Sí | Excluido explícitamente en el briefing. |
| **Narración vuelta a vuelta / Vista 2D en carrera** | ❌ No |  Sí | Excluido explícitamente en el briefing. |
| **Estrategia en vivo (boxes, neumáticos, órdenes)** | ❌ No |  Sí | Excluido en el briefing (arcade sin microgestión). |
| **Ranking global / Tabla de marcadores online** | ❌ No |  Sí | Excluido en el briefing (solo local). |
| **Login y sincronización en servidor** | ❌ No |  Sí | Excluido en el briefing (cero cuentas). |

---

## 6. Requisitos No Funcionales (NFR)

* **NFR-1 (Rendimiento):** Carga inicial de la aplicación en menos de 2 segundos en redes 4G estándar; tiempo de simulación de un fin de semana de carreras inferior a 500 ms.
* **NFR-2 (Compatibilidad Responsive):** Interfaz perfectamente adaptable a pantallas táctiles de smartphone (a partir de 360px de ancho), tablets y monitores de sobremesa.
* **NFR-3 (Disponibilidad Offline):** El 100% de los assets y lógica deben estar cacheados en el Service Worker. La aplicación debe arrancar y funcionar con el modo avión activado.
* **NFR-4 (Estética F1 Arcade):** Tema oscuro con colores de contraste inspirados en las escuderías oficiales, tipografía deportiva moderna y microinteracciones visuales en resultados y botones.

---

## 7. Estado de Decisiones de Diseño

Todas las cuestiones de alcance y diseño funcional para el MVP han quedado **resueltas y cerradas**:

| Decisión | Resolución Adoptada | Ubicación en el PRD |
| :--- | :--- | :--- |
| **Fórmulas y Pesos** | Propuesta modular en `simulationConfig.ts` (Qualy: 50% coche, 40% piloto, 10% circuito; Carrera: 35% qualy, 35% coche, 20% piloto, 10% circuito). | Sección 4 (RF-6.2, RF-6.3, RF-6.4) |
| **Calendario** | 24 Grandes Premios oficiales de la temporada real de F1. | Sección 3.6 y 4 (RF-6.1) |
| **Incidentes y DNF** | Binario (termina / no termina, pierde puntos) con sanción económica de reparación de daños. | Sección 4 (RF-2.2 y RF-6.4) |
| **Portabilidad Local** | Importación y exportación de partida en formato JSON. | Sección 2.1 y 4 (RF-9.3, RF-9.4) |
| **Progresión de Carrera** | Límite de 10 temporadas, pantalla de legado, movilidad entre escuderías y rating de Team Principal. | Sección 3.1 y 4 (RF-8.2 a RF-8.5) |
| **Moral de Ingeniero y Fallos** | Moral en Jefe de Ingenieros, fallos de mejora (-3 moral) y reintento con 50% de descuento. | Sección 3.5 y 4 (RF-3.4) |
| **Concurrencia de Mejoras** | Límite de máximo 2 desarrollos de coche en paralelo. | Sección 4 (RF-3.2) |
| **Fluctuación de Moral en GP** | Variación fija de $\pm 5$ puntos de moral tras la carrera según cumplimiento de expectativas. | Sección 4 (RF-6.6) |
| **Coste de Jóvenes Promesas** | Sin salario individual; mantenimiento cubierto por la cuota de las instalaciones del Simulador. | Sección 4 (RF-5.3) |
