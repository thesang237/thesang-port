# 🚀 Project Setup & CI/CD Guide

## 🧱 1. Initialize a New Repository

1. Create a new GitHub repository:

- Go to **GitHub → New Repository**
- Choose visibility (Public / Private)
- Don’t add a README or `.gitignore` yet

2. Initialize the project locally:

```bash
mkdir your-project
cd your-project
git init
yarn init -y
```

3. Add your source code structure:

```bash
/src
index.ts
/public
package.json
yarn.lock
```

4. Set up your first commit:

```bash
git add .
git commit -m "chore: initial commit"
git branch -M develop
git remote add origin git@github.com:<your-org>/<your-repo>.git
git push -u origin develop
```

## ⚙️ 2. Project Setup (Local Development)

1. Install dependencies:

```bash
yarn install
```

2. Set up environment variables:

```bash
cp envs/env.local .env
```

3. Run the development server:

```bash
yarn dev
```

## 🧰 3. Setting Up Secrets (Required for CI/CD)

Go to your GitHub repository → Settings → Secrets and variables → Actions
Add the following secrets:

- SSH_HOST: Your server IP or hostname
- SSH_USERNAME: SSH username (e.g. root)
- SSH_PRIVATE_KEY: Private key contents used for SSH authentication
- STAGING_SSH_PATH: Directory path for the staging app on server
- PRODUCTION_SSH_PATH: Directory path for production app
- STAGING_ENV_PATH: Path to staging environment variables
- PRODUCTION_ENV_PATH: Path to production environment variables
- STAGING_PM2_NAME: PM2 process name for staging
- PRODUCTION_PM2_NAME: PM2 process name for production
