# Subset Sum Explorer

A small static web app to explore subset sums.

Given an array `A` of positive integers and a threshold `M`, the app enumerates all **non-empty subsets** of `A` and shows the subsets whose sum is **greater than or equal to `M`**.

## Features

- Input array `A` as comma- or space-separated integers
- Input threshold `M`
- Compute and display matching subsets with:
  - subset values
  - subset sum
  - subset length
- Sort results by descending sum (with deterministic tie-breakers)
- Download displayed results as CSV

## Input limits

To keep the page responsive, this implementation limits `N` to `22` values.

Reason: the search is exhaustive (`2^N - 1` non-empty subsets), so runtime grows exponentially.

## Quick start (local)

From the repository root:

```bash
python3 -m http.server 4173
```

Then open:

- `http://localhost:4173`

Try the sample input:

- `A = 7,7,6,6,5,1,1,1,1`
- `M = 18`

Click **Go**, then optionally **Download CSV**.

## Deploy with GitHub Pages (Option A: root deployment)

This repo is already structured for root deployment (`index.html` at the repo root), so setup is simple:

1. Push this repo to GitHub.
2. Open the repository on GitHub.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, set:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` (or your default branch)
   - **Folder**: `/ (root)`
5. Save.

After deployment, your site URL will be:

- `https://<your-username>.github.io/<repo-name>/`

> Note: First deployment may take a minute or two.

## Release options

For this project, practical release approaches are:

1. **Pages-only rolling deploy** (simplest)
   - Keep deploying latest `main`.
2. **Pages + GitHub Releases**
   - Tag versions like `v0.1.0`, `v0.2.0`.
   - Add release notes for changes.
3. **Alternate static hosting** (Netlify/Vercel/Cloudflare Pages)
   - Useful for preview deploys and additional tooling.

## Files

- `index.html` — UI layout
- `styles.css` — styles
- `script.js` — validation, subset enumeration, sorting, rendering, CSV export
