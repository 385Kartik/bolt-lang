# Publishing the Bolt extension

Publishing to the VS Code Marketplace is free. You need your own accounts, so this part is yours to do.
(Check the current rules on https://code.visualstudio.com/api/working-with-extensions/publishing-extension before you start, they can change.)

## One time setup

1. **Microsoft account**: use any Microsoft account (outlook.com, or create one).
2. **Azure DevOps organization** (free): sign in at https://dev.azure.com and create an organization.
3. **Personal Access Token**: in Azure DevOps open *User settings → Personal access tokens → New token*.
   - Organization: **All accessible organizations**
   - Scopes: **Custom defined → Marketplace → Manage**
   - Copy the token somewhere safe. It is shown only once. Never put it in the repository.
4. **Publisher**: go to https://marketplace.visualstudio.com/manage and create a publisher. Pick an ID (for example `kartik-bolt`).
5. In `package.json` change `"publisher"` to your publisher ID.

## Every release

```bash
# 1. make sure everything passes
npm test

# 2. bump "version" in extensions/bolt-language-support/package.json and add a line to CHANGELOG.md

# 3. try the package locally (creates a .vsix file you can install with "Extensions: Install from VSIX...")
npm run package:vscode

# 4. publish
cd extensions/bolt-language-support
npx @vscode/vsce login <your-publisher-id>     # paste the token when asked
npx @vscode/vsce publish
```

The extension appears on the Marketplace a few minutes after `publish`.

## Open VSX (VSCodium, Gitpod, and other editors)

Also free. Create an account at https://open-vsx.org, make a token, then:

```bash
npx ovsx publish bolt-language-support-<version>.vsix -p <token>
```

## Before the first release

- Replace `icon.png` if you want a different logo (it must be a real PNG, 128x128 or larger).
- Keep the README short and show a screenshot of colors and suggestions (add it to the README as an image).
- The `.vsix` file is git-ignored, do not commit it.
