# Replit.md

## Overview

This is a frontend application for a document management system called "frontend_bresler". The application is built with React, TypeScript, and Vite, featuring user authentication, letter/document management, order tracking, and a rich document editor. The frontend communicates with a Django REST Framework backend API.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Framework
- **Vite + React + TypeScript**: Modern build tooling with React 18 and TypeScript for type safety
- **React Compiler**: Enabled via babel-plugin-react-compiler for automatic optimization
- **Path Aliases**: Configured for clean imports using `@/`, `@app/`, `@pages/`, `@widgets/`, `@features/`, `@entities/`, `@shared/`, `@components/`

### State Management & Data Fetching
- **TanStack React Query**: Handles all server state, caching, and data synchronization
- **Zustand**: Used for document editor state management (useEditorStore in `@entities/docs`)
- **React Hook Form + Zod**: Form handling with schema validation for auth and letter forms

### UI Component Architecture
- **shadcn/ui**: Complete component library using Radix UI primitives
- **Tailwind CSS v4**: Utility-first styling with CSS variables for theming
- **Bootstrap**: Additional CSS framework loaded via CDN for legacy styling
- **class-variance-authority (CVA)**: Variant-based component styling

### Routing & Layout
- **React Router DOM**: Client-side routing with protected route wrapper
- **Layout Pattern**: Centralized layout component wrapping all routes in `src/app/layouts/`
- **Protected Routes**: Authentication check via access token before accessing restricted pages

### Authentication Flow
- **JWT Token-based**: Access and refresh tokens stored client-side
- **Axios Interceptors**: Automatic token refresh and auth header injection
- **Bootstrap Profile**: Auto-loads user profile on app initialization when authenticated

### Feature-Sliced Design (Partial)
The project follows a modified Feature-Sliced Design architecture:
- `src/app/` - Application shell, routing, providers
- `src/pages/` - Page components (authorization, catalog, home, letter, letters, orders, test)
- `src/features/` - Business logic features (authorization, letters, users)
- `src/entities/` - Domain entities (docs/editor store)
- `src/shared/` - Shared utilities, API clients, types, hooks
- `src/components/` - Reusable UI components (editor, shadcn/ui)

### Document Editor
Custom document editor with:
- Canvas-based field/table placement with snap-to-grid
- PDF and DOCX preview support (react-pdf, mammoth)
- History/undo-redo functionality
- Export to PDF/DOCX formats
- Mobile-responsive toolbar

## External Dependencies

### Backend API
- **Django REST Framework**: Backend server providing REST API endpoints
- **Base URL**: Configured in shared API client (axios instance)
- **Endpoints**: 
  - `/users/api/` - Authentication and user profile
  - Letters/documents CRUD operations
  - Order management

### Database
- **Neon Serverless**: PostgreSQL database client included (`@neondatabase/serverless`)
- **connect-pg-simple**: Session storage support (likely for backend)

### Third-Party Libraries
- **Axios**: HTTP client with interceptors for auth
- **mammoth**: DOCX to HTML conversion for document preview
- **react-pdf + pdfjs-dist**: PDF rendering and preview
- **embla-carousel-react**: Carousel functionality
- **react-day-picker**: Date picker component
- **react-resizable-panels**: Resizable panel layouts
- **input-otp**: OTP input component
- **recharts**: Charting library for data visualization

### CDN Resources
- Bootstrap CSS/JS (v5.3)
- Bootstrap Icons
- Font Awesome Icons
- docx-preview CSS
- Google Fonts

### Development Tools
- ESLint with TypeScript support
- React Hooks and React Refresh plugins
- TanStack React Query DevTools