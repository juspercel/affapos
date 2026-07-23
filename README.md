# Affapos

Site de links para divulgar casas de apostas legalizadas, com painel admin escondido por `?admin=1`.

## Rodar localmente

```bash
npm install
npm run dev
```

## Admin

Crie um arquivo `.env` com o email autorizado:

```env
VITE_ADMIN_EMAILS=seu-email@gmail.com
```

Acesse o painel em `/ ?admin=1` sem espaco, por exemplo:

```text
http://localhost:3000/?admin=1
```

O login usa Firebase Auth com Google.
