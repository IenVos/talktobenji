#!/bin/bash
# Script om alle bestanden van GitHub te synchroniseren met lokale versie
# Gebruik: ./sync-from-github.sh

REPO_URL="https://raw.githubusercontent.com/IenVos/talktobenji/main"

echo "🔄 Synchroniseren van alle bestanden van GitHub..."
echo ""

# Belangrijke configuratie bestanden
echo "📁 Configuratie bestanden..."
files=(
  "tailwind.config.js"
  "next.config.js"
  "package.json"
  "tsconfig.json"
  "postcss.config.js"
)

for file in "${files[@]}"; do
  echo "  ✓ $file"
  curl -s "$REPO_URL/$file" -o "$file" 2>/dev/null || echo "    ⚠️  Kon $file niet ophalen"
done

# App bestanden
echo ""
echo "📱 App bestanden..."
app_files=(
  "app/page.tsx"
  "app/layout.tsx"
  "app/manifest.ts"
  "app/ChatPageClient.tsx"
)

for file in "${app_files[@]}"; do
  echo "  ✓ $file"
  curl -s "$REPO_URL/$file" -o "$file" 2>/dev/null || echo "    ⚠️  Kon $file niet ophalen"
done

# Component bestanden
echo ""
echo "🧩 Component bestanden..."
component_files=(
  "components/chat/WelcomeScreen.tsx"
  "components/chat/TopicButtons.tsx"
  "components/chat/GlobalMenu.tsx"
  "components/chat/AboutBenjiModal.tsx"
  "components/chat/ProfessionalHelpModal.tsx"
)

for file in "${component_files[@]}"; do
  echo "  ✓ $file"
  curl -s "$REPO_URL/$file" -o "$file" 2>/dev/null || echo "    ⚠️  Kon $file niet ophalen"
done

# Lib bestanden
echo ""
echo "📚 Lib bestanden..."
lib_files=(
  "lib/AboutModalContext.tsx"
  "lib/ProfessionalHelpContext.tsx"
)

for file in "${lib_files[@]}"; do
  echo "  ✓ $file"
  curl -s "$REPO_URL/$file" -o "$file" 2>/dev/null || echo "    ⚠️  Kon $file niet ophalen"
done

echo ""
echo "✅ Synchronisatie voltooid!"
echo ""
echo "💡 Tip: Herstart de development server met: npm run dev"
