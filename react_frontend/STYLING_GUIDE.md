# Styling Guide - Pico.css Approach

## 2025-01-27: Refactored to use Pico.css for lightweight, responsive, and professional styling

### Overview
This project uses Pico.css for lightweight, responsive, and professional styling. The approach focuses on:

1. **Semantic HTML** for better accessibility and SEO
2. **Pico.css defaults** for consistent, professional appearance
3. **Minimal custom CSS** for application-specific needs
4. **Responsive design** that works on all devices
5. **Accessibility-first** approach with proper focus states and ARIA labels

### Core Principles

#### 1. Use Pico.css Classes First
Always prefer Pico.css classes over custom CSS:
```tsx
// ✅ Good - Using Pico.css classes
<button className="btn-primary">Submit</button>
<input className="form-input" />
<div className="card">Content</div>

// ❌ Bad - Custom CSS classes
<div className="custom-container">
```

#### 2. Semantic HTML Structure
Use proper HTML elements for better accessibility:
```tsx
// ✅ Good - Semantic HTML
<main className="content-wrapper">
  <article className="card">
    <header className="card-header">
      <h2 className="card-title">Section Title</h2>
    </header>
    <div className="card-content">
      Content goes here
    </div>
  </article>
</main>

// ❌ Bad - Generic divs
<div className="content-wrapper">
  <div className="card">
    <div className="card-header">
      <div className="card-title">Section Title</div>
    </div>
    <div className="card-content">
      Content goes here
    </div>
  </div>
</div>
```

#### 3. Consistent Spacing
Use the defined spacing scale to prevent layout conflicts:
```tsx
// ✅ Good - Consistent spacing
<div className="space-y-3">  // 12px between children
<div className="p-3">         // 18px padding
<div className="mt-4">        // 24px top margin

// ❌ Bad - Arbitrary spacing
<div className="mt-[17px]">   // Avoid arbitrary values
```

#### 4. Responsive Design
Use Pico.css responsive utilities and CSS Grid:
```tsx
// ✅ Good - Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// ✅ Good - Responsive utilities
<div className="mobile-only">Mobile content</div>
<div className="desktop-only">Desktop content</div>
```

### Spacing Scale

| Class | Value | Use Case |
|-------|-------|----------|
| `space-y-1` | 8px | Minimal spacing between small elements |
| `space-y-2` | 16px | Small spacing between related elements |
| `space-y-3` | 24px | Standard spacing between form elements |
| `space-y-4` | 32px | Standard spacing between sections |
| `space-y-5` | 48px | Large spacing between major sections |

### Component Patterns

#### Card Components
```tsx
<article className="card">
  <header className="card-header">
    <h3 className="card-title">Card Title</h3>
  </header>
  <div className="card-content">
    Card content goes here
  </div>
</article>
```

#### Form Components
```tsx
<div className="form-group">
  <label htmlFor="field-name" className="form-label">
    Field Label
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
  <input
    id="field-name"
    name="field-name"
    type="text"
    className="form-input"
    placeholder="Enter value"
    required={required}
  />
  {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
</div>
```

#### Button Components
```tsx
// Primary button
<button className="btn-primary">
  Submit
</button>

// Secondary button
<button className="btn-secondary">
  Cancel
</button>

// With icons
<button className="btn-primary inline-flex items-center">
  <SearchIcon className="w-4 h-4 mr-2" />
  Search
</button>
```

#### Navigation Components
```tsx
<nav className="nav-container" aria-label="Main navigation">
  <Link to="/" className="nav-link">Home</Link>
  <Link to="/directory" className="nav-link">Directory</Link>
  <Link to="/family" className="nav-link">Family</Link>
</nav>
```

#### Table Components
```tsx
<div className="table-container">
  <table className="table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>John Doe</td>
        <td>john@example.com</td>
        <td><span className="badge badge-success">Active</span></td>
      </tr>
    </tbody>
  </table>
</div>
```

### Layout Structure

#### Page Container
```tsx
<div className="app-container">
  <Header />
  <main className="content-wrapper">
    <nav className="mb-3" aria-label="Breadcrumb">
      <Breadcrumb />
    </nav>
    <article className="fade-in">
      <Outlet />
    </article>
  </main>
</div>
```

#### Section Layout
```tsx
<section className="section">
  <div className="content-wrapper">
    <h2 className="section-title text-center">Section Title</h2>
    <p className="section-subtitle text-center">Section description</p>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Content items */}
    </div>
  </div>
</section>
```

### What to Avoid

#### 1. Custom CSS Classes
```tsx
// ❌ Avoid custom CSS classes
<div className="search-bar-container">
<div className="custom-modal">

// ✅ Use Pico.css classes instead
<div className="search-container">
<div className="modal-overlay">
```

#### 2. Inline Styles
```tsx
// ❌ Avoid inline styles
<div style={{ marginTop: '17px', zIndex: 9999 }}>

// ✅ Use Pico.css classes
<div className="mt-4 z-20">
```

#### 3. Complex Selectors
```tsx
// ❌ Avoid complex CSS selectors
.search-bar-container > div > div > div > div

// ✅ Use Pico.css classes and component structure
<div className="search-container">
```

#### 4. !important Declarations
```tsx
// ❌ Never use !important in CSS
margin-top: 16px !important;

// ✅ Use Pico.css classes with proper specificity
className="mt-4"
```

### Migration Checklist

When updating existing components:

1. **Replace Tailwind classes** with Pico.css equivalents
2. **Use semantic HTML elements** (article, section, nav, main, etc.)
3. **Apply consistent spacing** using spacing scale values
4. **Use component utilities** for common patterns
5. **Test responsive behavior** on mobile and desktop
6. **Ensure accessibility** with proper ARIA labels and focus states

### Testing

After making styling changes:

1. **Check for responsive behavior** on different screen sizes
2. **Verify accessibility** with screen readers and keyboard navigation
3. **Test focus states** and keyboard interactions
4. **Ensure consistent spacing** between elements
5. **Check for any console errors** related to CSS

### Accessibility Features

#### Focus Management
```tsx
// ✅ Good - Proper focus styles
<button className="btn-primary" aria-label="Submit form">
  Submit
</button>

// ✅ Good - ARIA labels for screen readers
<nav aria-label="Main navigation">
  <Link to="/" aria-current={location.pathname === '/' ? 'page' : undefined}>
    Home
  </Link>
</nav>
```

#### Screen Reader Support
```tsx
// ✅ Good - Descriptive text for screen readers
<span className="sr-only">Search for users</span>
<SearchIcon className="w-5 h-5" aria-hidden="true" />

// ✅ Good - Status announcements
<div role="status" aria-live="polite">
  {isLoading ? 'Loading...' : 'Search complete'}
</div>
```

### Summary

This Pico.css approach provides:

- **Lightweight styling** without heavy frameworks
- **Professional appearance** with minimal custom CSS
- **Semantic HTML** for better accessibility and SEO
- **Responsive design** that works on all devices
- **Consistent spacing** and component patterns
- **Accessibility-first** approach with proper focus states

The result is a maintainable, accessible, and professional styling system that prioritizes speed, clarity, and mobile-friendliness.
