# Push to New Repo (JARVIS ROG Ed.)

Your Windows/ROG Ed. work is **committed** on `main`. Push it to a new repo with one of these options.

---

## Option A: GitHub CLI (after login)

1. **Log in to GitHub CLI** (one-time):
   ```powershell
   gh auth login
   ```
   Follow the prompts (browser or token).

2. **Create the repo and push** from the JARVIS folder:
   ```powershell
   cd path\to\JARVIS
   gh repo create jarvis-rog-ed --public --description "JARVIS ROG Ed. - AI assistant for ASUS ROG Ally (Windows 11)" --source=. --remote=rog-ed --push
   ```

3. **Use the new repo from now on** (optional — make it your default remote):
   ```powershell
   git remote rename origin mac-origin
   git remote rename rog-ed origin
   git branch -u origin/main
   ```
   Then `git push` and `git pull` use the new Windows repo.

---

## Option B: Create repo in browser, then push

1. **Create a new repo on GitHub:**
   - Go to https://github.com/new
   - Name: `jarvis-rog-ed` (or any name you like)
   - Description: `JARVIS ROG Ed. - AI assistant for ASUS ROG Ally (Windows 11)`
   - Public, **do not** add README, .gitignore, or license (you already have them)
   - Create repository

2. **Add the new remote and push** (replace `YOUR_USERNAME` with your GitHub username):
   ```powershell
   cd path\to\JARVIS
   git remote add rog-ed https://github.com/YOUR_USERNAME/jarvis-rog-ed.git
   git push rog-ed main
   ```

3. **Use the new repo from now on** (optional):
   ```powershell
   git remote rename origin mac-origin
   git remote rename rog-ed origin
   git branch -u origin/main
   ```

---

## After pushing

- Repo URL will be: **https://github.com/YOUR_USERNAME/jarvis-rog-ed**
- For the public-facing README, either rename **README_ROG_ED.md** to **README.md** in the repo or set it as the repo description on GitHub.
- To clone and work only from the new repo later: `git clone https://github.com/YOUR_USERNAME/jarvis-rog-ed.git` then work in that folder.
