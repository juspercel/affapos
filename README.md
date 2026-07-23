# Affapos

Site de links para divulgar casas de apostas legalizadas, com painel admin escondido por `?admin=1`.

## Rodar localmente

```bash
npm install
npm run dev
```

## Vercel

Configure o projeto na Vercel com:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

Em Settings > Environment Variables, adicione:

```env
ADMIN_EMAIL=seu-email@gmail.com
ADMIN_PASSWORD=sua-senha-forte
```

## Upstash Redis gratis

Para as edicoes aparecerem para todos os visitantes, conecte um banco gratis:

1. Abra o projeto na Vercel.
2. Va em `Storage` ou `Marketplace`.
3. Procure por `Upstash`.
4. Crie/conecte um banco `Upstash Redis` no plano free.
5. Conecte esse banco ao projeto `affapos`.
6. Confira em `Settings > Environment Variables` se a Vercel adicionou:

```env
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```

Tambem funciona se aparecer com nomes da Upstash:

```env
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Depois de conectar, faca `Redeploy`.

## Admin

Acesse o painel em:

```text
https://seu-site.vercel.app/?admin=1
```

Na pagina publica normal, o botao Admin nao aparece.

Quando o Upstash estiver conectado, clicar em `Salvar` grava online e todo visitante passa a ver a mesma lista.
