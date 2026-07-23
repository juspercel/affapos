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

Depois de salvar as variaveis, faca redeploy.

## Admin

Acesse o painel em:

```text
https://seu-site.vercel.app/?admin=1
```

Na pagina publica normal, o botao Admin nao aparece.

## Observacao importante

Este modo remove Firebase e usa login por API da Vercel. As edicoes ficam salvas no navegador onde o painel foi usado. Para salvar online e mostrar as mesmas edicoes para todos os visitantes/dispositivos, e necessario adicionar um armazenamento gratuito, como Vercel KV/Blob, Supabase ou Firestore.
