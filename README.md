# Keyboard Color Indicator

v.1.00.00.001 2026-09-25  

Яскравий аплет розкладки для Linux Mint Cinnamon 6.6 (X11 + Wayland-safe).
Замість маленького прапорця внизу — велика кольорова плашка на панелі:

- `EN` (US) — зелений фон `#27ae60`, білий текст
- `UA` — жовтий фон `#ffd700`, синій текст `#0057b7`
- клік ЛКМ — наступна розкладка
- тултіп з повною назвою розкладки

## Файли 

```
keyboard-color-indicator@flamingo/
  metadata.json        — опис аплету для Cinnamon
  applet.js            — логіка: InputSourceManager + кольоровий фон actor.set_style()
  stylesheet.css       — базові відступи
  settings-schema.json — налаштування: тексти, кольори, розмір шрифту
install.sh             — копіює аплет у ~/.local/share/... (запускаєте ви самі)
```

## Встановлення (виконуєте ви)

```bash
cd /home/igor/_prog/keyboard-color-indicator
./install.sh
```

Потім:
1. ПКМ по нижній панелі → `Applets`
2. Знайти `Keyboard Color Indicator` → додати на панель
3. Штатний `Keyboard` можна прибрати з панелі
4. ПКМ по новому аплету → `Configure` — там кольори/розмір/тексти

## Назад, якщо не сподобається

ПКМ по панелі → `Applets` → зняти `Keyboard Color Indicator`, повернути штатний `Keyboard`.

## Перевірено під

- Cinnamon 6.6.9, X11, розкладки `[('xkb','us'), ('xkb','ua')]`
- Використовує тільки `imports.ui.keyboardManager.getInputSourceManager()`, тому переживе перехід на Wayland (на відміну від gxkb/xxkb).
