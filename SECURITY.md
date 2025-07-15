# Security Policy

## Supported Versions

We actively support the following versions of Investment Dashboard with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability, please follow these guidelines:

### Where to Report

- **Email**: security@investmentdashboard.com
- **GitHub**: For non-sensitive issues, you can create a security advisory on GitHub

### What to Include

Please provide the following information:

1. **Description**: Clear description of the vulnerability
2. **Steps to Reproduce**: Detailed steps to reproduce the issue
3. **Impact**: Potential impact and severity
4. **Affected Versions**: Which versions are affected
5. **Proof of Concept**: If possible, provide a proof of concept
6. **Suggested Fix**: If you have ideas for fixing the issue

### Response Timeline

- **Acknowledgment**: We will acknowledge receipt within 24 hours
- **Initial Assessment**: We will provide an initial assessment within 72 hours
- **Status Updates**: We will provide regular updates every 5 business days
- **Resolution**: We aim to resolve critical vulnerabilities within 7 days

### Security Measures

Our application implements the following security measures:

#### Authentication & Authorization
- Firebase Authentication for secure user management
- JWT tokens for session management
- Role-based access control
- Secure password requirements

#### Data Protection
- Data encryption in transit (HTTPS)
- Firestore security rules to protect user data
- Environment variable protection
- Input validation and sanitization

#### Infrastructure Security
- Regular dependency updates
- ESLint security rules
- Secure deployment practices
- CORS configuration

### Responsible Disclosure

We follow responsible disclosure practices:

1. **Private Report**: Report vulnerabilities privately first
2. **Coordination**: Work with our team to understand and fix the issue
3. **Public Disclosure**: Public disclosure only after the issue is resolved
4. **Credit**: Security researchers will be credited for their findings

### Security Updates

When security vulnerabilities are fixed:

1. **Patch Release**: We will release a patch version
2. **Security Advisory**: We will publish a security advisory
3. **Notification**: Users will be notified through our communication channels
4. **Documentation**: We will update our security documentation

### Bug Bounty Program

Currently, we do not have a formal bug bounty program. However, we appreciate security researchers who help improve our security posture and will acknowledge their contributions.

### Contact Information

For security-related inquiries:
- **Email**: security@investmentdashboard.com
- **PGP Key**: Available on request
- **Response Time**: 24 hours maximum

---

Thank you for helping keep Investment Dashboard secure!