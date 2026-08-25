# ⚡ J.A.R.V.I.S. — Personal AI Assistant Platform

Una piattaforma completa, moderna, elegante e futuristica di assistente AI personale stile **JARVIS**, alimentata da **Ollama**, con supporto multi-modello, **Model Context Protocol (MCP)**, sistema di **Skills modulari**, memoria persistente su 3 livelli, isolamento rigoroso dei contesti tra chat e progetti, e **modalità vocale continua in stile telefonico** con Orb olografico animato reattivo a voce e frequenze audio.

---

## 🌟 Caratteristiche Principali

- **UI Futuristica & Premium (3 Zone)**:
  - Layout a 3 colonne ispirato all'HUD tecnologico di JARVIS (vetro glassmorphism, accenti cyan/neon, dark void background `#060a12`).
  - **Animated Holographic Orb**: renderizzato su Canvas con particelle orbitali, anelli olografici ed emissione di frequenze audio reattiva in tempo reale a voce e stato (`IDLE`, `LISTENING`, `PROCESSING`, `SPEAKING`, `ERROR`).
- **Motore LLM Ollama Locale**:
  - Rilevamento dinamico dello stato (`● Online` / `● Offline`).
  - Dropdown con lista automatica dei modelli installati (`/api/tags`).
  - Streaming token-by-token a bassissima latenza.
  - Configurazione avanzata (Temperature, Top-P, Context Size, Keep-Alive).
- **Progetti & Chat con Context Isolation Rigoroso**:
  - Struttura gerarchica: Progetti contenenti infinite chat.
  - Rigoroso isolamento: ogni chat non vede né messaggi, né istruzioni, né tool state di altre conversazioni.
  - Cancellazione atomica a cascata: l'eliminazione di un progetto cancella atomicamente tutte le chat, i messaggi, le memorie e i log associati con modale di sicurezza.
- **Sistema di Memoria Persistente a 3 Livelli**:
  - `Global Memory`: preferenze utente valide ovunque.
  - `Project Memory`: fatti e regole architetturali del progetto.
  - `Chat Memory`: note e deduzioni specifiche della conversazione.
- **Client Ufficiale MCP (Model Context Protocol)**:
  - Supporto per server locali via `stdio` (comandi CLI come `@modelcontextprotocol/server-filesystem`) e remoti via `Streamable HTTP / SSE`.
  - Discovery dinamica dei tool (`tools/list`) ed esecuzione (`tools/call`).
- **Skills Modulari Autonome**:
  - `Web Research`: ricerca DuckDuckGo in tempo reale ed estrazione pagine web.
  - `Coding & Filesystem`: lettura, scrittura, modifica mirata, ricerca file ed esecuzione sicura di comandi terminale.
  - `GitHub Integration`: esplorazione repo, lettura file, gestione issues e creazione Pull Requests.
  - `Google Workspace`: Gmail, Google Calendar, Google Drive, Docs, Sheets, Tasks e YouTube.
  - `Data Analysis & Math`: calcolo matematico sicuro ed analisi dataset strutturati.
  - `Memory Manager`: capacità dell'AI di salvare o richiamare autonomamente informazioni chiave.
- **Sistema di Permessi di Sicurezza (3 Livelli)**:
  - `READ`: operazioni sicure eseguite automaticamente.
  - `WRITE`: modifiche a file o issue.
  - `DESTRUCTIVE`: cancellazioni o esecuzioni critiche (richiedono conferma interattiva nella chat `[Conferma] [Annulla]`).
- **Modalità Vocale Continua Stile Chiamata Telefonica**:
  - Apertura immediata cliccando l'Orb olografico.
  - VAD (Voice Activity Detection) e Web Audio API per conversazioni a ciclo continuo senza dover ripremere il microfono.
  - Trascrizione sottotitoli in tempo reale e timer chiamata (`00:42`).
  - Passaggio fluido tra chat testuale e voce senza perdere la cronologia.
- **Ricerca Globale Istantanea (Ctrl+K)**:
  - Ricerca istantanea tra progetti, chat e messaggi.

---

## 🏗️ Architettura del Progetto

```
Jarvis/
├── backend/
│   ├── main.py                  # FastAPI entry point, CORS & lifespan
│   ├── database/
│   │   ├── database.py          # SQLite WAL mode & aiosqlite engine
│   │   └── models.py            # SQLAlchemy 2.0 ORM models con cascading delete
│   ├── ai/
│   │   ├── ollama_client.py     # Client asincrono Ollama & health check
│   │   ├── prompt_builder.py    # Context isolation & gerarchia prompt
│   │   └── orchestrator.py      # Multi-turn tool calling loop & streaming SSE
│   ├── skills/
│   │   ├── registry.py          # Registro centrale skills e dispatcher tool
│   │   ├── loader.py            # Auto-discovery delle skills
│   │   └── builtin/             # Web research, coding, github, google, data, memory
│   ├── mcp/
│   │   └── client.py            # MCP Client per stdio e SSE
│   ├── integrations/
│   │   ├── google/client.py     # Google OAuth 2.0 & Gmail/Calendar/Drive API
│   │   └── github/client.py     # GitHub REST API client
│   ├── security/
│   │   ├── permissions.py       # Motore permessi READ, WRITE, DESTRUCTIVE
│   │   └── encryption.py        # Crittografia Fernet per i token
│   ├── voice/
│   │   └── service.py           # SpeechProvider abstraction (STT / TTS)
│   └── api/                     # Router FastAPI (projects, chats, messages, settings...)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/          # Header, LeftSidebar, RightDrawer
│   │   │   ├── chat/            # ChatArea, ChatMessage, ChatInput, ToolCallBadge
│   │   │   ├── voice/           # JarvisOrb (Canvas 2D), VoiceCallModal
│   │   │   ├── settings/        # SettingsModal multi-tab
│   │   │   └── modals/          # ConfirmDeleteModal, NewProjectModal, SearchModal
│   │   ├── services/            # api.ts (SSE streaming), voice.ts (STT/TTS/VAD)
│   │   └── types/               # TypeScript interfaces
├── tests/                       # Suite di test pytest completa
├── start.bat                    # Script di avvio rapido per Windows
├── start.sh                     # Script di avvio rapido per Linux/macOS
└── README.md
```

---

## 🚀 Avvio Rapido

### 1. Prerequisiti
- **Python** 3.10+ installato
- **Node.js** v18+ e **npm** installati
- **Ollama** avviato in locale (`ollama serve`)

### 2. Avvio con singolo comando (Windows)
Fai doppio click su `start.bat` oppure esegui da terminale:
```bash
.\start.bat
```

### 3. Avvio con singolo comando (Linux / macOS)
```bash
chmod +x start.sh
./start.sh
```

L'applicazione sarà disponibile su:
- **Frontend UI**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Documentazione Swagger**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🧪 Esecuzione dei Test Automatizzati

Esegui la suite di test backend:
```bash
python -m pytest -v tests/
```

Verifica build frontend:
```bash
cd frontend
npm run build
```

---

## 🔒 Sicurezza & Credenziali

- I token OAuth e le credenziali vengono cifrati a riposo con crittografia AES Fernet (`backend/security/encryption.py`).
- Le operazioni distruttive (`DESTRUCTIVE`) richiedono la conferma dell'utente nella chat prima dell'esecuzione.
