# Alcance del Producto: F1 Manager Web (Arcade)

| Documento | Alcance y Fronteras del MVP (`spec/scope.md`) |
| :--- | :--- |
| **Referencias** | [briefing.md](file:///home/cristian-dev/dev/f1manager/briefing.md) \| [prd.md](file:///home/cristian-dev/dev/f1manager/prd.md) \| [spec/vision.md](file:///home/cristian-dev/dev/f1manager/spec/vision.md) |
| **Versión** | 1.0 |

---

## 1. Dentro del MVP

El MVP se enfoca en entregar un ciclo de juego (*core loop*) completo, arcade y rejugable. Contiene los cuatro pilares esenciales y los sistemas de soporte imprescindibles para su funcionamiento:

### 1.1. Pilares Esenciales
1. **Fichar Personal:**
   * Contratación y renovación de pilotos titulares e ingenieros jefes.
   * Atributos básicos cuantificados para pilotos (*Pace, Consistency, Potential, Morale*) e ingenieros (*Development Efficiency, Setup Performance*).
   * Gestión de contratos por años y salarios por temporada.
2. **Simular Carreras (Qualy y Carrera):**
   * Simulación algorítmica y directa de Clasificación y Carrera en los 24 Grandes Premios del calendario oficial.
   * Resultado determinado exclusivamente por el coche, el piloto y la adecuación al circuito, con un factor estocástico acotado en archivo de configuración (`simulationConfig.ts`).
   * Evaluación probabilística de incidentes y abandonos (DNF) binarios con pérdida de puntos.
   * Pantalla de clasificación final con tiempos/diferencias, puntos repartidos, balance financiero, podio y **etiqueta corta del motivo de DNF** extraída de una lista acotada (ej. *"Fallo mecánico"*, *"Accidente"*), sin detalles de circunstancias complejas.
3. **Pasar Temporadas y Progresión:**
   * Transición completa de temporada: reparto de premios económicos de la FIA según la posición en Constructores.
   * Envejecimiento y evolución anual de pilotos según su potencial.
   * Movilidad de escuderías: recepción de ofertas de otros equipos o contratos de rescate tras destitución según el **Rating oculto de Team Principal (`tpRating`)**.
   * Ciclo cerrado de hasta **10 temporadas** con culminación en una **Pantalla de Legado** (resumen de títulos, victorias, podios y balance de carrera).
4. **Desarrollar Jóvenes Pilotos (Academia Mínima):**
   * Espacio limitado a 1 o 2 plazas para jóvenes promesas.
   * **Generación Procedural Anual:** Cada temporada se generan nuevos jóvenes talentos con nombres y atributos procedurales ficticios (sin catálogo fijo de pilotos reales jóvenes), con estadísticas iniciales bajas y alto potencial de desarrollo.
   * Progresión anual acelerada por el nivel del simulador.
   * Opción de promover a un piloto de la academia al asiento titular ante una vacante.

### 1.2. Funcionalidades de Soporte Necesarias para el Funcionamiento
* **Selección Inicial de Escudería:** Elección entre las 10 escuderías de la temporada oficial de F1, cada una con su presupuesto, nivel inicial de coche/instalaciones y objetivos de junta directiva.
* **Desarrollo del Monoplaza:** Menú de mejoras sobre los 3 atributos básicos del coche (*Top Speed*, *Downforce*, *Reliability*), con costes económicos y tiempos medidos en Grandes Premios.
* **Economía y Finanzas Básicas:**
  * **Ingresos:** Patrocinador principal (pago base garantizado por GP + bonus por objetivo) y premios por puesto en el mundial.
  * **Gastos:** Coste de paquetes de mejora, salarios de empleados, mantenimiento de instalaciones y **sanción económica por reparación de daños tras DNF**.
  * **Condiciones de Derrota (*Game Over*):** Bancarrota técnica por deuda insalvable o destitución sin ofertas de rescate disponibles.
* **Instalaciones Básicas:** Niveles de Fábrica (mejora de coche) y Simulador (entrenamiento y academia).
* **IA Autónoma de Rivales:** Las 9 escuderías rivales mejoran sus coches, fichan/renuevan personal y sufren consecuencias económicas de forma autónoma.
* **Persistencia y Portabilidad Local:** Guardado automático en el navegador (`IndexedDB`) y botones de **Exportar / Importar partida en JSON** para copias de seguridad manuales.

---

## 2. Fuera del MVP

Las siguientes funcionalidades quedan formal y deliberadamente excluidas del alcance del MVP para mantener el desarrollo ágil, ligero y enfocado:

* **Equipo B / Escudería Filial:** No se permite gestionar un segundo equipo satélite ni ceder pilotos a otra estructura propia.
* **Otras Categorías Jugables (F2, F3):** El juego se circunscribe exclusivamente a la categoría reina (Fórmula 1).
* **Simulación Vuelta a Vuelta / Vista 2D o 3D:** No hay visualización de la carrera en tiempo real, ni circuito interactivo, ni comentarios o narración vuelta a vuelta.
* **Microgestión y Estrategia en Pista:** Sin órdenes de radio en vivo, gestión de paradas en boxes (*pit stops*), cambio de mapa de motor ni desgaste de compuestos de neumáticos en carrera.
* **Ranking Global / Marcadores Online:** No hay tablas de clasificación entre diferentes jugadores mundiales.
* **Cuentas de Usuario y Backend Centralizado:** Cero sistemas de autenticación (*login*), perfiles en la nube o sincronización entre usuarios concurrentes.

---

## 3. Futuro (Backlog Post-MVP / Sin Compromiso)

Ideas potenciales para iteraciones posteriores a la validación del MVP, sujetas a feedback y sin compromiso de implementación actual:

* **Eventos Narrativos del Paddock:** Ruedas de prensa, declaraciones polémicas de pilotos y dilemas morales entre carreras que afecten a la moral o los patrocinios.
* **Meteorología Dinámica:** Carreras en seco, mojado o mixto que añadan un modificador temporal a la puesta a punto y a la probabilidad de incidentes.
* **Modo "11º Equipo" / Crea tu propia escudería:** Posibilidad de empezar desde cero diseñando nombre, colores y patrocinadores en lugar de elegir un equipo oficial.
* **Animación Resumen Arcade:** Pequeña animación gráfica tipo *broadcast* de adelantamientos clave o repetición rápida de los momentos decisivos del Gran Premio antes de la pantalla final.
* **Sincronización Opcional en la Nube:** Capacidad optativa de guardar la partida en la nube mediante un enlace simple o inicio de sesión ligero.

---

## 4. Restricciones y Supuestos del MVP

### 4.1. Restricciones Técnicas
1. **PWA y Funcionamiento Offline-First:** La aplicación debe funcionar al 100% sin conexión a internet una vez cargada, mediante *Service Worker* que cachee todos los recursos estáticos.
2. **Arquitectura Client-Only (Sin Backend):** Desarrollado en **Next.js** configurado con exportación estática (`output: 'export'`). No existen rutas de servidor (*API routes* activas en runtime), bases de datos remotas ni servidores Node.js en producción.
3. **Persistencia Local:** Todos los datos de la partida residen en el almacenamiento del dispositivo (`IndexedDB` como motor principal).
4. **Diseño Multiplataforma:** Interfaz completamente adaptativa (*responsive*) optimizada para móviles (a partir de 360px), tablets y pantallas de sobremesa.

### 4.2. Supuestos de Juego y Dominio
1. **Temporada Oficial de F1:** El juego se basa en las 10 escuderías y los 24 Grandes Premios reales del calendario oficial de Fórmula 1.
2. **Universo en Solitario:** Cada jugador vive su propia simulación individual y aislada en su dispositivo.
3. **Determinismo Configurable:** Las fórmulas de carrera son matemáticas y reproducibles, gobernadas por un archivo de configuración (`simulationConfig.ts`) con ponderaciones editables.

---

## 5. Estado de Decisiones de Alcance

Todas las cuestiones de alcance para el MVP han quedado resueltas y formalizadas:

| Decisión | Resolución Adoptada |
| :--- | :--- |
| **Generación de Jóvenes Talentos** | Generación procedural anual con nombres y atributos ficticios; sin catálogo de pilotos reales jóvenes. |
| **Visualización de DNF en Carrera** | Etiqueta corta basada en una lista cerrada (ej. *"Fallo mecánico"*, *"Accidente"*); sin descripción circunstancial compleja. |
