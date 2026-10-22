# Criterios de Aceptación del MVP: F1 Manager Web (Arcade)

| Documento | Criterios de Aceptación Verificables (`spec/acceptance-criteria.md`) |
| :--- | :--- |
| **Referencias** | [briefing.md](file:///home/cristian-dev/dev/f1manager/briefing.md) \| [prd.md](file:///home/cristian-dev/dev/f1manager/prd.md) \| [spec/scope.md](file:///home/cristian-dev/dev/f1manager/spec/scope.md) |
| **Versión** | 1.0 (MVP) |

---

## Módulo 1: Inicialización de Partida y Elección de Escudería

### AC-01.1: Presentación de la parrilla oficial
* **Dado** que un usuario abre la aplicación web por primera vez o pulsa "Nueva Partida",
* **Cuando** carga la pantalla de selección de equipo,
* **Entonces** se muestran las 10 escuderías de la temporada oficial de F1 con su nombre, presupuesto inicial, objetivos de la directiva y nivel base de monoplaza e instalaciones.

### AC-01.2: Selección de equipo y arranque
* **Dado** que el jugador está en la pantalla de selección de equipo,
* **Cuando** selecciona una escudería y confirma la elección,
* **Entonces** se crea una nueva partida en el dispositivo, se asigna al jugador el rol de Team Principal de dicho equipo y se accede al panel principal de fábrica en la Ronda 1 de la Temporada 1.

### AC-01.3: Asignación de objetivos y `tpRating` inicial
* **Dado** que se ha iniciado una partida con una escudería seleccionada,
* **Cuando** se inicializa el estado del juego,
* **Entonces** se establece el objetivo de temporada de la junta directiva (ej. posición mínima en Constructores) y se asigna un valor base inicial al `tpRating` (Rating de Team Principal) acorde a la categoría de la escudería.

---

## Módulo 2: Fábrica, Finanzas y Condiciones de Derrota

### AC-02.1: Visualización del balance financiero
* **Dado** que el jugador accede al panel de finanzas,
* **Cuando** consulta el estado económico de la escudería,
* **Entonces** visualiza de forma clara el saldo actual en cuenta, los ingresos proyectados por carrera y el desglose de costes fijos (salarios y mantenimiento).

### AC-02.2: Cobro de ingresos de patrocinio
* **Dado** que finaliza un Gran Premio,
* **Cuando** se liquida el fin de semana de carreras,
* **Entonces** se ingresa el pago fijo base del patrocinador y, si la posición de los coches cumplió la meta del contrato, se suma el bonus económico correspondiente.

### AC-02.3: Deducción de salarios y mantenimiento
* **Dado** que concluye un Gran Premio o ciclo de pago estipulado,
* **Cuando** se procesan los costes operativos,
* **Entonces** se deduce del presupuesto el prorrateo correspondiente a los salarios de pilotos titulares, ingenieros, promesas de la academia y mantenimiento de instalaciones.

### AC-02.4: Derrota por bancarrota
* **Dado** que la escudería tiene saldo negativo al finalizar un Gran Premio o temporada,
* **Cuando** la deuda acumulada supera el límite máximo permitido (calculado como un porcentaje proporcional sobre el presupuesto base de la escudería y definido en el archivo de configuración),
* **Entonces** se declara la quiebra financiera, se muestra la pantalla de *Game Over* (Fin de Partida por Bancarrota) y se impide continuar la simulación con ese equipo.

---

## Módulo 3: Desarrollo del Monoplaza e Instalaciones

### AC-03.1: Inicio de mejora del monoplaza
* **Dado** que el jugador dispone de presupuesto suficiente en la fábrica y tiene menos de 2 mejoras en curso,
* **Cuando** selecciona mejorar uno de los atributos del coche (*Top Speed*, *Downforce* o *Reliability*) y confirma la orden,
* **Entonces** se descuenta el coste financiero del saldo y se inicia un proyecto de desarrollo con una duración fijada en número de Grandes Premios.

### AC-03.2: Límite de mejoras simultáneas bloqueado
* **Dado** que la escudería ya tiene 2 proyectos de desarrollo técnico activos simultáneamente,
* **Cuando** el jugador intenta encargar una tercera mejora,
* **Entonces** el sistema bloquea la acción, muestra una advertencia indicando que se ha alcanzado la capacidad máxima de desarrollo de la fábrica y no descuenta presupuesto.

### AC-03.3: Influencia del Jefe de Ingenieros y Fábrica
* **Dado** que una escudería cuenta con un Jefe de Ingenieros con alto `developmentEfficiency` o un nivel alto de Fábrica,
* **Cuando** el jugador calcula el coste y plazo de una mejora,
* **Entonces** el coste económico y/o el número de Grandes Premios requeridos para completarla es inferior al valor base.

### AC-03.4: Aplicación efectiva de mejora exitosa
* **Dado** que un proyecto de mejora técnica alcanza el número de Grandes Premios fijados para su desarrollo,
* **Cuando** concluye el Gran Premio previo a su entrega y el cálculo de probabilidad basado en la `morale` del Jefe de Ingenieros resulta exitoso,
* **Entonces** el atributo correspondiente del coche (*Top Speed*, *Downforce* o *Reliability*) incrementa su valor numérico de forma permanente y queda activo para la siguiente carrera.

### AC-03.5: Mejora fallida por moral y reintento con descuento
* **Dado** que un proyecto de mejora técnica alcanza su fecha de entrega,
* **Cuando** el cálculo de probabilidad basado en la baja `morale` del Jefe de Ingenieros determina un fallo técnico,
* **Entonces** el atributo del coche no se incrementa, el Jefe de Ingenieros pierde 3 puntos fijos de moral y se habilita en la interfaz la opción de reintentar la mejora sobre la misma pieza con un 50% de descuento económico sobre el coste base.

### AC-03.6: Subida de nivel de instalaciones
* **Dado** que el jugador dispone de fondos suficientes para ampliar instalaciones,
* **Cuando** compra una subida de nivel de Fábrica o de Simulador,
* **Entonces** se descuenta el precio de la obra, el nivel de la instalación aumenta en 1 y se aplican inmediatamente sus beneficios de desarrollo o entrenamiento.

---

## Módulo 4: Mercado de Personal (Fichajes y Renovaciones)

### AC-04.1: Exploración del mercado
* **Dado** que el jugador entra en la sección de Mercado de Personal,
* **Cuando** consulta las listas de pilotos e ingenieros,
* **Entonces** visualiza sus cualidades básicas (*Pace, Consistency, Potential, Morale* para pilotos; *Development Efficiency, Setup Performance* para ingenieros), su salario solicitado y sus años de contrato vigentes.

### AC-04.2: Fichaje de piloto o ingeniero
* **Dado** que el jugador dispone de presupuesto y un asiento o puesto disponible (o asume el finiquito del actual),
* **Cuando** envía una oferta económica que satisface las pretensiones salariales del candidato y confirma el fichaje,
* **Entonces** el candidato pasa a formar parte de la plantilla oficial de la escudería con los años de contrato firmados.

### AC-04.3: Renovación de contrato
* **Dado** que un piloto o ingeniero titular tiene 1 año o menos de contrato restante,
* **Cuando** el jugador le ofrece una renovación contractual aceptada por el empleado,
* **Entonces** se actualiza su duración de contrato y su nuevo salario acordado para las siguientes temporadas.

### AC-04.4: Expiración de contrato sin renovar
* **Dado** que un empleado finaliza la última carrera de la temporada con 0 años restantes de contrato y no fue renovado,
* **Cuando** se ejecuta la transición a la nueva temporada,
* **Entonces** el empleado abandona la escudería y pasa al catálogo de agentes libres del mercado.

---

## Módulo 5: Academia de Jóvenes Promesas

### AC-05.1: Generación procedural anual de talentos
* **Dado** que comienza una nueva temporada en el juego,
* **Cuando** se abre el mercado de la cantera de jóvenes promesas,
* **Entonces** el sistema genera una hornada de pilotos ficticios con nombres, nacionalidades y atributos procedurales (bajas estadísticas iniciales y alto atributo de `Potential`), renovando la lista disponible.

### AC-05.2: Fichaje en la academia y límite de plazas
* **Dado** que la academia de la escudería tiene menos de 2 pilotos contratados,
* **Cuando** el jugador firma a una joven promesa disponible,
* **Entonces** el piloto se incorpora a la academia y el número de plazas ocupadas aumenta. Si la academia ya tiene 2 pilotos, el sistema bloquea nuevas contrataciones hasta que se libere una plaza.

### AC-05.3: Entrenamiento anual potenciado por Simulador
* **Dado** que una joven promesa permanece en la academia al concluir la temporada,
* **Cuando** se procesa la evolución anual entre temporadas,
* **Entonces** sus atributos (*Pace*, *Consistency*) experimentan un incremento porcentual en función de su `Potential` y del nivel actual del `Simulador` del equipo.

### AC-05.4: Promoción al asiento titular
* **Dado** que una joven promesa de la academia tiene contrato en vigor y el jugador decide ascenderle a piloto titular en una plaza vacante,
* **Cuando** el jugador confirma la promoción,
* **Entonces** el piloto pasa a ser Piloto 1 o Piloto 2 de la escudería oficial, desocupando una plaza de la academia.

---

## Módulo 6: Simulación del Fin de Semana de Carreras

### AC-06.1: Simulación de Clasificación (Qualy)
* **Dado** que el jugador pulsa "Disputar Fin de Semana",
* **Cuando** se ejecuta la sesión de Clasificación,
* **Entonces** el sistema calcula los tiempos y el orden de salida (posiciones 1 a 20) combinando las fórmulas de coche, piloto y circuito definidas en `simulationConfig.ts`, más el factor aleatorio estocástico.

### AC-06.2: Incidente en Qualy
* **Dado** que se simula la sesión de Clasificación,
* **Cuando** el generador aleatorio activa una probabilidad de incidente por baja `Consistency` o baja `Reliability`,
* **Entonces** el piloto afectado sufre una pérdida severa de posición y se le clasifica en el fondo de la parrilla de salida.

### AC-06.3: Simulación de Carrera y cálculo de DNF
* **Dado** que se parte de la parrilla de salida calculada en Qualy,
* **Cuando** se ejecuta la simulación de Carrera,
* **Entonces** el sistema simula el resultado final de los 20 pilotos evaluando la probabilidad de abandono según la fórmula de DNF. Si un piloto sufre DNF, queda marcado como no clasificado (0 puntos).

### AC-06.4: Etiqueta corta de motivo de DNF
* **Dado** que uno o más monoplazas sufren un abandono durante la carrera,
* **Cuando** se genera el resultado en la pantalla de clasificación final,
* **Entonces** junto al estado DNF de cada piloto retirado se muestra exclusivamente una etiqueta corta perteneciente a la lista tipificada (*"Fallo mecánico"* o *"Accidente"*).

### AC-06.5: Coste de reparación proporcional por DNF
* **Dado** que uno de los coches del jugador sufre un DNF (*"Fallo mecánico"* o *"Accidente"*),
* **Cuando** se liquida el balance financiero tras la carrera,
* **Entonces** se descuenta del presupuesto una sanción económica por reparación calculada como un porcentaje proporcional al valor de los atributos del monoplaza (un monoplaza mejorado resulta más caro de reparar que uno base no mejorado).

### AC-06.6: Pantalla de clasificación final completa
* **Dado** que concluye la simulación de carrera,
* **Cuando** se presenta la pantalla de resultados finales,
* **Entonces** se visualiza la tabla completa de 1 a 20 con diferencias de tiempo, podio destacado, pilotos DNF con su etiqueta, puntos oficiales de F1 asignados (25 al 1º, 18 al 2º, etc.) y desglose de ganancias netas del GP.

### AC-06.7: Actualización de tablas mundiales
* **Dado** que se han repartido los puntos oficiales en carrera,
* **Cuando** el jugador pulsa "Continuar",
* **Entonces** las clasificaciones generales del Campeonato del Mundo de Pilotos y del Campeonato del Mundo de Constructores quedan actualizadas sumando los nuevos puntos obtenidos.

---

## Módulo 7: IA de Escuderías Rivales

### AC-07.1: Evolución autónoma de los coches rivales
* **Dado** que transcurren los Grandes Premios a lo largo del año,
* **Cuando** se avanza en el calendario,
* **Entonces** las 9 escuderías rivales aplican mejoras periódicas a sus atributos de monoplaza según su presupuesto, evitando quedar desfasadas respecto al jugador.

### AC-07.2: Movimientos autónomos en el mercado
* **Dado** que un piloto titular de un equipo rival finaliza contrato o queda libre,
* **Cuando** se procesa el mercado de fichajes entre temporadas,
* **Entonces** la IA rival renueva a sus pilotos o contrata a agentes libres disponibles acordes a su reputación y presupuesto.

---

## Módulo 8: Fin de Temporada, Team Principal y Pantalla de Legado

### AC-08.1: Reparto de premios económicos de la FIA
* **Dado** que se completa la carrera 24 (último GP del año),
* **Cuando** se cierra el Campeonato de Constructores,
* **Entonces** se ingresa en el presupuesto de cada escudería el premio económico oficial estipulado según su posición en la tabla final.

### AC-08.2: Recálculo del `tpRating`
* **Dado** que concluye la temporada,
* **When** la junta directiva evalúa el desempeño del jugador frente al objetivo fijado,
* **Entonces** el `tpRating` oculto aumenta si se cumplió o superó el objetivo, o disminuye si se quedó por debajo de las expectativas.

### AC-08.3: Recepción de ofertas de otras escuderías
* **Dado** que el jugador finaliza la temporada con un `tpRating` alto,
* **Cuando** se abre el periodo de contratos de Team Principal,
* **Entonces** el jugador recibe una o más ofertas formales de escuderías de igual o mayor reputación, pudiendo elegir entre aceptar una nueva escudería o renovar con la actual.

### AC-08.4: Destitución y ofertas de rescate
* **Dado** que el jugador no cumplió de forma reiterada los objetivos de la junta directiva y es destituido de su escudería,
* **Cuando** su `tpRating` aún le otorga acceso a escuderías de menor o igual rango,
* **Entonces** el juego le presenta ofertas de contrato de rescate de equipos que buscan director, permitiéndole continuar su carrera deportiva.

### AC-08.5: Game Over por falta de contrato
* **Dado** que el jugador ha sido despedido de su equipo,
* **Cuando** su `tpRating` es insuficiente para que cualquier otra escudería de la parrilla le ofrezca un contrato,
* **Entonces** se declara el fin de la trayectoria (*Game Over* por Destitución sin opciones) y se muestra la pantalla de derrota.

### AC-08.6: Llegada a la 10ª temporada y Pantalla de Legado
* **Dado** que el jugador completa el Gran Premio 24 de la Temporada 10,
* **Cuando** se procesa el cierre del año,
* **Entonces** se bloquea el avance a la temporada 11 y se despliega la **Pantalla de Legado**, mostrando el palmarés histórico acumulado (Mundiales de Pilotos y Constructores, victorias, podios, equipos dirigidos y rango honorífico final).

---

## Módulo 9: PWA, Funcionamiento Offline y Portabilidad JSON

### AC-09.1: Guardado automático en el cliente
* **Dado** que el jugador realiza cualquier acción clave (mejora de coche, firma de contrato o finalización de GP),
* **Cuando** la acción se completa con éxito,
* **Entonces** el estado íntegro de la partida se persiste automáticamente en `IndexedDB` sin requerir acción manual del usuario.

### AC-09.2: Reanudación de partida tras reinicio
* **Dado** que existe una partida guardada en `IndexedDB`,
* **Cuando** el usuario cierra la pestaña o el navegador y vuelve a ingresar a la URL del juego,
* **Entonces** la aplicación carga inmediatamente el estado exacto donde se interrumpió la partida, mostrando la opción de "Continuar".

### AC-09.3: Funcionamiento 100% offline
* **Dado** que la aplicación ha sido cargada al menos una vez en el navegador y el Service Worker está activo,
* **Cuando** el usuario activa el modo avión o pierde la conexión a internet y recarga o interactúa con el juego,
* **Entonces** la aplicación web carga todos sus assets (código, estilos, fuentes, datos) y permite jugar, simular y guardar partidas con total normalidad sin emitir errores de red.

### AC-09.4: Exportación de partida a JSON
* **Dado** que existe una partida activa en el dispositivo,
* **Cuando** el jugador pulsa el botón "Exportar Partida" en el menú de ajustes,
* **Entonces** el navegador genera y descarga un archivo `f1manager_save_[timestamp].json` que contiene la totalidad del estado actual de la partida en formato JSON plano legible.

### AC-09.5: Importación exitosa de partida JSON
* **Dado** que el jugador pulsa "Importar Partida" y selecciona un archivo `.json` exportado previamente,
* **Cuando** el sistema valida que el archivo cumple estrictamente con el esquema de datos del juego,
* **Entonces** se sobreescribe el estado en `IndexedDB`, se recarga la interfaz y el juego continúa con la partida importada.

### AC-09.6: Rechazo de JSON inválido o corrupto
* **Dado** que el usuario intenta importar un archivo JSON alterado, incompleto o no correspondiente al juego,
* **Cuando** el validador de esquema detecta campos ausentes o tipos de datos incorrectos,
* **Entonces** se rechaza la importación, se muestra un mensaje de error descriptivo en pantalla (*"Archivo de guardado no válido"*) y el estado actual de la partida previa no se modifica ni se corrompe.

## Estado de Decisiones de Criterios

Todos los parámetros y reglas de los criterios de aceptación del MVP han quedado definidos y cerrados:

| Parámetro | Regla Adoptada | Ubicación |
| :--- | :--- | :--- |
| **Sanción económica por DNF** | Porcentaje proporcional al nivel de evolución/atributos del monoplaza (más caro cuanto más mejorado). | `AC-06.5` |
| **Límite de deuda antes de bancarrota** | Porcentaje proporcional al presupuesto base de cada escudería, ajustable en archivo de configuración. | `AC-02.4` |
| **Concurrencia de mejoras** | Máximo estricto de 2 proyectos de desarrollo técnico simultáneos en fábrica. | `AC-03.2` |
| **Mejora fallida y reintento** | Fallo técnico según moral de ingeniero (-3 moral) y reintento al 50% de descuento. | `AC-03.5` |
