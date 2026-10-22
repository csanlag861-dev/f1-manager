# 🏎️ F1 Manager Web

Juego de gestión y estrategia de Fórmula 1 en entorno web, desarrollado con arquitectura limpia, simulación determinista/estocástica de fines de semana de carrera, gestión financiera y persistencia en cliente con IndexedDB.

---

## 📋 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Stack Tecnológico](#-stack-tecnológico)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación y Puesta en Marcha](#-instalación-y-puesta-en-marcha)
- [Scripts Disponibles](#-scripts-disponibles)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Documentación del Proyecto](#-documentación-del-proyecto)
- [Licencia](#-licencia)

---

## ✨ Características Principales

- **Gestión Integral de Equipo**: Administración de pilotos, ingenieros, presupuesto, desarrollo del monoplaza y patrocinadores.
- **Simulación Realista de Carreras**: Motores de clasificación y carrera vuelta a vuelta calculando ritmo, degradación, incidentes de carrera y abandonos (DNF).
- **Economía y Finanzas**: Control de flujo de caja, gastos fijos por gran premio, costes de reparación por accidentes y balance de patrocinadores con condición de quiebra.
- **Persistencia Local**: Guardado y carga reactiva de partidas usando el almacenamiento del navegador (IndexedDB) sin necesidad de servicios backend externos.
- **Diseño Responsive y UI Moderna**: Desarrollado con Next.js y Vanilla CSS optimizado para velocidad y estética deportiva premium.

---

## 🛠️ Stack Tecnológico

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **UI & Estado**: [React 19](https://react.dev/) y [Zustand](https://github.com/pmndrs/zustand)
- **Persistencia**: [idb](https://github.com/jakearchibald/idb) (IndexedDB wrapper)
- **Validación**: [Zod](https://zod.dev/)
- **Testing**: [Vitest](https://vitest.dev/) con simulación de IndexedDB (`fake-indexeddb`)

---

## ⚙️ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu ordenador:

- **Node.js**: Versión `18.18.0` o superior (se recomienda Node 20 LTS o 22). Puedes comprobarlo con:
  ```bash
  node -v
  ```
- **npm**: Versión `9.0.0` o superior (incluido por defecto con Node.js):
  ```bash
  npm -v
  ```
- **Git**: Para clonar el repositorio:
  ```bash
  git --version
  ```

---

## 🚀 Instalación y Puesta en Marcha

Sigue estos pasos para clonar y ejecutar el proyecto en otro ordenador:

### 1. Clonar el repositorio
Abre una terminal y clona el proyecto desde GitHub:

```bash
git clone https://github.com/csanlag861-dev/f1-manager.git
```

### 2. Entrar en la carpeta del proyecto
```bash
cd f1-manager
```

### 3. Instalar las dependencias
Instala los paquetes necesarios definidos en `package.json`:

```bash
npm install
```

### 4. Iniciar el servidor de desarrollo
Ejecuta el entorno local de Next.js:

```bash
npm run dev
```

Una vez levantado el servidor, abre tu navegador web en:
👉 [http://localhost:3000](http://localhost:3000)

---

## 📜 Scripts Disponibles

En el directorio del proyecto puedes ejecutar los siguientes comandos:

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo en modo escucha con recarga rápida (`Fast Refresh`). |
| `npm run build` | Compila y optimiza la aplicación para producción. |
| `npm start` | Inicia la versión compilada en producción (requiere haber ejecutado `npm run build` antes). |
| `npm run test` | Ejecuta la suite de pruebas unitarias e integración con Vitest. |
| `npm run lint` | Ejecuta el análisis estático de código con ESLint. |

### Ejecutar Pruebas
Para comprobar que toda la lógica de dominio, economía y simulación funciona correctamente:
```bash
npm run test
```

---

## 📂 Estructura del Proyecto

El código sigue los principios de Clean Architecture y DDD (Domain-Driven Design):

```text
f1manager/
├── spec/                       # Especificaciones funcionales y reglas de juego
├── src/
│   ├── app/                    # Rutas y páginas de Next.js (App Router)
│   │   ├── dashboard/          # Panel principal del equipo
│   │   ├── new-game/           # Asistente de creación de nueva partida
│   │   ├── race/               # Simulación de carrera en vivo
│   │   └── standings/          # Clasificación del mundial
│   ├── application/            # Capa de aplicación y stores (Zustand)
│   ├── config/                 # Datos iniciales (equipos, circuitos) y parámetros
│   ├── domain/                 # Lógica de negocio pura (independiente de la UI)
│   │   ├── economy/            # Balances, gastos, patrocinadores, quiebra
│   │   ├── models/             # Tipos y modelos del dominio
│   │   ├── season/             # Puntuación y clasificaciones
│   │   └── simulation/         # Motores de cálculo de carrera y clasificación
│   ├── infrastructure/         # Adaptadores externos y persistencia (IndexedDB)
│   └── presentation/           # Componentes visuales y hojas de estilo CSS
├── tests/                      # Suite de tests unitarios e integrados
├── AGENTS.md                   # Reglas y estándares de desarrollo
├── plan.md                     # Arquitectura técnica y roadmap
└── tasks.md                    # Registro y estado de tareas
```

---

## 📖 Documentación del Proyecto

Para más detalles sobre las reglas del juego, arquitectura y diseño:
- [Especificación de Dominio](spec/domain-model.md)
- [Reglas del Juego](spec/game-rules.md)
- [Criterios de Aceptación](spec/acceptance-criteria.md)
- [Plan de Arquitectura e Implementación](plan.md)
- [Seguimiento de Tareas](tasks.md)

---

## 📄 Licencia

Este proyecto es privado / de código abierto para fines educativos y recreativos.
