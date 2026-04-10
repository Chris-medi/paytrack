# 📱 Loan Manager PWA - Angular + Firebase

Aplicación PWA para la gestión de préstamos personales, desarrollada con **Angular**, enfocada en **mobile-first**, con soporte **offline-first**, validaciones en tiempo real y arquitectura limpia.

---

## 🚀 Stack Tecnológico

* **Angular** (Standalone Components)
* **NgRx Signals** (manejo de estado)
* **Zod** (validación)
* **Firebase** (Auth, Firestore, Storage, Hosting)
* **Tailwind CSS** (UI)
* **PWA / Service Worker**
* **IndexedDB (Dexie)** (persistencia offline)

---

## 📁 Estructura del Proyecto

```bash
src/
 └── app/
      ├── core/
      │    ├── auth/
      │    │    ├── auth.service.ts
      │    │    ├── auth.guard.ts
      │    │    └── auth.model.ts
      │    │
      │    ├── services/
      │    │    ├── firebase.service.ts
      │    │    ├── network.service.ts
      │    │    └── sync.service.ts
      │    │
      │    ├── utils/
      │    │    ├── date.utils.ts
      │    │    ├── currency.utils.ts
      │    │    └── validation.utils.ts
      │    │
      │    └── models/
      │         └── base.model.ts
      │
      ├── domain/
      │    ├── entities/
      │    │    ├── loan.entity.ts
      │    │    ├── payment.entity.ts
      │    │    └── borrower.entity.ts
      │    │
      │    ├── calculators/
      │    │    ├── loan.calculator.ts
      │    │    ├── interest.calculator.ts
      │    │    └── payment.calculator.ts
      │    │
      │    └── use-cases/
      │         ├── create-loan.usecase.ts
      │         ├── calculate-balance.usecase.ts
      │         └── register-payment.usecase.ts
      │
      ├── data/
      │    ├── repositories/
      │    │    ├── loan.repository.ts
      │    │    ├── payment.repository.ts
      │    │    └── borrower.repository.ts
      │    │
      │    ├── firebase/
      │    │    ├── loan.firebase.ts
      │    │    ├── payment.firebase.ts
      │    │    └── storage.firebase.ts
      │    │
      │    └── mappers/
      │         ├── loan.mapper.ts
      │         └── payment.mapper.ts
      │
      ├── features/
      │    ├── dashboard/
      │    │    ├── dashboard.page.ts
      │    │    └── dashboard.store.ts
      │    │
      │    ├── loans/
      │    │    ├── loan-list.page.ts
      │    │    ├── loan-list.store.ts
      │    │    └── loan-filter.component.ts
      │    │
      │    ├── loan-detail/
      │    │    ├── loan-detail.page.ts
      │    │    ├── loan-detail.store.ts
      │    │    └── components/
      │    │         ├── loan-summary.component.ts
      │    │         ├── payment-history.component.ts
      │    │         └── loan-actions.component.ts
      │    │
      │    ├── loan-form/
      │    │    ├── loan-form.page.ts
      │    │    ├── loan-form.schema.ts   # Zod
      │    │    └── loan-form.store.ts
      │    │
      │    ├── payments/
      │    │    ├── payment-form.component.ts
      │    │    ├── payment.schema.ts     # Zod
      │    │    └── payment.store.ts
      │    │
      │    └── analysis/
      │         ├── borrower-analysis.page.ts
      │         └── analysis.store.ts
      │
      ├── shared/
      │    ├── components/
      │    │    ├── ui/
      │    │    │    ├── button.component.ts
      │    │    │    ├── card.component.ts
      │    │    │    └── input.component.ts
      │    │    │
      │    │    └── layout/
      │    │         ├── header.component.ts
      │    │         └── bottom-nav.component.ts
      │    │
      │    ├── directives/
      │    ├── pipes/
      │    └── constants/
      │
      └── app.routes.ts
```

---

## 🧠 Principios de Arquitectura

* Separación clara por capas (**Clean Architecture**)
* Dominio independiente de frameworks
* Estado centralizado con **Signals**
* Validación desacoplada con **Zod**
* UI desacoplada de lógica de negocio

---

## 🔄 Flujo de Datos

```text
UI (Angular)
   ↓
Validación (Zod)
   ↓
Dominio (Cálculos)
   ↓
Store (NgRx Signals)
   ↓
Persistencia (IndexedDB)
   ↓
Firebase (Firestore / Storage)
```

---

## 📦 Convenciones del Proyecto

### Naming

* `*.entity.ts` → modelos del dominio
* `*.usecase.ts` → lógica de negocio
* `*.repository.ts` → acceso a datos
* `*.store.ts` → estado con signals
* `*.schema.ts` → validaciones Zod

---

## 📡 Estrategia Offline

* Persistencia local con IndexedDB
* Cola de sincronización
* Estado por registro:

```ts
syncStatus: 'pending' | 'synced' | 'error'
```

---

## 🔐 Seguridad

* Autenticación con Google
* Acceso restringido a un único usuario
* Reglas de Firestore estrictas
* Storage protegido por usuario

---

## 📱 UX (Mobile First)

* Diseño basado en **cards**
* Navegación inferior (bottom nav)
* Formularios simples y rápidos
* Acciones principales visibles
* Feedback inmediato

---

## 🧪 Scripts sugeridos

```bash
npm install
npm start
npm run build
npm run test
```

---

## 🚀 Roadmap

1. Setup base (Angular + Firebase + Tailwind + PWA)
2. Autenticación
3. CRUD de préstamos
4. Registro de pagos
5. Dashboard
6. Offline-first
7. Optimización UX

---

## 🎯 Objetivo

Crear una aplicación:

* rápida ⚡
* usable sin internet 📡
* simple de usar 📱
* mantenible 🧱
* escalable 🚀

---

## 🤖 Uso con Copilot

Este README sirve como guía para:

* generar estructura del proyecto
* crear componentes y stores
* implementar validaciones con Zod
* integrar Firebase
* mantener consistencia en la arquitectura

---

## 📌 Notas Finales

* Mantener lógica de negocio en `domain/`
* Evitar lógica en componentes
* Validar siempre antes de persistir
* Pensar siempre en modo offline

---

**Proyecto en construcción 🚧**
