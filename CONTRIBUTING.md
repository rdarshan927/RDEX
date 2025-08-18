# Contributing to RDEX Dashboard

Thank you for considering contributing to RDEX Dashboard! This document outlines the guidelines and process for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our code of conduct. Please be respectful and considerate of others.

## How Can I Contribute?

### Reporting Bugs

- Ensure the bug was not already reported by searching on GitHub under [Issues](https://github.com/yourusername/rdex-dashboard/issues)
- If you're unable to find an open issue addressing the problem, [open a new one](https://github.com/yourusername/rdex-dashboard/issues/new)
- Include a title and clear description, as much relevant information as possible, and steps to reproduce the issue

### Suggesting Enhancements

- Open a new issue with a clear title and detailed description
- Explain why this enhancement would be useful to most RDEX Dashboard users
- Provide examples of how the feature would work if possible

### Pull Requests

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests to ensure no regressions (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Guidelines

### Setting Up Development Environment

1. Clone the repository
2. Install dependencies with `npm install`
3. Start Firefox with the extension loaded: `npm run start:firefox`

### Code Style

- We use eslint for JavaScript linting
- Follow the existing code style
- Write clear, readable, and maintainable code
- Document complex functions and components

### Testing

- Run `npm test` to execute the tests
- Ensure your changes pass all existing tests
- Add new tests for new functionality

### Commit Messages

- Use clear and meaningful commit messages
- Reference issue numbers in commit messages when relevant (e.g., "Fix #42: Header alignment issue")

## Release Process

Only maintainers can release new versions. The process is:

1. Update the version in `manifest.json` and `package.json`
2. Update the CHANGELOG.md file
3. Create a new tag with the version number
4. Build the extension with `npm run build`
5. Submit to Firefox Add-ons

Thank you for contributing to RDEX Dashboard!
