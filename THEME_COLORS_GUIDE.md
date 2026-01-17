# Theme Colors Implementation Guide

## CSS Variables Available

Your website now has these CSS variables available globally:

```css
:root {
  --primary-color: #ff7043;      /* Main brand color (buttons, highlights) */
  --secondary-color: #ff4500;    /* Secondary brand color */
  --accent-color: #e85a4f;       /* Accent color */
  --text-color: #333333;         /* Main text color */
  --background-color: #fcfcfc;   /* Page background */
}
```

## How to Use

In any CSS file, replace hardcoded colors with variables:

### Before:
```css
button {
  background-color: #ff7043;
  color: #333333;
}
```

### After:
```css
button {
  background-color: var(--primary-color);
  color: var(--text-color);
}
```

## Color Replacement Map

Replace these hardcoded values:

**Primary/Brand Colors:**
- `tomato` → `var(--primary-color)`
- `#ff7043` → `var(--primary-color)`
- `orangered` → `var(--primary-color)`

**Secondary Colors:**
- `#ff4500` → `var(--secondary-color)`
- `#ff5722` → `var(--secondary-color)`

**Accent Colors:**
- `#e85a4f` → `var(--accent-color)`
- `#e64a19` → `var(--accent-color)`
- `#d84315` → `var(--accent-color)`

**Text Colors:**
- `#333` or `#333333` → `var(--text-color)`
- `#2c3e50` → `var(--text-color)`

**Background Colors:**
- `#fcfcfc` → `var(--background-color)`
- `#f8f9fa` → `var(--background-color)`

**Keep as-is (for contrast):**
- `#fff` or `#ffffff` (pure white for cards/modals)
- `#000` or `#000000` (pure black for text)

## Example: Updating a Button

```css
/* Old */
.my-button {
  background: tomato;
  color: white;
  border: 1px solid #ff5722;
}

.my-button:hover {
  background: #ff5722;
}

/* New */
.my-button {
  background: var(--primary-color);
  color: white;
  border: 1px solid var(--secondary-color);
}

.my-button:hover {
  background: var(--secondary-color);
}
```

## Gradients

```css
/* Old */
background: linear-gradient(135deg, tomato, #ff5722);

/* New */
background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
```

## Files to Update

Key files that need color updates:

### Frontend:
- `src/components/NavBar/NavBar.css`
- `src/components/Footer/Footer.css`
- `src/components/Header/Header.css`
- `src/components/FoodItem/FoodItem.css`
- `src/pages/Cart/Cart.css`
- `src/pages/PlaceOrder/PlaceOrder.css`
- `src/pages/MyOrders/MyOrders.css`

### Admin:
- `src/components/Sidebar/Sidebar.css`
- `src/pages/*/` (all page CSS files)

## Testing

After updating CSS files:
1. Restart backend: `npm start` (in backend folder)
2. Restart admin: `npm run dev` (in admin folder)
3. Restart frontend: `npm run dev` (in frontend folder)
4. Go to Settings page
5. Change a color
6. Click Save
7. Colors should update across all pages immediately

## Current Status

✅ Theme system installed
✅ CSS variables defined
✅ Theme utility functions created
✅ Auto-apply on page load
✅ Auto-apply after settings save

⏳ Manual step: Replace hardcoded colors in CSS files with variables
