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
VITE_ADMIN_EMAILS=seu-email@gmail.com
```

Para mais de um admin:

```env
VITE_ADMIN_EMAILS=email1@gmail.com,email2@gmail.com
```

Depois de salvar a variavel, faca redeploy.

## Firebase

O login usa Firebase Auth com Google e o conteudo e salvo no Firestore.

No Firebase Console:

1. Authentication > Sign-in method: habilite Google.
2. Authentication > Settings > Authorized domains: adicione o dominio da Vercel, por exemplo `seu-site.vercel.app`.
3. Firestore Database: crie o banco, se ainda nao existir.
4. Firestore Rules: use regras parecidas com estas, trocando o email:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sites/affapos {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.token.email in ['seu-email@gmail.com'];
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Admin

Acesse o painel em:

```text
https://seu-site.vercel.app/?admin=1
```

Na pagina publica normal, o botao Admin nao aparece.
