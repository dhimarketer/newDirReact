# Settings Components

This directory contains reusable components for the Settings page functionality.

## Components

### SettingSection
A wrapper component that provides consistent styling and structure for different settings sections.

**Props:**
- `title`: Section title
- `description`: Optional section description
- `children`: Section content
- `className`: Additional CSS classes

**Usage:**
```tsx
<SettingSection title="Profile Information" description="Update your personal information">
  {/* Form fields go here */}
</SettingSection>
```

### FormField
A flexible form field component that supports multiple input types.

**Props:**
- `label`: Field label
- `name`: Field name/ID
- `type`: Input type ('text', 'email', 'password', 'select', 'textarea', 'checkbox', 'radio')
- `value`: Field value
- `onChange`: Change handler function
- `placeholder`: Optional placeholder text
- `required`: Whether field is required
- `disabled`: Whether field is disabled
- `error`: Error message to display
- `options`: Array of options for select/radio fields
- `className`: Additional CSS classes

**Usage:**
```tsx
<FormField
  label="Username"
  name="username"
  type="text"
  value={username}
  onChange={setUsername}
  required
  placeholder="Enter your username"
/>
```

### SaveButton
A styled button component for saving settings with loading state support.

**Props:**
- `onClick`: Click handler function
- `loading`: Whether to show loading state
- `disabled`: Whether button is disabled
- `children`: Button text/content
- `className`: Additional CSS classes

**Usage:**
```tsx
<SaveButton
  onClick={handleSave}
  loading={isLoading}
  disabled={!hasChanges}
>
  Save Changes
</SaveButton>
```

## Settings Page Structure

The main Settings page is organized into the following sections:

1. **Profile Information**: Personal details and social media links
2. **Preferences**: Theme, language, timezone, and notification preferences
3. **Privacy Settings**: Visibility controls and interaction permissions
4. **Notification Settings**: Email, push, and SMS notification preferences
5. **Security**: Password change, data export, and account deletion

## State Management

Settings are managed using Zustand store (`useSettingsStore`) with the following features:

- Persistent storage for user preferences
- Loading states for each settings section
- Error handling and display
- Optimistic updates with rollback on failure

## API Integration

The settings service (`settingsService`) handles all API communication:

- Fetch user settings
- Update profile information
- Modify privacy and notification preferences
- Change password
- Export user data
- Delete account

## Styling

All components use Tailwind CSS for consistent styling and responsive design. The design follows the project's established patterns and color scheme.

## Accessibility

Components include proper ARIA labels, keyboard navigation support, and screen reader compatibility.
