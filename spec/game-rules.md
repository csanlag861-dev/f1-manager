# Reglas de Juego: F1 Manager Web (Arcade)

| Documento | Especificación de Lógica y Mecánicas de Juego (`spec/game-rules.md`) |
| :--- | :--- |
| **Referencias** | [briefing.md](file:///home/cristian-dev/dev/f1manager/briefing.md) \| [prd.md](file:///home/cristian-dev/dev/f1manager/prd.md) \| [spec/scope.md](file:///home/cristian-dev/dev/f1manager/spec/scope.md) \| [spec/domain-model.md](file:///home/cristian-dev/dev/f1manager/spec/domain-model.md) |
| **Versión** | 1.0 (MVP) |

---

## 1. Sistema Económico y Finanzas

El sistema económico regula la supervivencia y el progreso del equipo. Toda cifra monetaria y porcentaje está sujeto a calibración en el archivo de configuración (`simulationConfig.ts`).

### 1.1. Ingresos
1. **Patrocinador Comercial (`SponsorContract`):**
   * **Pago Base por Carrera:** Ingreso fijo y garantizado recibido al término de cada uno de los 24 Grandes Premios.
   * **Bonus por Objetivo:** Ingreso adicional liquidado únicamente si los resultados del Gran Premio cumplen o superan la meta contractual (ej. *"Al menos un piloto en el Top 10"*).
2. **Premios de Temporada de la FIA:**
   * Al término de la carrera 24, se distribuye el fondo de premios según la posición final en el Campeonato Mundial de Constructores (el 1º clasificado recibe el importe máximo y el 10º la dotación mínima reglamentaria).

### 1.2. Gastos
1. **Salarios de la Plantilla:**
   * Prorrateo por Gran Premio ($SalarioAnual / 24$) descontado automáticamente tras cada carrera para:
     * 2 Pilotos Titulares.
     * 1 Jefe de Ingenieros.
2. **Mantenimiento de Instalaciones:**
   * Coste operativo por Gran Premio derivado del nivel de la Fábrica y del Simulador.
   * **Nota de dominio:** El coste operativo del Simulador absorbe íntegramente los gastos de manutención y formación de las jóvenes promesas (sin nómina individual separada).
3. **Paquetes de Desarrollo del Monoplaza:**
   * Pago íntegro adelantado al momento de ordenar una mejora de atributo (*Top Speed, Downforce, Reliability*).
4. **Sanción Económica por Daños / DNF:**
   * Si un monoplaza sufre un abandono (accidente o fallo mecánico grave), se descuenta un coste de reparación calculado proporcionalmente al nivel de desarrollo de los atributos del coche:
     $$\text{CosteReparacion} = \text{BaseRepairCost} \times (1 + k_{\text{upgrade}} \times \text{NivelAtributosCoche})$$
     *(Un coche más evolucionado resulta más costoso de reparar que un coche estándar de fábrica).*

### 1.3. Regla de Bancarrota (*Game Over Económico*)
* La escudería puede operar temporalmente en saldo negativo (números rojos).
* **Umbral de Quiebra:** Se fija como un porcentaje del presupuesto base inicial de la escudería ($MaxDebtPercent$, ajustable por configuración, ej. $25\%$ del presupuesto base).
* Si al finalizar un Gran Premio o temporada la deuda supera dicho umbral:
  $$\text{DeudaActual} > (\text{BaseBudget} \times MaxDebtPercent)$$
  se declara la quiebra técnica inmediata, provocando el **Game Over** por bancarrota.

---

## 2. Mercado de Personal: Fichajes y Renovaciones

### 2.1. Contratación de Pilotos e Ingenieros
* El catálogo de fichajes expone candidatos libres o en otros equipos.
* Para contratar un candidato, el jugador debe:
  1. Disponer de presupuesto suficiente para cubrir el salario anual pactado.
  2. Disponer de una vacante (o asumir la indemnización por despido del titular saliente).
  3. Contar con un prestigio de escudería (`Team.reputation`) igual o superior a la exigencia mínima del piloto/ingeniero.

### 2.2. Renovaciones y Expiración Contractual
* Los contratos se firman por un número entero de temporadas (1 a 3 años).
* Al término de cada temporada, se descuenta 1 año a todos los contratos vigentes.
* Durante la temporada, el jugador puede ofrecer la renovación antes de que expire el contrato.
* Si un contrato llega a 0 años sin renovarse al término del Gran Premio 24, el empleado pasa automáticamente a la **Agencia Libre**.

---

## 3. Desarrollo del Coche e Instalaciones

### 3.1. Proyectos de Mejora Técnica
* El coche posee 3 atributos: **Velocidad Punta (`topSpeed`)**, **Carga Aerodinámica (`downforce`)** y **Fiabilidad (`reliability`)**.
* **Límite de Concurrencia:** La escudería solo puede tener activas un máximo de **2 mejoras simultáneas** en paralelo, siempre que disponga de fondos para financiarlas.
* **Duración y Coste:**
  * Cada mejora requiere un tiempo de desarrollo medido en número de Grandes Premios ($T_{\text{desarrollo}}$).
  * El nivel de **Fábrica** y la **Eficiencia de Desarrollo** del Jefe de Ingenieros reducen proporcionalmente el tiempo y el coste económico.

### 3.2. Influencia de la Moral del Ingeniero: Éxito vs. Fallo Técnico
* Al cumplirse el plazo de entrega de un desarrollo, se evalúa si el paquete es exitoso o fallido en base a la **Moral (`morale`)** del Jefe de Ingenieros:
  $$P(\text{Exito}) = \text{BaseSuccessRate} + (ChiefEngineer.morale \times k_{\text{morale}})$$
* **Si tiene éxito:** El atributo del coche aumenta el valor esperado de forma permanente.
* **Si falla:**
  * La pieza no entrega la ganancia de rendimiento esperada (mejora fallida).
  * El Jefe de Ingenieros sufre una pérdida leve y fija de **3 puntos de moral** (`upgradeFailMoralePenalty = 3`, ajustable por configuración), evitando penalizaciones desproporcionadas.
  * **Reintento con Descuento:** El jugador puede ordenar inmediatamente un reintento del desarrollo sobre la misma pieza con un **50% de descuento** sobre el coste base (`retryUpgradeDiscount = 0.50`, ajustable por configuración), simulando el aprovechamiento del trabajo de I+D previo.

---

## 4. Academia Mínima de Jóvenes Promesas

### 4.1. Generación Procedural y Capacidad
* **Capacidad:** Límite estricto de **0 a 2 plazas** simultáneas por escudería.
* **Generación Anual:** Al inicio de cada temporada, se genera proceduralmente una bolsa de nuevos talentos ficticios juveniles (edad 16-19) con atributos base reducidos pero con un atributo de **Potencial (`potential`)** muy elevado.

### 4.2. Progresión y Promoción
* **Entrenamiento Anual:** Al finalizar cada temporada, las promesas de la academia progresan automáticamente:
  $$\Delta \text{Atributos} = f(YouthDriver.potential, Team.simulatorLevel)$$
* **Promoción:** El jugador puede promover a una joven promesa al asiento titular en cualquier momento en que exista un asiento vacante (por despido, no renovación o venta de un titular).

---

## 5. Simulación de Carreras (Qualy y Carrera)

El resultado del fin de semana depende **exclusivamente del monoplaza, el piloto y el circuito**, incorporando un factor estocástico acotado para reflejar la naturaleza viva del deporte. No existe microgestión en pista.

### 5.1. Sesión de Clasificación (Qualy)
Se calcula un índice de rendimiento de clasificación ($R_{\text{qualy}}$) para cada uno de los 20 pilotos:
$$R_{\text{qualy}} = w_{\text{car\_q}} \cdot \text{CarPerf} + w_{\text{driver\_q}} \cdot \text{DriverQualy} + \text{SetupBonus} + \epsilon_{\text{qualy}}$$

* **Ponderaciones por defecto (ajustables en `simulationConfig.ts`):**
  * **Rendimiento del Monoplaza ($w_{\text{car\_q}} = 0.50$):**
    $$\text{CarPerf} = (Circuit.topSpeedDemand \times Car.topSpeed) + (Circuit.downforceDemand \times Car.downforce)$$
  * **Talento del Piloto ($w_{\text{driver\_q}} = 0.40$):**
    $$\text{DriverQualy} = (0.7 \times Driver.pace) + (0.3 \times Driver.consistency)$$
  * **Puesta a Punto ($SetupBonus = 0.10$):** Derivado de $ChiefEngineer.setupPerformance$.
  * **Factor Estocástico ($\epsilon_{\text{qualy}}$):** Ruido aleatorio distribuido normalmente $\mathcal{N}(0, \sigma_q)$.
* **Incidentes de Clasificación:** Si se activa una probabilidad estocástica castigada por baja $Consistency$ o baja $Reliability$, el piloto sufre un error de vuelta y clasifica automáticamente al fondo de la parrilla (puestos 18-20).

### 5.2. Sesión de Carrera y Cálculo de DNF
1. **Evaluación Binaria de Abandono (DNF):**
   Antes de calcular las posiciones de llegada, se evalúa si cada coche finaliza la prueba:
   $$P(\text{DNF}) = (1 - Car.reliability) \times Circuit.reliabilityDemand \times k_{\text{mech}} + (1 - Driver.consistency) \times k_{\text{crash}}$$
   * Si resulta DNF:
     * El piloto no termina, no puntúa y se asigna una **etiqueta corta tipificada** (*"Fallo mecánico"* si el factor desencadenante fue mecánico, o *"Accidente"* si fue fallo de pilotaje).
     * Se aplica la sanción económica de reparación proporcional al valor del coche.

2. **Rendimiento en Carrera para los Finalistas:**
   Para todos los monoplazas que no sufren DNF, se calcula el índice de carrera ($R_{\text{race}}$):
   $$R_{\text{race}} = w_{\text{grid}} \cdot \text{GridScore} + w_{\text{car\_r}} \cdot \text{CarPerf} + w_{\text{driver\_r}} \cdot (\text{Pace} \times \text{MoraleMod}) + \text{SetupBonus} + \epsilon_{\text{race}}$$
   * **Ponderaciones por defecto (ajustables en `simulationConfig.ts`):**
     * **Posición de Salida ($w_{\text{grid}} = 0.35$):** Puntos derivados del puesto obtenido en Qualy.
     * **Rendimiento del Monoplaza ($w_{\text{car\_r}} = 0.35$):** Idéntica adecuación técnica a las demandas del trazado.
     * **Talento y Moral del Piloto ($w_{\text{driver\_r}} = 0.20$):** $Driver.pace \times (0.9 + 0.2 \times Driver.morale)$.
     * **Puesta a Punto ($SetupBonus = 0.10$).**
     * **Factor Aleatorio de Carrera ($\epsilon_{\text{race}}$):** Distribución $\mathcal{N}(0, \sigma_r)$.

3. **Reparto Oficial de Puntos (Top 10):**
   * 1º: 25 pts | 2º: 18 pts | 3º: 15 pts | 4º: 12 pts | 5º: 10 pts
   * 6º: 8 pts | 7º: 6 pts | 8º: 4 pts | 9º: 2 pts | 10º: 1 pt

### 5.3. Fluctuación de Moral tras el Gran Premio
Al término de cada carrera, se actualiza la moral de los pilotos e ingenieros en base al cumplimiento de expectativas del fin de semana (valores acotados entre 0 y 100):
* **Pilotos:**
  * Si el puesto final cumple o supera la expectativa del piloto según su monoplaza y posición de salida: $+5$ puntos fijos de moral (`moraleRaceDelta = 5`, ajustable por configuración).
  * Si no cumple la expectativa o sufre abandono por accidente: $-5$ puntos fijos de moral.
* **Jefe de Ingenieros:**
  * Si al menos un coche puntúa o cumple el objetivo del patrocinador: $+5$ puntos fijos de moral.
  * Si la carrera concluye sin puntos y por debajo de las expectativas de rendimiento: $-5$ puntos fijos de moral.

---

## 6. Objetivos de Temporada, Team Principal y Destitución

### 6.1. Evaluación de Objetivos y Rating de Team Principal (`tpRating`)
* Al inicio del año, la directiva fija una meta de posición en Constructores.
* Al finalizar la temporada, se actualiza el atributo oculto `tpRating` ($0$ a $100$):
  * **Superar objetivo:** $+10$ a $+15$ puntos de rating.
  * **Cumplir objetivo exacto:** $+3$ a $+5$ puntos de rating.
  * **No cumplir objetivo:** $-10$ a $-20$ puntos de rating (proporcional al déficit de posiciones).

### 6.2. Destitución y Mercado de Fichajes de Directores
* **Destitución:** Si la escudería finaliza significativamente por debajo del objetivo exigido, la directiva despide al jugador.
* **Movilidad entre Equipos:**
  * Al término de la temporada (tanto si fue despedido como si continúa con éxito), se evalúa qué escuderías tienen vacante o buscan director según el `tpRating` del jugador.
  * Si el jugador fue destituido pero su `tpRating` le califica para escuderías de igual o menor prestigio, se le presentan **ofertas de rescate**.
  * **Game Over por Destitución:** Si el jugador es despedido y su `tpRating` es tan bajo que ninguna escudería de la parrilla le ofrece contrato, la carrera deportiva concluye definitivamente.

---

## 7. Límite de 10 Temporadas y Pantalla de Legado

* La trayectoria del jugador tiene una duración estricta de **10 temporadas completas**.
* Al finalizar la temporada 10, no se permite avanzar a una nueva campaña; se desbloquea la **Pantalla de Legado**, que resume:
  * Historial de títulos mundiales de Pilotos y Constructores.
  * Escuderías dirigidas a lo largo de la década.
  * Récord total acumulado de Grandes Premios, victorias y podios.
  * Valoración final honorífica de la trayectoria como Team Principal legendario.

---

## 8. Tabla de Pesos y Parámetros Ajustables (`simulationConfig.ts`)

Todos los valores numéricos de las reglas se centralizan en configuración:

| Parámetro | Variable en Configuración | Valor Propuesto Base | Modificable |
| :--- | :--- | :--- | :---: |
| **Ponderación Coche en Qualy** | `qualyCarWeight` | `0.50` |  Sí |
| **Ponderación Piloto en Qualy** | `qualyDriverWeight` | `0.40` |  Sí |
| **Ponderación Setup en Qualy** | `qualySetupWeight` | `0.10` |  Sí |
| **Ponderación Parrilla en Carrera** | `raceGridWeight` | `0.35` |  Sí |
| **Ponderación Coche en Carrera** | `raceCarWeight` | `0.35` |  Sí |
| **Ponderación Piloto en Carrera** | `raceDriverWeight` | `0.20` |  Sí |
| **Ponderación Setup en Carrera** | `raceSetupWeight` | `0.10` |  Sí |
| **Desviación estocástica Qualy** | `qualyRandomSigma` | `0.05` |  Sí |
| **Desviación estocástica Carrera**| `raceRandomSigma` | `0.07` |  Sí |
| **Límite máximo de deuda (% base)**| `maxDebtPercentage` | `0.25` (25%) |  Sí |
| **Factor coste reparación DNF** | `dnfRepairCostFactor` | `0.03` (3% valor coche) |  Sí |
| **Límite mejoras simultáneas** | `maxConcurrentUpgrades`| `2` |  Sí |
| **Límite plazas academia** | `maxYouthDrivers` | `2` |  Sí |
| **Duración máxima de carrera** | `maxCareerSeasons` | `10` |  Sí |
| **Delta fija de moral post-carrera** | `moraleRaceDelta` | `5` puntos |  Sí |
| **Penalización moral fallo mejora** | `upgradeFailMoralePenalty` | `3` puntos |  Sí |
| **Descuento reintento mejora** | `retryUpgradeDiscount` | `0.50` (50%) |  Sí |

---

## 9. Estado de Decisiones de Reglas

Todas las cuestiones y variables de las reglas de juego han quedado definidas y cerradas:

| Decisión de Reglas | Resolución Adoptada | Ubicación |
| :--- | :--- | :--- |
| **Fluctuación de Moral en Carrera** | Variación fija de $\pm 5$ puntos según si se cumplen o no las expectativas deportivas. | Sección 5.3 |
| **Penalización por Fallo de Mejora** | Pérdida leve y fija de $3$ puntos en la moral del Jefe de Ingenieros. | Sección 3.2 |
| **Reintento de Mejora Fallida** | Se permite reintentar la pieza de inmediato con un $50\%$ de descuento económico. | Sección 3.2 |
