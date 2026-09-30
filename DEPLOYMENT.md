
# StudyFlow Deployment Guide

To host this project, you need to deploy three separate parts:
1.  **The Database** (MySQL) - Stores your users, topics, and progress.
2.  **The Backend** (Node.js/Express) - The API that your app talks to.
3.  **The App** (React Native) - The actual application installed on phones.

---

## Phase 1: Prepare Your Data (Database)

Since you are using MySQL (XAMPP/WAMP), you need to move your local data to the cloud.

### 1. Export Local Database
1.  Open **phpMyAdmin** (http://localhost/phpmyadmin).
2.  Select your database (`studyflow_db`).
3.  Click the **Export** tab.
4.  Click **Go** to download the `.sql` file (e.g., `studyflow_db.sql`).

### 2. Create Cloud Database
 we define **Aiven** or **Railway** (easiest for MySQL).
*Option A: Railway (Paid but easiest)*
1.  Go to [railway.app](https://railway.app).
2.  Create a project -> Add Database -> MySQL.
3.  Get the **Connection URL** (looks like `mysql://root:password@host:port/railway`).

*Option B: Aiven (Free Tier)*
1.  Go to [aiven.io](https://aiven.io).
2.  Create a free MySQL service.
3.  Get the **Host**, **Port**, **User**, and **Password**.

### 3. Import Data to Cloud
Use a tool like **MySQL Workbench** or **HeidiSQL** to connect to your new Cloud Database using the credentials above, then run your `.sql` file content to create the tables.

---

## Phase 2: Host the Backend

We will use **Render** (Free) or **Railway**.

1.  **Push Code to GitHub**:
    *   Make sure your project is in a GitHub repository.
    *   Ensure your `backend` folder is present.

2.  **Deploy on Render.com** (Free):
    *   Sign up at [render.com](https://render.com).
    *   Click **New +** -> **Web Service**.
    *   Connect your GitHub repo.
    *   **Root Directory**: `backend` (Important!).
    *   **Build Command**: `npm install`
    *   **Start Command**: `node server.js`
    *   **Environment Variables**: Add these in the Render dashboard:
        *   `DB_HOST`: (Your cloud DB host)
        *   `DB_USER`: (Your cloud DB user)
        *   `DB_PASS`: (Your cloud DB password)
        *   `DB_NAME`: (Your cloud DB name)
        *   `OPENAI_API_KEY`: (Your AI key)

3.  **Update `db.js`**:
    *   Your current `db.js` uses 'localhost'. You need to change it to use `process.env.DB_HOST`, etc., so it works in the cloud.

---

## Phase 3: Build the App (APK)

Now that your backend is online, you need to point your app to it and build the file.

1.  **Update API URL**:
    *   Open `constants/Api.ts`.
    *   Change `API_URL` from `http://192.168.x.x:5000` to your new Render URL (e.g., `https://studyflow-backend.onrender.com`).

2.  **Install EAS CLI** (if not installed):
    ```bash
    npm install -g eas-cli
    eas login
    ```

3.  **Configure Build**:
    ```bash
    eas build:configure
    ```
    (Select `Android` -> `apk` for a installable file).

4.  **Run Build**:
    ```bash
    eas build -p android --profile preview
    ```
    *   This will upload your code to Expo servers.
    *   Wait ~15 minutes.
    *   They will give you a link to download the `.apk` file.

5.  **Distribute**:
    *   Upload that `.apk` to Google Drive or a website to share with users.
