OVERLOAD: workout log with a progression coach
================================================

What this is
  An installable phone app (a "progressive web app"). After you install it,
  it runs from your home screen, full screen, with no internet needed.
  All your data stays on your phone. The app makes no network requests
  (its security policy blocks them), and there are no accounts or servers.

Files (upload all 9 together, keep them in one folder)
  index.html, app.js, sw.js, manifest.webmanifest,
  icon-192.png, icon-512.png, icon-maskable-512.png,
  LICENSE-fonts.txt, README.txt

One-time setup (about 10 minutes, free)
  Phones only install apps like this from an https address, so the files
  need a home online once. GitHub Pages is free. It only serves the app's
  code; your workouts never go there.

  1. Make a free account at github.com.
  2. Tap "+" > New repository. Name it "overload", choose Public, create it.
  3. Tap "uploading an existing file", add all 9 files, then "Commit changes".
  4. Open the repository's Settings > Pages. Under "Build and deployment",
     choose "Deploy from a branch", pick "main" and "/ (root)", then Save.
  5. After a minute or two your app is at:
        https://Milchschnittli.github.io/app/
  6. Open that address in Chrome on your Pixel. Tap "Install app" in the
     app (or Chrome menu > Add to home screen > Install).
  7. From now on, open Overload from your home screen. It works offline.

Keeping your data safe
  - Settings > App lock: optional passcode. Your log is then encrypted on
    the phone (AES-256-GCM, key from PBKDF2-SHA256, 600,000 rounds).
    A forgotten passcode cannot be recovered.
  - Settings > Back up now: saves one file with everything. Keep a copy off
    the phone (Drive, email to yourself). With the lock on, backups are
    encrypted with your passcode. CSV exports are never encrypted.
  - Uninstalling the app or clearing Chrome's site data deletes the log.
    Restore from a backup file if that happens.

Bringing your Hevy history over
  In Hevy, export your workouts as CSV. In Overload, Settings >
  "Restore a backup or import Hevy CSV" and pick that file.

Updating the app later
  Upload the changed files to the same repository and change the VERSION
  line at the top of sw.js. The app then shows "Restart to update".
  Your data is not touched by updates.
