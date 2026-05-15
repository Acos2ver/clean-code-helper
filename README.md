# Clean Code Helper

Clean Code Helper is a VS Code extension that highlights and fixes common spelling and whitespace issues while coding.

## Features

- Detects common spelling mistakes
- Detects repeated spaces
- Detects trailing whitespace
- Provides Quick Fix actions for individual issues
- Provides a Fix All command for the current file
- Supports Python, JavaScript, TypeScript, Java, and C++

## Installation

For local testing, package the extension as a VSIX file and install it manually:

```powershell
npm run compile
vsce package
code --install-extension clean-code-helper-0.0.1.vsix
```

## Usage

1. Open a supported file.
2. Type code with a common typo or spacing issue.
3. Hover over the highlighted issue and use Quick Fix, or run the Fix All command from the Command Palette.

## Commands

### Clean Code Helper: Fix All Issues in Current File

Fixes all supported issues in the current file, including common typos, repeated spaces, and trailing whitespace.

## Example

Before:

```python
message  =  "teh value is wrong"    
adress  =  "home"
recieve  =  "email"
lenght  =  10
```

After running Fix All:

```python
message = "the value is wrong"
address = "home"
receive = "email"
length = 10
```

## Supported Languages

- Python
- JavaScript
- TypeScript
- Java
- C++

## Marketplace

Install Clean Code Helper from the Visual Studio Marketplace:

https://marketplace.visualstudio.com/items?itemName=acos2ver.clean-code-helper

## Author

Olivia Choi, 2026
