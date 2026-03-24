# Design System Documentation

## Overview
The project now uses a small NGX design system centered on brand tokens, shared form primitives, and predictable page composition. The immediate target is the onboarding flow, but the same primitives should be reused across login, dashboard forms, and any future multi-step workflows.

## Foundations

### Brand Tokens
- Brand green scale: `brand.50` to `brand.900`
- Neutral scale: `neutral.0` to `neutral.900`
- Semantic text tokens: `text.strong`, `text.body`, `text.muted`, `text.inverse`
- Semantic surface tokens: `surface.canvas`, `surface.elevated`, `surface.brand`, `surface.brandDeep`
- Border tokens: `border.subtle`, `border.strong`, `border.focus`
- Feedback tokens: `feedback.success`, `feedback.warning`, `feedback.error`, `feedback.info`

### Typography
- Primary font: `Manrope`
- Use tight tracking on page headings and primary CTAs
- Body copy should stay in the `13px` to `15px` range for forms and helper text

### Shape and Elevation
- Inputs use `10px` corners
- Buttons use `14px` corners
- Pills use fully rounded corners
- Only use medium shadow for elevated cards or floating panels

## Components

### Button
- Variants: `primary`, `secondary`, `outline`, `ghost`
- Sizes: `sm`, `md`, `lg`
- Supports inline icons and loading states
- Primary actions should default to the brand green fill

### Input
- Standard text-field wrapper with label, helper text, validation, and optional icon support
- Uses shared border, focus, and error treatments
- Prefer this over ad hoc input styling

### Checkbox
- Compact checkbox tuned for dense form copy blocks
- Supports rich labels and inline validation

### PasswordRequirements
- Displays validation requirements as a compact responsive grid
- Designed to sit directly under password fields in onboarding and account settings

## Layout Pattern

### Auth Split Layout
- Left panel: brand surface, logo, atmospheric background geometry, supporting message
- Right panel: compact form column with restrained width and soft canvas background
- Mobile: brand panel collapses into a lightweight top section, form remains primary

## Usage Rules

1. Start from tokens in `client/src/design/tokens.js` before introducing new colors or spacing values.
2. Prefer shared primitives from `client/src/design/` over page-local control styling.
3. If a pattern repeats across two screens, promote it into the design system instead of duplicating classes.
4. Use semantic text and surface tokens rather than raw hex values in component code where practical.
5. Keep form widths compact; this product reads better with dense but breathable onboarding screens.

## Current Scope

The current system covers the onboarding form primitives and NGX auth layout direction. Natural next additions are a field group primitive, a section heading primitive, and a shared auth-shell component once login adopts the same pattern.
