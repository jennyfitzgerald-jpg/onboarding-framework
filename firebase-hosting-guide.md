# Quick note: Publish a page to Firebase Hosting (Pathology Dashboard)

## Preconditions

- You have a Firebase project.
- You have Node.js installed.
- Your site files are ready (e.g., `index.html`, css/js assets).

---

## One-time setup (per repo)

### Install Firebase CLI:

```bash
npm i -g firebase-tools
```

### Login and init Hosting in the project folder:

```bash
firebase login
firebase init hosting
```

- Choose the correct Firebase project.
- **Set public directory:**
  - If static HTML/CSS/JS at repo root, use `.` (dot) or a folder like `public`
  - If you build to a folder (e.g., `dist`), set that
- If it's a single-page app, answer **Yes** to "Configure as a single-page app" (rewrites to `index.html`).

---

## Deploy

From the repo folder:

```bash
firebase deploy --only hosting
```

Firebase will output the Hosting URL.

---

## Typical configurations

- **Static site in `public/`:** copy your HTML/assets into `public/`, deploy.
- **Built site:** run your build command first (e.g., `npm run build`), then deploy (hosting public should point to `dist/` or equivalent).

---

## Project Info

| Property   | Value                        |
|------------|------------------------------|
| Project ID | `pathology-dashboard-ac128`  |
| Site       | `pathology-dashboard-ac128`  |

---

## Configuration Files

### `.firebaserc`

```json
{
  "projects": {
    "default": "pathology-dashboard-ac128"
  }
}
```

### `firebase.json`

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "site": "pathology-dashboard-ac128",
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**",
      "**/*.bat",
      "**/*.sh",
      "**/*.ps1",
      "**/*.py",
      "**/cleanup_backup/**"
    ],
    "rewrites": [],
    "headers": [
      {
        "source": "/data/**/*.json",
        "headers": [
          { "key": "Content-Type", "value": "application/json" },
          { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
        ]
      },
      {
        "source": "**/*.js",
        "headers": [
          { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
        ]
      },
      {
        "source": "**/*.css",
        "headers": [
          { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
        ]
      },
      {
        "source": "**/*.html",
        "headers": [
          { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
        ]
      }
    ]
  }
}
```

**Key points:**

- `public: "."` — deploys from repo root (not a subfolder)
- No SPA rewrites configured
- Aggressive no-cache headers on all static assets (HTML, CSS, JS, JSON)
- Ignores scripts (`.bat`, `.sh`, `.ps1`, `.py`), dotfiles, and `node_modules`

---

### `firestore.rules`

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isDeciphexUser() {
      return isAuthenticated() && 
             request.auth.token.email.matches('.*@deciphex.com$');
    }
    
    match /billing_records/{recordId} {
      allow read: if isDeciphexUser();
      allow write: if request.auth == null; // service accounts
    }
    
    match /metadata/{document} {
      allow read: if isDeciphexUser();
      allow write: if request.auth == null;
    }

    match /users/{userId} {
      allow read, write: if isAuthenticated() && request.auth.uid == userId;
    }

    match /case_queries/{queryId} {
      allow read, write: if isAuthenticated() && request.auth.uid == resource.data.userId;
      allow create: if isAuthenticated();
    }

    match /summaries/{collection}/{document} {
      allow read: if isDeciphexUser();
      allow write: if request.auth == null;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

### `firestore.indexes.json`

```json
{
  "indexes": [
    {
      "collectionGroup": "billing_records",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "issueDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "billing_records",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "instituteName", "order": "ASCENDING" },
        { "fieldPath": "issueDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "billing_records",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "totalPrice", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

---

## Deploy commands

```bash
# Deploy hosting only
firebase deploy --only hosting

# Deploy Firestore rules only
firebase deploy --only firestore:rules

# Deploy Firestore indexes only
firebase deploy --only firestore:indexes

# Deploy everything
firebase deploy
```

---

## Useful commands

```bash
firebase projects:list
firebase use --add
firebase hosting:channel:deploy preview --expires 7d
firebase deploy --only hosting:siteName
```

---

## Gotchas for this project

- Since `public` is `.`, the entire repo root is deployed (minus ignored patterns).
- All static files have `Cache-Control: no-cache` — browsers will always revalidate.
- Firestore read access requires `@deciphex.com` email; writes require service account (no user auth token).

---

## Common gotchas (general)

- Wrong public directory = deploys blank/old content.
- SPA routing needs the SPA rewrite enabled (or add rewrites in `firebase.json`).
- Make sure `index.html` exists in the public directory you configured.
