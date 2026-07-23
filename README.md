# Portfolio + Wealthforge

## On UBUNTU get tree

- Run below command to list all the fodlers and files under a dirctory in the tree strcture similar to `tree /F` on windoes.

```bash
$ cd src
$ find . | sed -e "s/[^-][^\/]*\// |/g" -e "s/|\([^ ]\)/|-\1/"
```

## Running and Deploying the Frontend on the Server

The frontend source code is stored at:

```bash
/home/rajkaran/apps/portfolio-frontend
```

The application is built using Vite. The generated production files are stored in:

```bash
/home/rajkaran/apps/portfolio-frontend/dist
```

Nginx serves the deployed production build from:

```bash
/var/www/frontend
```

The frontend does not run as a persistent Node.js or PM2 process. Nginx directly serves the compiled static files.

### Connect to the server

```bash
ssh rajkaran@10.0.0.40
```

### Update the frontend source code

```bash
cd ~/apps/portfolio-frontend
git pull origin main
```

The `.env` file may contain server-specific configuration and may intentionally have local changes. Do not overwrite or commit it without checking its contents.

### Install dependencies

Run this when dependencies have changed or after a fresh checkout:

```bash
npm install
```

For a cleaner, reproducible install based on `package-lock.json`, use:

```bash
npm ci
```

### Build the production application

```bash
npm run build
```

This runs TypeScript compilation and the Vite production build:

```bash
tsc -b && vite build
```

The generated application will be placed in:

```bash
dist/
```

### Deploy the frontend build

The deployed files under `/var/www/frontend` are owned by `www-data`, so elevated permissions are required.

Remove the previous deployment:

```bash
sudo rm -rf /var/www/frontend/*
```

Copy the new Vite build:

```bash
sudo cp -r dist/* /var/www/frontend/
```

Verify the deployed files:

```bash
ls -la /var/www/frontend
```

The directory should contain files similar to:

```text
assets/
index.html
favicon.ico
banner.png
logo.png
```

### Validate and reload Nginx

A frontend-only deployment normally does not require an Nginx reload because the files are served directly. However, validating and reloading Nginx is safe:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Nginx configuration

The active Nginx configuration is:

```bash
/etc/nginx/sites-enabled/frontend
```

The `try_files` fallback sends unknown routes to `index.html`, allowing React Router routes such as `/trade`, `/ticker`, and `/dashboard` to work when opened directly.

### Verify the frontend

Open the server address in a browser:

```text
http://10.0.0.40
```

You can also verify Nginx locally on the server:

```bash
curl -I http://127.0.0.1
```

### Important notes

- Do not run `rm -rf` inside `/var/www/frontend` without `sudo`; the deployed files are owned by `www-data`.
- Do not delete `/var/www/frontend` itself. Only clear its contents.
- The frontend is not managed by PM2.
- PM2 is only used for the backend application.
- Nginx serves the Vite build directly from `/var/www/frontend`.
