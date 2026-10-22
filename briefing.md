# Documento de Briefing: F1 Manager Web (Arcade)

## 1. Visión General del Proyecto

* **Nombre provisional:** F1 Manager Web (Arcade)
* **Tipo de proyecto:** Personal y educativo.
* **Plataforma:** Aplicación web *responsive* (móvil, tablet y escritorio) con capacidad de funcionamiento **offline** (arquitectura *local-first* / PWA).
* **Pitch:** Un juego de gestión deportiva arcade, ágil y visualmente vibrante ambientado en la Fórmula 1 actual. El jugador asume el rol de Director de Equipo (*Team Principal*) a lo largo de un ciclo de hasta **10 temporadas**, gestionando recursos, pilotos, ingenieros e instalaciones sin las complejidades abrumadoras de un simulador denso, con posibilidad de cambiar de escudería y culminando en una **Pantalla de Legado**.

---

## 2. Público Objetivo y Propuesta de Valor

* **Target principal:** Fans casuales de la Fórmula 1 que disfrutan de las narrativas de la parrilla, el mercado de fichajes y la evolución de los monoplazas, pero disponen de poco tiempo o buscan partidas rápidas.
* **Target secundario:** Jugadores de juegos de estrategia y *tycoons* que aprecian ciclos de juego rápidos y adictivos (*core loop* de pocos minutos por carrera).
* **Propuesta de valor:** 
  * Accesibilidad instantánea (abrir en el navegador y jugar, sin registros ni pantallas de carga pesadas).
  * Jugabilidad en solitario: cada jugador gestiona su propio universo y línea temporal de la F1.
  * Experiencia arcade con datos y equipos reales de la temporada actual.

---

## 3. Identidad Visual y Estilo

* **Estética:** Colorida, moderna y arcade, fuertemente inspirada en la interfaz técnica y estilizada de **F1 Manager (Frontier)** y las retransmisiones oficiales de la Fórmula 1 (gráficos broadcast de AWS/F1).
* **Diseño UI/UX:**
  * Paleta oscura con contrastes saturados y acentos fluorescentes propios de las escuderías oficiales.
  * Jerarquía clara con tarjetas, barras de progreso y tipografía deportiva legible.
  * Adaptabilidad total: optimizado para interacción táctil en pantallas móviles y con vista de panel de control en pantallas de escritorio.
  * Micro-animaciones fluidas en cambios de pantalla, firmas de contrato y resultados de carrera.

---

## 4. Dinámica y Mecánicas de Juego (Core Loop)

```
[Gestión en Fábrica] ──> [Mejoras & Fichajes] ──> [Simulación GP (Qualy + Carrera)] ──> [Finanzas & Recompensas] ──> [Fin de Temporada / Evolución]
```

### 4.1. Rol del Jugador y Selección de Escudería
* Al iniciar una partida, el jugador elige cualquiera de las escuderías oficiales de la temporada real.
* Cada escudería cuenta con:
  * Presupuesto inicial y flujo de caja (beneficios/pérdidas).
  * Nivel de partida (coche, personal e instalaciones).
  * Objetivos de la junta directiva (p. ej., evitar el último puesto para escuderías modestas, podios regulares para la zona media, ganar el campeonato para las escuderías punteras).
* **Movilidad entre Equipos y Reputación:**
  * Al final de cada temporada, el rendimiento del jugador actualiza su rating de Team Principal. Si es alto, puede recibir ofertas de otras escuderías para cambiar de equipo; si es destituido, puede recibir ofertas de rescate de equipos más modestos.
* **Condición de derrota (*Game Over*):**
  * Destitución por parte de la directiva sin ofertas de rescate disponibles de ninguna otra escudería de la parrilla.
  * Bancarrota técnica si las deudas superan el porcentaje límite permitido sobre el presupuesto base.

### 4.2. Atributos y Estadísticas Clave (Modelo Simplificado)
Para mantener el carácter arcade y equilibrado, las cualidades se concentran en métricas cuantitativas básicas:
* **Coche:** 
  * Velocidad punta (*Top Speed*)
  * Paso por curva / Carga aerodinámica (*Downforce*)
  * Fiabilidad (*Reliability* - influye en probabilidad de abandonos o fallos)
* **Pilotos:**
  * Ritmo / Velocidad (*Pace*)
  * Consistencia / Experiencia (*Consistency*)
  * Potencial de desarrollo (*Potential* - margen de mejora anual)
  * Moral / Estado anímico
* **Jefe de Ingenieros:**
  * Eficiencia de desarrollo (acelera y abarata mejoras del coche)
  * Rendimiento en puesta a punto
  * Moral / Estado anímico (determina si una mejora en desarrollo resulta exitosa o fallida)
* **Circuitos:**
  * Perfil del trazado: balance entre velocidad punta vs. curvas lentas/rápidas, y exigencia de fiabilidad.

### 4.3. Economía: Ingresos y Gastos
* **Ingresos:**
  * Contratos de patrocinio (fijos por carrera y bonos por cumplimiento de metas).
  * Premios económicos según la posición final en carrera y en el Campeonato de Constructores.
* **Gastos:**
  * Desarrollo y mejoras del monoplaza (paquetes aerodinámicos, motor, chasis, con un máximo de 2 mejoras simultáneas).
  * Salarios y primas de renovación/rescisión de pilotos e ingenieros.
  * Mantenimiento y ampliación de instalaciones (fábrica y simulador, absorbiendo este último la manutención de la academia).
  * Sanción económica por reparación de daños del monoplaza tras un abandono (DNF), proporcional al nivel de mejora del coche.

### 4.4. Fin de Semana de Carreras (Simulación Directa)
* **Enfoque arcade sin microgestión en pista:** El jugador no da órdenes de radio ni gestiona paradas en directo. El resultado es el fruto directo de la preparación previa.
* **Fases:**
  1. **Clasificación (Qualy):** Cálculo algorítmico del orden de salida según atributos del coche, talento del piloto y adecuación al circuito. Considera incidentes de fiabilidad e incidentes de clasificación de forma probabilística.
  2. **Carrera:** Simulación inmediata o con animación rápida de clasificación final. Considera incidentes de fiabilidad e incidentes de carrera de forma probabilística.
* **Pantalla de Resultados:** Desglose visual con podio, tiempos/diferencias, pilotos retirados (DNF) con etiqueta corta del motivo (*"Fallo mecánico"* o *"Accidente"*), puntos oficiales repartidos, balance monetario neto y variación de reputación/moral ($\pm 5$ puntos).

### 4.5. IA de Rivales y Dinamismo de la Parrilla
* Las escuderías rivales operan con una IA autónoma que:
  * Aplica paquetes de mejora a lo largo del año.
  * Participa en el mercado de fichajes: renueva o despide pilotos, y compite con el jugador por contrataciones.
  * Puede entrar en crisis económica o experimentar ascensos y descensos en la jerarquía de la parrilla con el paso de los años.

---

## 5. Definición del Alcance: MVP (Producto Mínimo Viable)

El objetivo del MVP es validar que el ciclo básico sea divertido, ágil y rejugable.

### Incluido en el MVP:
1. **Selección de escudería inicial** con plantilla, presupuesto y objetivos de la temporada actual.
2. **Mercado de fichajes:** Contratación y renovación de pilotos e ingenieros titulares.
3. **Desarrollo básico del coche:** Árbol o menú sencillo de mejoras de atributos (*Poder, Aerodinámica, Fiabilidad*).
4. **Instalaciones básicas:** Niveles de fábrica y simulador para potenciar desarrollo y pilotos.
5. **Academia mínima de jóvenes talentos:** Espacio para otear y fichar 1-2 jóvenes promesas ficticias generadas proceduralmente cada temporada, cuyo desarrollo es impulsado por el simulador sin salario individual.
6. **Simulación de temporada completa:**
   * Calendario oficial completo de 24 Grandes Premios.
   * Pantalla de resultados de Clasificación y Carrera.
   * Tablas de clasificación de Pilotos y Constructores.
7. **Transición entre temporadas y Legado:**
   * Reparto de premios oficiales de la FIA, envejecimiento/evolución de pilotos y reajuste de expectativas.
   * Sistema de movilidad entre escuderías y ofertas según el rating de Team Principal.
   * Límite estricto de **10 temporadas** con desbloqueo de la **Pantalla de Legado** (palmarés histórico y valoración final de carrera).
8. **Persistencia local (*Local-first*) y Portabilidad:**
   * Guardado automático en el dispositivo del usuario (`IndexedDB` / `LocalStorage`).
   * Botones de **Exportar e Importar partida en JSON** para copias de seguridad locales.
   * Sin pantalla de inicio de sesión ni dependencias de servidor.
   * Funcionamiento offline completo.

### 6. Fuera del Alcance del MVP (Backlog / Futuras Fases)
* Equipos filiales / Equipos B.
* Categorías soporte inferiores jugables (Fórmula 2, Fórmula 3).
* Simulación vuelta a vuelta o vista 2D/3D interactiva en tiempo real durante la carrera.
* Estrategia de carrera en directo (paradas en boxes, gestión de compuestos de neumáticos, órdenes de equipo en directo).
* Tablas de récords globales o multijugador competitivo.
* Sistema de autenticación de usuarios y sincronización en la nube.

---

## 7. Criterios de Éxito del MVP

* **Rejugabilidad:** Los jugadores completan al menos **3 a 5 temporadas consecutivas** en una misma partida.
* **Retención:** El usuario regresa a continuar su partida en **días sucesivos** gracias a la inmediatez de la experiencia en su dispositivo.
* **Equilibrio y desafío:** Sensación de mérito al progresar con un equipo modesto hacia los puntos y el campeonato, con riesgo palpable de despido ante malas decisiones.
* **Rendimiento:** Cargas instantáneas y experiencia fluida en dispositivos móviles modestos.

---

## 8. Arquitectura y Consideraciones Técnicas Sugeridas

* **Frontend:** HTML5, CSS moderno (diseño responsivo *mobile-first*) y JavaScript/TypeScript modular.
* **Almacenamiento:** `IndexedDB` (o capa de abstracción ligera) para gestionar partidas guardadas, historial de campeonatos y estadísticas históricas.
* **Offline-Ready:** *Service Worker* básico y manifiesto de aplicación web (PWA) que permite instalar el juego como app nativa en el móvil o escritorio y jugar sin conexión a internet.
* **Motor de simulación:** Lógica desacoplada y determinista/semilla (*seed*) basada en ponderaciones estadísticas para garantizar resultados coherentes y justos.
