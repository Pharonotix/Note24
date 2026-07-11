# Note24 Master Development Roadmap

Version: Master Long-Term Roadmap

---

# Progress

Shipped versions (see `CHANGELOG.md` for details):

- ✅ **v0.1.0** — Initial release (notes, folders, equations library, Desmos, drawing, attachments, wiki-links).
- ✅ **v0.2.0** — Confirm-to-delete, sidebar note rename, annotate-tool removal, in-note equation metadata, Lucide folder icons, native spellcheck, calculator block (math.js + nerdamer).
- ✅ **v0.3.0** — Equation Knowledge System (foundation): metadata collapse/expand, LaTeX-rendered variables, stable equation slugs, equation relationships, "Used In" references, and derivation chains.
- ✅ **v0.4.0** — Calculator & CAS: engineering constants (g, G, c, h, R, k, μ₀, ε₀), variable inspector, unit consistency checker, and a rearrangement wizard (solve any equation for a variable).
- ⏭️ **Next: v0.5.0** — Graphing & Data Analysis (table block, table→graph, CSV import, calculator→graph). Deferred items to fold in later: the visual equation dependency **graph** (from v0.3.0) and equation→calculator integration (from v0.4.0).

---

# Project Vision

Note24 is intended to become a complete STEM-focused academic workspace.

The objective is not to become a generic note-taking application.

The objective is to provide a single environment where students, engineers, researchers, educators, and technical professionals can perform the majority of their work without constantly switching between applications.

The long-term goal is to combine the most useful capabilities of:

- Apple Notes
- OneNote
- Obsidian
- Desmos
- Draw.io
- Zotero
- Anki
- Wolfram Notebook
- PDF Readers
- Engineering Reference Tools

while remaining:

- Local-first
- Offline capable
- Fast
- Cross-platform
- User-owned
- Single Application
- STEM-focused

---

# Development Rules

These rules apply to all future development.

---

## Rule 1: Ask Questions First

If any behavior, workflow, implementation detail, architecture decision, database change, or user experience is unclear:

ASK QUESTIONS.

Do not:

- Guess
- Assume
- Infer missing requirements

Clarification should continue until expected behavior is fully understood.

---

## Rule 2: Present A Proposal Before Coding

Before implementing any feature:

Present:

### Proposed Feature

What is being added.

### Expected User Experience

How the user will interact with it.

### Technical Impact

What systems may be changed.

### Risks

Possible compatibility concerns.

### Verification Plan

How success will be tested.

Then wait for approval before implementation.

---

## Rule 3: Require Approval Per Feature

Approval is required:

✅ Before every feature

✅ Before every major phase

Not:

❌ Before every line of code

❌ Before small internal refactors

---

## Rule 4: Existing Data Is Sacred

Never destroy user data.

The following must always survive upgrades:

- Notes
- Drawings
- Equations
- Attachments
- PDFs
- Backups
- Templates
- Settings
- Storage Locations
- Research Libraries
- Calculator Blocks

---

## Rule 5: Backward Compatibility First

Old data should continue working whenever possible.

Use:

- Fallbacks
- Compatibility layers
- Migrations

Avoid:

- Forced recreation
- Manual conversion
- Destructive updates

---

## Rule 6: Verify Every Phase

After each phase:

```bash
npm run typecheck
npm run build
```

Then perform real workflow testing.

Compilation success is not verification.

---

## Rule 7: Test Real Workflows

Testing should mimic actual usage.

Example:

1. Create note
2. Edit note
3. Save note
4. Restart app
5. Reopen note
6. Verify persistence

---

## Rule 8: Minimize Dependencies

Before adding new packages:

Ask:

- Is it maintained?
- Is it lightweight?
- Is it actively used?
- Can an existing dependency already do it?
- Can it be lazy-loaded?

---

## Rule 9: Performance Matters

Heavy systems should load only when needed.

Examples:

- PDF Viewer
- Calculator Engine
- Flowchart Editor
- Circuit Workspace
- OCR
- Excalidraw

should not significantly impact startup time.

---

## Rule 10: Keep The Workspace Unified

All systems belong inside Note24.

Features should share:

- Search
- Storage
- Backups
- Settings
- Attachments
- Navigation

The value of Note24 comes from all systems working together.

---

## Rule 11: Equations Are First-Class Objects

Equations are not text.

Equations should eventually support:

- LaTeX
- Variables
- Metadata
- Categories
- References
- Relationships
- Calculator Integration
- Graph Integration
- Study Integration

Future systems should treat equations as data.

---

## Rule 12: STEM First

Whenever multiple implementation approaches exist:

Prefer the approach that best supports:

- Engineering
- Physics
- Mathematics
- Chemistry
- Biology
- Research
- Education

---

## Rule 13: Build Platforms, Not Features

Favor reusable systems.

Examples:

Instead of:

- Flashcard Generator
- Formula Sheet Generator
- Study Guide Generator

Build:

- Equation Knowledge System

Instead of:

- Image Attachments
- Video Attachments
- PDF Attachments

Build:

- Attachment System

Instead of:

- Flowcharts
- Mind Maps
- Dependency Maps

Build:

- Node Graph Framework

---

# Phase 1 — Equation Knowledge System

## Goal

Transform equations into intelligent knowledge objects.

---

## Features

### Equation Metadata Toggle

```text
☑ Show Metadata
```

Collapsed:

```text
E = mc²
```

Expanded:

```text
E = mc²

Energy-Mass Equivalence

Variables:
E = Energy
m = Mass
c = Speed of Light
```

---

### Edit Equation Metadata

Users can edit:

- Name
- Category
- Description
- Variables
- LaTeX

at any time.

---

### LaTeX-Aware Variables

Examples:

```latex
\omega
\theta
\Delta x
v_0
F_g
```

Render correctly.

---

### Equation References

Example:

```text
Used In:

Kinematics
Projectile Motion
Momentum
```

---

### Equation Relationships

```text
Newton's Laws
↓
Momentum
↓
Energy
```

---

### Equation Dependency Maps

Visual graph of connected formulas.

---

### Formula Derivation Mode

Store and display derivation chains.

Example:

```text
p = mv

F = dp/dt

F = ma
```

---

### Equation Knowledge Graph

Foundation for:

- Flashcards
- Formula Sheets
- Study Mode
- Recommendations
- Solver Wizards

---

# Phase 2 — Calculator & CAS Workspace

## Goal

Provide a complete engineering calculator.

---

## Calculator Block

Dedicated note block.

---

## Math.js

Supports:

- Arithmetic
- Variables
- Units
- Simplify
- Derivatives

---

## Nerdamer

Supports:

```text
solve(...)
integrate(...)
```

---

## Variable Scope Per Block

Variables remain isolated.

Example:

```text
x = 5

y = x + 3
```

---

## Variable Inspector

Example:

```text
m = 5kg
a = 9.81m/s²
F = 49.05N
```

---

## Unit-Aware Calculations

Automatic unit handling.

---

## Unit Consistency Checker

Detect bad dimensions.

Example:

```text
Acceleration = 5m
```

Warning:

```text
Expected m/s²
```

---

## Engineering Constants Library

Built-in constants:

```text
g
G
c
h
R
k
μ₀
ε₀
```

---

## Equation → Calculator Integration

Send formulas directly into solver workflows.

---

## Symbolic Rearrangement Wizard

Example:

```text
PV = nRT
```

Solve directly for:

```text
V
P
n
T
```

---

## Problem Solver Workspace

Structure:

```text
Knowns
Unknowns
Equations
Solution
```

---

# Phase 3 — Graphing & Data Analysis

## Desmos Integration

Interactive graphing.

---

## Calculator ↔ Graph Integration

Plot directly from calculations.

---

## Data Tables

Spreadsheet-style tables.

---

## Automatic Graph Creation

Generate graphs from:

- Tables
- CSV files
- Experiments

---

## Data Import

Support:

- CSV
- TSV
- Experimental Data

---

# Phase 4 — Attachments & Documents

## Unified Attachment System

Supports:

- PDFs
- Images
- Videos
- Audio
- DOCX
- ZIP
- CAD Files

---

## File Manager

Features:

- Rename
- Move
- Organize
- Delete
- Preview
- Search

---

## Embedded PDF Viewer

Features:

- Search
- Zoom
- Bookmarks
- Thumbnails

---

## Media Viewers

### Images

Preview directly.

### Videos

Embedded player.

### Audio

Embedded playback.

---

## PDF Export

Export:

- Notes
- Folders
- Vaults

---

## Print Support

High quality academic print layouts.

---

## PDF24 Launcher

Quick access to:

- Merge
- Compress
- Split
- OCR

---

# Phase 5 — Templates & Academic Workflows

## Problem Set Template

```text
Question
Equation
Graph
Solution
Answer
```

---

## Lab Report Template

```text
Objective
Procedure
Data
Calculations
Conclusion
```

---

## Research Template

```text
Summary
Sources
Questions
Insights
```

---

## Lecture Template

```text
Topics
Examples
Formulas
Practice Problems
```

---

## User Templates

Convert any note into a reusable template.

---

# Phase 6 — Citation & Research Management

## Citation Manager

Store:

- Books
- Papers
- Websites
- Videos
- DOIs

---

## Citation Formats

Support:

- APA
- MLA
- Chicago
- IEEE

---

## Research Library

Attach PDFs to source entries.

---

## Source Relationships

Track which notes reference which sources.

---

## Research Dashboard

Track:

- Sources
- Papers
- Citations
- Usage

---

# Phase 7 — Study System

## Flashcards

Generate from:

- Notes
- Equations
- Definitions

---

## Formula Sheet Generator

Generate study sheets.

---

## Infinite Formula Sheet

Automatically gathers all known formulas.

---

## Study Mode

Generate:

- Flashcards
- Practice Sets
- Reviews

---

## Spaced Repetition

Review intervals:

```text
1 Day
3 Days
1 Week
2 Weeks
1 Month
```

---

# Phase 8 — Flowcharts & Whiteboards

## Flowcharts

Powered by React Flow.

---

## Mind Maps

Interactive concept mapping.

---

## Equation Flow Diagrams

Connect formulas and variables visually.

---

## Infinite Whiteboard

Allow:

- Notes
- Equations
- PDFs
- Drawings
- Graphs

on a single canvas.

---

# Phase 9 — Circuit Design

## Circuit Workspace

Integrated engineering workspace.

---

## Components

- Resistors
- Capacitors
- Inductors
- ICs
- Sources
- Ground

---

## Export

- PNG
- SVG
- PDF

Future:

- KiCad Export

---

# Phase 10 — User Experience

## Fonts

- Inter
- Roboto
- Merriweather
- JetBrains Mono
- Caveat

---

## Font Size Controls

80%–200%

---

## Reading Mode

Minimal interface.

---

## Focus Mode

Hide distractions.

---

## Spellcheck

Native spell checking.

---

## Custom Keyboard Shortcuts

User configurable.

---

## Workspace Themes

Allow full application themes.

Future:

- Dark
- Light
- Blueprint
- Engineering Paper
- Notebook

---

# Phase 11 — Organization & Productivity

## Pinned Notes

Dedicated pinned section.

---

## Recent Notes

Automatic history tracking.

---

## Global Search

Search:

- Notes
- Equations
- PDFs
- Attachments
- Calculator Blocks
- Citations

---

## Workspace Tabs

Open multiple resources simultaneously.

---

## Layout Presets

Examples:

```text
Study
Homework
Research
Lab
```

---

## Dashboard

Application overview.

---

# Phase 12 — Reliability & Data Protection

## Vault Backup

One-click backups.

---

## Restore

Restore backups.

---

## Version History

Per-note version recovery.

---

## Workspace Snapshots

Save and restore entire sessions.

---

# Phase 13 — Laboratory Workspace

## Lab Notebook

Structured experiment tracking.

---

## Experiment Mode

Track:

- Time
- Date
- Conditions
- Results

---

## Measurements

Store:

- Data
- Photos
- Videos
- Calculations

inside experiments.

---

## Data Collection Tables

Experimental datasets.

---

# Phase 14 — OCR & Media Intelligence

## OCR

Extract:

- Text
- Equations
- Tables

from images.

---

## Lecture Recordings

Attach lecture recordings.

Create timestamp references.

Example:

```text
[12:45]
```

Jump to recording location.

---

# Phase 15 — Distribution & Release Management

## Goal

Provide reliable long-term distribution of Note24 while maintaining a completely offline-first philosophy.

Users should always control:

- When they update
- What version they install
- Whether they update at all

No feature should require internet access after installation.

---

## Core Philosophy

Updates should be:

```text
Available
```

not

```text
Mandatory
```

A user should be able to install a version of Note24 and continue using it for years without being forced to upgrade.

---

## Versioned Releases

Every release is treated as a complete standalone version.

Examples:

```text
Note24 0.5.0
Note24 0.6.0
Note24 0.7.0
Note24 1.0.0
Note24 1.1.0
```

Users can intentionally download and install whichever version they want.

---

## Release Archive

Maintain a permanent archive of all public releases.

Example:

```text
Available Versions

0.5.0
0.6.0
0.7.0
1.0.0
1.1.0
```

Previous versions should never be removed solely because a new version exists.

---

## No Forced Updates

Note24 should never:

❌ Force installation of updates

❌ Automatically install updates

❌ Require updates to continue using the application

❌ Require internet access to function

The currently installed version should remain fully functional indefinitely.

---

## Optional Update Checking

Inside Settings:

```text
Check For Updates
```

This feature should:

- Compare installed version against latest release
- Inform the user when newer versions exist

This feature should NOT:

- Automatically download updates
- Automatically install updates

Example:

```text
Installed Version

1.2.0

Latest Available

1.4.0
```

---

## Release Page Shortcut

If a newer version exists:

```text
View Releases
```

opens the release archive.

Users decide:

- Whether to update
- Which version to install

---

## Side-by-Side Installation Support

Whenever practical, Note24 should support:

```text
Note24 1.0
Note24 1.1
Note24 1.2
```

existing on the same machine.

Applicable use cases:

- Testing
- Rollbacks
- Development
- Validation

---

## Portable Versions

Every release should generate:

### Installer Build

```text
Note24-1.0.0-Setup.exe
```

---

### Portable Build

```text
Note24-1.0.0-Portable.exe
```

Portable builds should:

- Require no installation
- Run from USB drives
- Run from external drives
- Run without administrator permissions

---

## First-Time Setup Wizard

New installations should include a setup wizard.

Potential configuration:

### Vault Location

Choose storage location.

---

### Theme

Choose:

```text
Dark
Light
System
```

---

### Backup Preferences

Configure:

```text
Automatic Backups
Manual Backups
```

---

### Create Vault

Optionally create initial vault structure.

---

## Vault Versioning

Every release should declare:

```text
Vault Version
```

Example:

```text
Application Version

1.2.0

Vault Version

3
```

This allows controlled migrations when internal structures change.

---

## Automatic Backups Before Vault Migrations

Before any vault migration:

Automatically create:

```text
backup-before-migration.zip
```

This backup should contain everything required to restore the vault.

No migration should occur without a recovery point.

---

## Migration History

Users should be able to view:

```text
Vault Migration History
```

Example:

```text
Vault Upgraded

Version 2 → Version 3

Date

2027-04-01
```

---

## Release Notes Viewer

Inside Note24:

```text
What's New
```

displays:

```text
Added
Changed
Fixed
Known Issues
```

for installed versions.

---

## Long-Term Support Releases

Future major versions may have:

```text
LTS
```

releases.

Example:

```text
Note24 2.0 LTS
```

These releases prioritize:

- Stability
- Bug fixes
- Reliability

over rapid feature additions.

---

## Backup-Aware Upgrades

Before installing a newer version:

Prompt:

```text
Create Safety Backup?
```

Recommended default:

```text
Yes
```

---

## Downgrade Support

Users should be able to return to an older version whenever practical.

Example:

```text
Installed

1.4.0

Revert To

1.3.0
```

provided the vault format remains compatible.

---

## Offline-First Distribution

After installation:

Everything should remain usable without:

- Internet access
- Cloud accounts
- Online activation
- Online authentication
- Subscription verification

The application should remain fully functional offline indefinitely.

---

### Theme Packs

Custom visual themes.

---

## Distribution Philosophy

The distribution model should resemble professional engineering and academic software.

Users should be able to:

✅ Download specific versions

✅ Keep older versions

✅ Update when they choose

✅ Work completely offline

✅ Maintain ownership of their data

✅ Roll back when needed

The application should remain functional regardless of future releases, internet availability, or external services.

---
## Release Distribution

The primary distribution method should be GitHub.

Users can download Note24 directly from:

GitHub Releases

Every version should remain available.

Example:

Releases

- Note24 0.5.0
- Note24 0.6.0
- Note24 0.7.0
- Note24 1.0.0

Older versions should not be removed simply because a newer version exists.

---

## README Download Section

The project's README should contain a clearly visible Downloads section.

Example:

# Downloads

Latest Stable Release

Version 1.2.0

- Download Installer
- Download Portable

Previous Releases

- Version 1.1.0
- Version 1.0.0
- Version 0.9.0

Full Release Archive

See GitHub Releases

---

## Version History

The README should include a version history section.

Example:

# Version History

## 1.2.0

Added

- Calculator Improvements
- New Flowchart Tools

Fixed

- Equation Rendering Bugs

Changed

- Improved PDF Export

---

## 1.1.0

Added

- Citation Manager

Fixed

- Storage Location Issues

---

## 1.0.0

Initial Stable Release

---

## In-App Version Information

Settings → About

Display:

Installed Version

1.2.0

Vault Version

3

Build Date

2028-04-12

---

## Optional Update Check

Users may manually select:

Check For Updates

The application simply compares:

Installed Version
Latest GitHub Release

and informs the user.

No automatic download.

No automatic installation.

No forced updates.
---

# Final Vision

The completed Note24 ecosystem should function as:

```text
Notes
+
Equation Knowledge System
+
Calculator
+
CAS
+
Graphs
+
PDF Viewer
+
Attachment Manager
+
Citation Manager
+
Research Workspace
+
Study System
+
Flashcards
+
Flowcharts
+
Infinite Whiteboards
+
Circuit Design
+
Laboratory Workspace
+
Project Management
+
Backup System
+
Distribution Platform
```

inside a single local-first application optimized for STEM education, engineering, research, and technical work.

# Note24 Development Roadmap
## Optimized For Claude Code (Opus 4.x)

This roadmap is intentionally organized so that a single **0.x release can realistically be completed in one Claude Code session**.

The goal is:

- Finish one version
- Test it
- Build it
- Ship it
- Move on

rather than having a single version contain dozens of unrelated systems.

---

# Vision

Note24 is a STEM-focused academic workspace designed for:

- Students
- Engineers
- Researchers
- Educators
- Technical Professionals

The final application should feel like:

```text
Apple Notes
+
OneNote
+
Obsidian
+
Desmos
+
Zotero
+
Anki
+
Draw.io
+
Engineering Notebook
```

inside a single local-first application.

---

# Development Rules

## Ask Questions First

If behavior is unclear:

- Ask questions
- Do not guess
- Do not assume

---

## Present Proposal Before Coding

Before implementing:

- Proposed Feature
- User Experience
- Technical Impact
- Risks
- Verification Plan

Wait for approval.

---

## Protect Existing Data

Never destroy:

- Notes
- Equations
- Drawings
- Attachments
- Backups
- Settings
- Templates
- Vaults

---

## Verify Every Release

Run:

```bash
npm run typecheck
npm run build
```

and perform real workflow testing.

---

## Build Platforms Not Features

Create reusable systems whenever possible.

Examples:

```text
Attachment System
```

instead of:

```text
Image Attachments
Video Attachments
PDF Attachments
```

---

# v0.3.0 — Equation Knowledge System

## Goal

Turn equations into first-class objects.

### Features

- Equation metadata collapse/expand
- Edit metadata after insertion
- LaTeX-aware variables
- Equation references
- Equation relationships
- Equation dependency graph
- Derivation mode
- Foundation for equation knowledge graph

### Verification

- Insert equation
- Edit metadata
- Save
- Reload
- Verify persistence

---

# v0.4.0 — Calculator & CAS

## Goal

Provide an engineering-focused calculator.

### Features

- Calculator block
- Math.js integration
- Nerdamer integration
- Variable scope per block
- Variable inspector
- Engineering constants
- Unit-aware calculations
- Unit consistency checker

### Verification

```text
10 m / 2 s
```

returns:

```text
5 m/s
```

```text
solve(x^2 - 4, x)
```

returns roots.

---

# v0.5.0 — Graphing & Data Analysis

## Features

- Desmos integration improvements
- Calculator → Graph button
- Table block
- Table → Graph conversion
- CSV Import
- Experimental data import

### Verification

Create graph directly from table data.

---

# v0.6.0 — Attachments System

## Goal

Create a unified file system.

### Features

- File manager panel
- Folder attachments
- Note attachments
- Move/rename/delete files
- Search files
- Drag-and-drop files

### Supported Types

- PDFs
- Images
- Audio
- Video
- ZIP
- DOCX

### Verification

Attach files and reopen vault.

---

# v0.7.0 — PDF Workspace

## Features

- Embedded PDF viewer
- Search PDFs
- PDF bookmarks
- PDF thumbnails
- PDF export
- Print support
- PDF24 launcher

### Verification

Open textbook PDF and export notes to PDF.

---

# v0.8.0 — Templates

## Features

### Built-In

- Problem Set
- Lab Report
- Research Notes
- Lecture Notes

### User Templates

Save any note as a reusable template.

---

# v0.9.0 — Citation Manager

## Features

- Books
- Papers
- Websites
- Videos
- DOIs

### Formats

- APA
- MLA
- Chicago
- IEEE

### Verification

Attach PDF to citation and reference in note.

---

# v0.10.0 — Study System

## Features

- Flashcards
- Formula sheets
- Infinite formula sheet
- Study mode
- Spaced repetition

### Verification

Generate flashcards from equations.

---

# v0.11.0 — Flowcharts

## Features

Using:

```text
React Flow
```

### Tools

- Flowcharts
- Mind maps
- Dependency maps

### Verification

Create and save graph.

---

# v0.12.0 — Infinite Whiteboard

## Features

Add:

- Notes
- Equations
- PDFs
- Drawings
- Graphs

to a shared infinite workspace.

### Verification

Save and reopen workspace.

---

# v0.13.0 — Circuit Design

## Libraries

Preferred:

```text
tsCircuit
```

Alternative:

```text
CircuitGrid
```

### Features

- Components
- Wiring
- Export PNG
- Export SVG
- Export PDF

---

# v0.14.0 — User Experience

## Features

### Fonts

- Inter
- Roboto
- Merriweather
- JetBrains Mono
- Caveat

### Font Size

80–200%

### Modes

- Reading Mode
- Focus Mode

### Extras

- Spellcheck
- Custom shortcuts
- Themes

---

# v0.15.0 — Productivity Workspace

## Features

- Pinned notes
- Recent notes
- Workspace tabs
- Layout presets
- Dashboard

### Search

Search:

- Notes
- PDFs
- Equations
- Calculator blocks
- Citations
- Attachments

---

# v0.16.0 — Data Protection

## Features

- Vault backup
- Restore
- Workspace snapshots
- Note version history

### Verification

Restore previous note state.

---

# v0.17.0 — Laboratory Workspace

## Features

- Lab notebook
- Experiment mode
- Measurement storage
- Experiment templates
- Data collection tables

### Verification

Create and save experiment.

---

# v0.18.0 — OCR & Media Intelligence

## Features

### OCR

Detect:

- Text
- Equations
- Tables

from images.

### Media

- Lecture recordings
- Timestamp references

Example:

```text
[12:45]
```

jumps to recording position.

---

# v0.19.0 — Distribution & Release Management

## Goal

Make downloading and maintaining Note24 easy while remaining fully offline-first.

---

## GitHub Distribution

Use:

```text
GitHub Releases
```

as the primary distribution system.

---

## README Downloads Section

README should contain:

```text
Latest Stable Version

Download Installer
Download Portable

Previous Releases

0.18.0
0.17.0
0.16.0
...
```

---

## Release Archive

Keep every release available.

Examples:

```text
0.10.0
0.11.0
0.12.0
...
1.0.0
```

No removal of older versions.

---

## Portable Builds

Each release generates:

```text
Note24-x.x.x-Setup.exe
```

and

```text
Note24-x.x.x-Portable.exe
```

---

## No Forced Updates

Never:

- Auto-install updates
- Force upgrades
- Require internet access

---

## Optional Update Check

Settings:

```text
Check For Updates
```

Only compares:

```text
Installed Version
Latest Release
```

and notifies user.

---

## Vault Versioning

Track:

```text
Application Version
Vault Version
```

separately.

---

## Automatic Backup Before Migration

Before any vault upgrade:

```text
backup-before-migration.zip
```

must be created automatically.

---

## Release Notes Viewer

Display:

```text
Added
Changed
Fixed
Known Issues
```

for installed versions.

---

## Version History In README

Example:

### Version 0.18.0

Added:

- OCR
- Lecture Recordings

Fixed:

- PDF Search Bug

Changed:

- Faster Graph Rendering

---

# v0.20.0 — Community Ecosystem

## Future Downloads

### Template Packs

```text
Lecture Templates
Lab Templates
Research Templates
```

### Formula Packs

```text
Physics
Chemistry
Mathematics
```

### Study Packs

```text
Practice Sets
Flashcards
Formula Sheets
```

### Theme Packs

Custom themes.

---

# Version 1.0.0

By v1.0.0 Note24 should function as:

```text
Notes
+
Equation Knowledge System
+
Calculator
+
CAS
+
Graphs
+
Tables
+
Attachments
+
PDF Workspace
+
Citation Manager
+
Study System
+
Flashcards
+
Flowcharts
+
Infinite Whiteboard
+
Circuit Design
+
Laboratory Workspace
+
OCR
+
Backup & Restore
+
Versioned Releases
```

inside a single local-first academic ecosystem optimized specifically for STEM education, engineering, and research.