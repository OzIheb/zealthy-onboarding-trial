# Zealthy Onboarding Test

This project is a multi-step onboarding wizard built as part of a coding assessment for Zealthy. It demonstrates modern web development practices using Next.js, React, TypeScript, and Shadcn UI.

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

-   [Bun](https://bun.sh/) (v1.1 or later recommended)
-   Node.js (v18 or later, primarily for Bun compatibility)

### Installation

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone <repository-url>
    cd zealthy-onboarding-test
    ```

2.  **Install dependencies using Bun:**
    ```bash
    bun install
    ```

### Running the Development Server

To start the Next.js development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Technology Stack

-   **Framework:** [Next.js](https://nextjs.org/) (v15 - App Router)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **UI Library:** [React](https://react.dev/) (v19)
-   **Component Library:** [Shadcn UI](https://ui.shadcn.com/) (built on Radix UI & Tailwind CSS)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **Forms:** [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for validation
-   **Package Manager:** [Bun](https://bun.sh/)

## Design Philosophy & Decisions

This project adheres to modern web development principles, focusing on maintainability, performance, accessibility, and a clean user experience.

1.  **Next.js App Router:**
    -   Leverages the App Router for improved routing, layout management, and server-side rendering capabilities.
    -   Utilizes React Server Components (RSCs) where appropriate to minimize client-side JavaScript and improve initial load times. Server Actions are used for form submissions and mutations, keeping data fetching and modification logic closer to the server.

2.  **React 19 Features:**
    -   Employs `useActionState` for handling form states and server action responses directly within components, simplifying state management for asynchronous operations.
    -   Utilizes `useFormStatus` to provide feedback during form submissions (e.g., disabling buttons, showing loading states) without needing manual state management.

3.  **TypeScript:**
    -   Strict type safety is enforced throughout the codebase to catch errors early and improve code reliability.
    -   Interfaces are preferred for defining object shapes, enhancing clarity.
    -   `satisfies` operator is used where applicable for type validation without altering the runtime type.

4.  **Component Architecture:**
    -   Components are structured logically, often separating concerns into specific files (e.g., forms, UI elements).
    -   Named exports are favored for clarity.
    -   Error boundaries and React Suspense are planned for robust handling of errors and loading states (though might not be fully implemented in all areas of this test project).

5.  **UI & Styling:**
    -   **Shadcn UI & Radix UI:** Provides accessible, unstyled primitives that are customized using Tailwind CSS, ensuring consistency and high-quality accessible components.
    -   **Tailwind CSS:** Used for utility-first styling, enabling rapid development and maintainable styles with a mobile-first approach. CSS variables are used for theming (as provided by Shadcn).
    -   **Accessibility:** Core components from Radix/Shadcn provide a strong foundation. Efforts are made to ensure semantic HTML, proper ARIA attributes, and keyboard navigability.

6.  **State Management:**
    -   Primarily relies on React's built-in state management (`useState`, `useReducer`) and server state management via React Server Components and Server Actions (`useActionState`). Client-side global state is avoided unless strictly necessary.

7.  **Forms:**
    -   React Hook Form is used for efficient, flexible form handling.
    -   Zod provides schema-based validation on both the client and server (within Server Actions), ensuring data integrity.

8.  **Performance:**
    -   Focus on minimizing client bundle size through RSCs.
    -   Image optimization and font optimization (`next/font`) would be standard practice in a production build.
    -   Next.js router cache configurations (`staleTimes`) can be tuned for optimal performance based on data freshness requirements.

9.  **Development Environment:**
    -   Bun is used for its speed in installing dependencies and running scripts.

## Project Structure

The `src/` directory contains the core application code:

```
src/
├── app/         # Next.js App Router pages and layouts
├── components/  # Reusable React components (UI elements, forms)
│   ├── onboarding/ # Components specific to the onboarding flow
│   └── ui/       # Shadcn UI components
├── lib/         # Utility functions, validation schemas, constants
│   └── validators/ # Zod validation schemas
├── actions/     # Server Actions for data mutation/fetching
├── types/       # TypeScript type definitions and interfaces
├── hooks/       # Custom React hooks (if any)
└── generated/   # Generated code (e.g., from Prisma, GraphQL - if used)
```


