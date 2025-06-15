# 🔐 Security Policy

## 📦 Supported Versions

We currently support the latest `main` branch of **fintrack**. Other branches are not guaranteed to receive security updates.

| Version | Supported |
|---------|-----------|
| main    | ✅ Yes    |
| others  | ❌ No     |

## 🚨 Reporting a Vulnerability

If you discover a security issue in **fintrack**, please report it **privately** to avoid potential abuse.

Instead, report it discreetly by emailing the maintainer.

When reporting, please include:
- A clear description of the vulnerability
- Steps to reproduce the issue
- The potential impact
- Suggestions for resolution (if any)

We aim to:
- ⏱️ Respond within **3 working days**
- 🛠️ Resolve high-priority issues within **14 days**

## 🛡️ Scope of Vulnerability Reporting

We're especially interested in:
- Exposure of sensitive financial or personal data
- Authentication or authorization flaws
- SQL Injection (if applicable)
- XSS, CSRF, or other client-side issues
- Insecure API endpoints or open redirects

Please **do not** report:
- Vulnerabilities in third-party libraries unless directly exploitable in this app
- Outdated dependencies without an exploit
- Automated scan results without proof-of-concept

## ⚖️ Responsible Testing Guidelines

- Test in a local environment when possible
- Do not disrupt any live deployments
- Use demo/test accounts only
- Do not access or modify other users' data

## 👨‍💻 Developer Security Practices

When contributing:
-  Sanitize and validate all user input
-  Never commit secrets or API keys
-  Implement proper access controls for financial data
-  Ensure all data in transit uses HTTPS
-  Run `npm audit` or `yarn audit` regularly

## 🔧 Dependencies

This project may use:
- React or Vue (frontend)
- Node.js/Express (backend)
- MongoDB, Firebase, or similar
- Chart libraries or financial APIs

Keep dependencies updated and avoid known vulnerabilities.

## 📢 Disclosure Policy

We follow a **responsible disclosure** policy. All valid reports will be acknowledged, and reporters may be credited (upon request).

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability)

---

🙏 Thank you for helping us make **fintrack** more secure!
