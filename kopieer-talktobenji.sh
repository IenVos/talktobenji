#!/bin/bash
# Kopieer talktobenji van iCloud naar Documents (omzeilt Finder-fout -8062)
# Dubbelklik niet; open Terminal en voer uit: bash ~/Documents/talktobenji/kopieer-talktobenji.sh

SOURCE="$HOME/Library/Mobile Documents/com~apple~CloudDocs/vibe-chatbot/talktobenji"
DEST="$HOME/Documents/talktobenji"

if [ ! -d "$SOURCE" ]; then
  echo "FOUT: Bronmap niet gevonden: $SOURCE"
  echo "Controleer of iCloud Drive is ingeschakeld en vibe-chatbot/talktobenji bestaat."
  exit 1
fi

echo "Kopiëren van: $SOURCE"
echo "Naar:         $DEST"
echo ""

mkdir -p "$DEST"
rsync -a --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.env.local' \
  --exclude '.next' \
  "$SOURCE/" "$DEST/"

echo ""
echo "Klaar. Bestanden in $DEST:"
ls -la "$DEST"
