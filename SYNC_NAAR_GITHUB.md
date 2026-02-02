# Wijzigingen naar GitHub krijgen – snelle methode

Als `git push` steeds faalt, gebruik dan deze methode:

## Stap 1: Nieuwe map maken

Op je MacBook, in Terminal:

```bash
cd ~/Documents
mv talktobenji talktobenji-backup
git clone https://github.com/IenVos/talktobenji.git talktobenji
cd talktobenji
```

Nu heb je een verse kopie van GitHub (commit 1517a9f).

## Stap 2: Jouw wijzigingen terugzetten

Kopieer alles van je backup naar de nieuwe map, **behalve** de `.git` map:

```bash
cd ~/Documents
rsync -av --exclude='.git' talktobenji-backup/ talktobenji/
```

Of handmatig: kopieer alle mappen en bestanden van `talktobenji-backup` naar `talktobenji`, maar **niet** de verborgen map `.git`.

## Stap 3: Committen en pushen

```bash
cd ~/Documents/talktobenji
git add .
git status
git commit -m "Alle wijzigingen van 1 februari"
git push origin main
```

Als je om een wachtwoord wordt gevraagd: gebruik een **Personal Access Token** (niet je gewone wachtwoord). Maak die aan op: GitHub → Settings → Developer settings → Personal access tokens.

## Stap 4: Oude map verwijderen (later)

Als alles goed werkt:

```bash
rm -rf ~/Documents/talktobenji-backup
```

En hernoem eventueel: `mv talktobenji talktobenji-werk` als je de oude naam wilt behouden.
