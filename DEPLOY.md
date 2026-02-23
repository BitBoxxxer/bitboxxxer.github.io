# 🚀 Быстрая инструкция по загрузке на GitHub

## Шаг 1: Создай репозиторий на GitHub

1. Зайди на https://github.com и авторизуйся
2. Нажми **+** → **New repository**
3. Имя репозитория: `bitboxxxer.github.io` (это важно!)
4. Выбери **Public**
5. НЕ ставь галочки на "Add a README file"
6. Нажми **Create repository**

## Шаг 2: Открой терминал в этой папке

В VS Code: Terminal → New Terminal

Или в проводнике: правый клик → "Открыть в терминале"

## Шаг 3: Выполни команды

Скопируй и вставь по очереди:

```bash
git init
```

```bash
git add .
```

```bash
git commit -m "Initial commit - DevGuides site"
```

```bash
git branch -M main
```

```bash
git remote add origin https://github.com/BitBoxxxer/bitboxxxer.github.io.git
```

```bash
git push -u origin main
```

## Шаг 4: Включи GitHub Pages

1. Открой https://github.com/BitBoxxxer/bitboxxxer.github.io
2. Settings → Pages (в левом меню)
3. Source → Branch: main → Save

## Шаг 5: Готово!

Подожди 1-2 минуты и открой:
**https://bitboxxxer.github.io**

---

## Если Git не установлен

Скачай с https://git-scm.com/download/win и установи.

---

## Обновление сайта

После изменений файлов:

```bash
git add .
git commit -m "Описание изменений"
git push
```
