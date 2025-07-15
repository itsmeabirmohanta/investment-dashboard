# Contributing to Investment Dashboard

Thank you for your interest in contributing to Investment Dashboard! This document provides guidelines and instructions for contributors.

## 🤝 Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct. Please report unacceptable behavior to the project maintainers.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- Firebase project for testing
- Git for version control

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/investment-dashboard.git
   cd investment-dashboard
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up your development environment variables (see README.md)

5. Start the development server:
   ```bash
   npm run dev
   ```

## 🎯 How to Contribute

### Reporting Issues

- Use the GitHub issue tracker to report bugs
- Include detailed reproduction steps
- Provide screenshots if applicable
- Specify your environment (OS, browser, Node.js version)

### Suggesting Features

- Open an issue with the "enhancement" label
- Clearly describe the feature and its benefits
- Include mockups or examples if helpful

### Code Contributions

1. **Find an Issue**: Look for open issues labeled "good first issue" or "help wanted"
2. **Create a Branch**: Create a new branch for your feature/fix
3. **Write Code**: Follow the coding standards below
4. **Test**: Ensure your changes work correctly
5. **Submit PR**: Open a pull request with a clear description

## 📝 Coding Standards

### TypeScript Guidelines

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` type unless absolutely necessary
- Use meaningful variable and function names

### React Best Practices

- Use functional components with hooks
- Implement proper error boundaries
- Follow React Query patterns for data fetching
- Use React Hook Form for form handling

### Styling Guidelines

- Use Tailwind CSS classes
- Follow shadcn/ui component patterns
- Ensure responsive design
- Maintain consistent spacing and typography

### File Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── ...
├── [module]/           # Feature-specific modules
│   ├── components/     # Module-specific components
│   └── services/       # Module-specific services
├── lib/                # Utility functions
├── hooks/              # Custom React hooks
└── types/              # TypeScript type definitions
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Write unit tests for utility functions
- Write integration tests for components
- Use React Testing Library for component tests
- Mock Firebase services in tests

## 📋 Pull Request Process

1. **Update Documentation**: Update README.md if needed
2. **Follow Naming**: Use descriptive branch names (e.g., `feature/add-crypto-tracking`)
3. **Commit Messages**: Write clear, concise commit messages
4. **PR Description**: Include:
   - What changes were made
   - Why the changes were needed
   - Testing instructions
   - Screenshots (if UI changes)

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Manual testing completed
- [ ] Screenshots attached (if applicable)

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

## 🏗️ Architecture Guidelines

### Component Structure

```typescript
// Component file structure
import { useState } from 'react';
import { ComponentProps } from './types';

interface Props extends ComponentProps {
  // Additional props
}

export const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  // Component logic
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

### Service Layer

- Keep business logic separate from UI components
- Use proper error handling
- Implement proper TypeScript types
- Follow Firebase best practices

### State Management

- Use React Query for server state
- Use React Context for global app state
- Use local state for component-specific data
- Implement proper loading and error states

## 🔄 Development Workflow

1. **Issue Assignment**: Comment on an issue to get it assigned
2. **Branch Creation**: Create a feature branch from `main`
3. **Development**: Make changes following the guidelines
4. **Testing**: Test your changes thoroughly
5. **Pull Request**: Submit PR with proper description
6. **Review**: Address feedback from maintainers
7. **Merge**: PR will be merged after approval

## 🚨 Common Mistakes to Avoid

- Don't commit environment files (`.env`)
- Don't skip TypeScript types
- Don't ignore ESLint warnings
- Don't make breaking changes without discussion
- Don't submit PRs without testing

## 📚 Resources

- [React Documentation](https://reactjs.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

## 🆘 Getting Help

- Join our [Discord server](https://discord.gg/investmentdashboard) for real-time help
- Check existing [GitHub issues](https://github.com/username/investment-dashboard/issues)
- Email the maintainers at contribute@investmentdashboard.com

## 📄 License

By contributing to Investment Dashboard, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Investment Dashboard! 🎉