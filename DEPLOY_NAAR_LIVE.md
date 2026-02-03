# Code live krijgen via Git + Vercel

Volg deze stappen **in volgorde**. Werkt het niet, ga dan naar "Plan B".

---

## Plan A: Gewone push (als je lokaal al de juiste code hebt)

### Stap 1: Alles committen

```bash
cd ~/Documents/talktobenji
git add .
git status
git commit -m "Wijzigingen live"
```

### Stap 2: Pushen naar GitHub

```bash
git push origin main
```

**Als dit lukt:** klaar. Vercel deployt automatisch. Ga naar [github.com/IenVos/talktobenji](https://github.com/IenVos/talktobenji) en controleer of de nieuwste commit er staat. Wacht 1–2 minuten, ga naar talktobenji.vercel.app en doe een harde refresh (Cmd+Shift+R).

---

**Als `git push` faalt met "rejected" of "diverged":**

### Stap 3: Force push (overschrijft GitHub met jouw versie)

```bash
git push origin main --force-with-lease
```

`--force-with-lease` is veiliger dan `--force`: het faalt als iemand anders intussen heeft gepusht.

---

## Plan B: Sync-methode (als push blijft falen)

Gebruik dit als je steeds "rejected" of andere push-fouten krijgt.

### Stap 1: Backup + verse clone

```bash
cd ~/Documents
mv talktobenji talktobenji-backup
git clone https://github.com/IenVos/talktobenji.git talktobenji
cd talktobenji
```

### Stap 2: Jouw code terugzetten (zonder .git)

```bash
cd ~/Documents
rsync -av --exclude='.git' talktobenji-backup/ talktobenji/
```

### Stap 3: Committen en pushen

```bash
cd ~/Documents/talktobenji
git add .
git status
git commit -m "Alle wijzigingen live"
git push origin main
```

### Stap 4: Controleren

1. Ga naar [github.com/IenVos/talktobenji](https://github.com/IenVos/talktobenji)
2. Controleer of de nieuwste commit (met jouw message) bovenaan staat
3. Wacht 1–2 minuten
4. Ga naar https://talktobenji.vercel.app
5. Harde refresh: **Cmd+Shift+R** (Mac) of **Ctrl+Shift+R** (Windows)

---

## GitHub wachtwoord / token

Als GitHub om een wachtwoord vraagt: gebruik een **Personal Access Token**, niet je normale wachtwoord.

1. GitHub → je profielfoto → **Settings**
2. **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. **Generate new token** → geef een naam, vink **repo** aan
4. Kopieer de token en plak die als wachtwoord in de terminal

---

## Checklist als het nog niet werkt

- [ ] Staat de nieuwste commit op github.com/IenVos/talktobenji op de `main` branch?
- [ ] In Vercel → Deployments: is de nieuwste deployment "Ready" en "Production"?
- [ ] Heb je een harde refresh gedaan (Cmd+Shift+R) of incognito gebruikt?
- [ ] Staan in Vercel → Project Settings → Environment Variables o.a. `NEXT_PUBLIC_CONVEX_URL`?
