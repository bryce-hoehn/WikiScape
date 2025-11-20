# Design Constants

This directory contains Material Design 3 (MD3) design constants used throughout the application.

## Philosophy: Refined Hybrid Approach

We use a **refined hybrid approach** that combines React Native Paper's built-in variants with our custom constants:

### When to Use React Native Paper Variants

Use RNP's `Text` component variants when:

- ✅ Standard text that follows MD3 defaults
- ✅ No custom fontSize/lineHeight overrides needed
- ✅ You want RNP to handle fontSize, fontWeight, and letterSpacing

**Example:**

```tsx
<Text variant="bodyMedium">Standard text content</Text>
```

### When to Use Our Constants

Use our `TYPOGRAPHY` and `SPACING` constants when:

- ✅ **Calculations**: Need to calculate lineHeight or other derived values
  ```tsx
  lineHeight: TYPOGRAPHY.bodyMedium * TYPOGRAPHY.lineHeightNormal;
  ```
- ✅ **Non-Text Components**: Components that don't support variants (Chip, HtmlRenderer, etc.)
  ```tsx
  <Chip textStyle={{ fontSize: TYPOGRAPHY.bodyMedium }} />
  ```
- ✅ **Custom Overrides**: App bar titles, tab labels, or other custom typography
  ```tsx
  fontSize: TYPOGRAPHY.appBarTitle;
  ```
- ✅ **Dynamic Sizing**: Article content with user preferences
- ✅ **Spacing**: All padding, margin, and gap values
  ```tsx
  padding: SPACING.base;
  ```

### Important: Avoid Redundancy

❌ **Don't do this** (redundant):

```tsx
<Text variant="bodyMedium" style={{ fontSize: TYPOGRAPHY.bodyMedium }}>
  Text
</Text>
```

✅ **Do this instead** (use variant's fontSize):

```tsx
<Text
  variant="bodyMedium"
  style={{ lineHeight: TYPOGRAPHY.bodyMedium * TYPOGRAPHY.lineHeightNormal }}
>
  Text
</Text>
```

Or if you need custom fontSize, remove the variant:

```tsx
<Text
  style={{
    fontSize: TYPOGRAPHY.bodyMedium,
    lineHeight: TYPOGRAPHY.bodyMedium * TYPOGRAPHY.lineHeightNormal,
  }}
>
  Text
</Text>
```

## Constants Overview

### `TYPOGRAPHY`

Typography size constants for MD3 type scale. Used for:

- Font size calculations
- Non-Text components
- Custom typography overrides

### `SPACING`

Spacing constants following MD3's 8dp grid system (4dp increments). Used for:

- All padding values
- All margin values
- All gap values
- Component heights that align with the grid (e.g., app bar height uses `SPACING.xxxl` for 64dp)

Note: Component-specific heights that don't align with the 8dp grid (e.g., search bar height of 56dp) are hardcoded with MD3 spec comments where used.

## Why Not Single Source of Truth?

React Native Paper provides:

- ✅ Typography variants (but not numeric values)
- ✅ Color tokens
- ✅ Border radius multiplier

React Native Paper does NOT provide:

- ❌ Spacing constants
- ❌ Typography size constants (numeric values)
- ❌ Component height constants

Our hybrid approach:

- Leverages RNP's variants where they work well
- Provides constants where RNP doesn't
- Avoids duplication while maintaining flexibility
- Keeps code DRY and maintainable
