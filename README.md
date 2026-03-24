# Frontend — Nota Fiscal Online

Interface web em **ReactJS + Vite** para consumo da [API de Nota Fiscal](https://servidor-nota-fiscal-434040955537.southamerica-east1.run.app/swagger/doc/html).

## Tecnologias

| Lib | Finalidade |
|-----|-----------|
| React 18 | UI |
| Vite 5 | Build / dev server |
| React Router DOM 6 | Roteamento SPA |
| Axios | Chamadas HTTP |
| React Hook Form | Formulários + validação |
| React Hot Toast | Notificações |
| Tailwind CSS 3 | Estilização |

## Pré-requisitos

- Node.js ≥ 18
- npm ≥ 9

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
# App disponível em http://localhost:3000
```

## Build de Produção

```bash
npm run build
npm run preview   # inicia servidor local para testar o build
```

## Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto para sobrescrever a URL da API:

```env
VITE_API_BASE_URL=https://seu-servidor.com
```

> Por padrão a URL aponta para `https://servidor-nota-fiscal-434040955537.southamerica-east1.run.app`.

## Estrutura de Pastas

```
src/
├── api/               # Serviços HTTP (axios)
│   ├── axios.js       # Instância global + interceptors JWT
│   ├── auth.js
│   ├── nfe.js
│   ├── nfce.js
│   ├── certificado.js
│   ├── configuracao.js
│   ├── sefaz.js
│   └── usuario.js
├── context/
│   └── AuthContext.jsx  # Autenticação global
├── components/
│   ├── Layout/          # Sidebar, header, ícones
│   └── common/          # Modal, Spinner
└── pages/
    ├── LoginPage.jsx
    ├── RegisterPage.jsx
    ├── DashboardPage.jsx
    ├── CertificadoPage.jsx
    ├── ConfiguracaoPage.jsx
    ├── SefazPage.jsx
    ├── NFe/             # Emissão, consulta, cancelamento NF-e
    └── NFCe/            # Emissão, consulta, cancelamento NFC-e
```

## Funcionalidades

- **Autenticação** — login / cadastro com JWT; logout automático em 401
- **NF-e (modelo 55)** — emitir, consultar, cancelar, download XML e DANFE
- **NFC-e (modelo 65)** — emitir, consultar, cancelar, download XML e DANFCe
- **Certificados A1** — upload de PFX (Base64) e consulta de validade
- **Configurações** — emitente, séries, CSC, responsável técnico
- **SEFAZ** — status do serviço por UF/modelo e inutilização de numeração

## Licença

MIT
