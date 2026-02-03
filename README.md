# OME-NGFF Tools Matrix (Svelte)

A simple Svelte rewrite of the OME-NGFF Tools Matrix frontend.

## Project Structure

```
svelte-app/
├── src/
│   ├── App.svelte    # The entire application in one file
│   └── main.js       # Entry point
├── public/
│   └── data/         # Data files (copied from root)
├── index.html
├── package.json
└── vite.config.js
```

## Installation

```bash
cd svelte-app
npm install
cp -r ../data/* public/data/
```

## Development

```bash
npm run dev
```

## Building

```bash
npm run build
```
