# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

---

## Class-specific routing

Links are now separated per class so that each cohort has its own URL and students cannot easily access other classes' pages. You can directly share the link for a class and visitors will see the Amaliyah Ramadhan landing page for that class. **On first visit the app assumes the user is a student, sets the role automatically and immediately redirects to the student list (so they see names right away).** Teachers or kesiswaan users still have separate dashboard links; they can simply visit `/classes/:classId/dashboard` directly. If no role is set the app will prompt for PIN and then grant access. (Students will be treated as students automatically when opening the base class link.)

The routing structure is:

```
/                     - home role selection
/classes              - choose a class (list view)
/classes/:classId      - class landing page (app name, role buttons); auto-redirects based on role
/classes/:classId/students  - student selection for that class (student role)
/classes/:classId/form      - report form (student role)
/classes/:classId/dashboard - teacher/admin dashboard (teacher or kesiswaan role)
```

Unauthorized combinations (e.g. student visiting `/dashboard`) automatically redirect back to `/classes`.

## Vercel Postgres Sync (Lintas Browser/Device)

Aplikasi sekarang sinkronisasi data lintas browser/device lewat `Vercel Postgres` menggunakan endpoint `api/state.ts`.

### 1) Tambahkan Vercel Postgres ke project

Di dashboard Vercel:

- `Storage` -> `Create Database` -> pilih `Postgres`
- Attach ke project ini

Vercel akan otomatis menyetel env Postgres di production.

### 2) Untuk local development (opsional)

Copy `.env.example` menjadi `.env` dan isi env Postgres jika ingin test API secara lokal.

### 3) Deploy ulang

Redeploy project di Vercel. Setelah deploy, data akan tersimpan di database dan sama di browser/device lain.

Jika endpoint database tidak tersedia, aplikasi tetap fallback ke localStorage agar tetap bisa dipakai.

## OpenAI Assistant

Menu `/ai` sekarang memakai OpenAI melalui endpoint `api/ai`.

Wajib set environment variable di Vercel:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (opsional, default `gpt-4.1-mini`)

Endpoint AI dapat:

- cari siswa lintas kelas
- tampilkan siswa per kelas
- tampilkan data harian siswa
- tambah/hapus/ganti nama siswa melalui prompt
