#!/bin/bash
# Копіює аплет з проекту в локальну папку Cinnamon. Нічого системного не чіпає.
set -e
SRC="$(cd "$(dirname "$0")/keyboard-color-indicator@flamingo" && pwd)"
DST="$HOME/.local/share/cinnamon/applets/keyboard-color-indicator@flamingo"
mkdir -p "$DST"
cp -v "$SRC/metadata.json" "$SRC/applet.js" "$SRC/stylesheet.css" "$SRC/settings-schema.json" "$DST/"
echo "OK -> $DST"
echo "Далі: ПКМ по панелі > Applets > додати Keyboard Color Indicator. За потреби: Alt+F2 -> r -> Enter"
