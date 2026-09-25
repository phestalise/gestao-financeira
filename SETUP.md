# Configuração (custo zero)

## 1. Firestore
No Firebase Console → seu projeto (`gestao-financeira-3bff1`) → **Compilação → Firestore Database** → Criar banco de dados → modo produção → região `southamerica-east1` (São Paulo).

Depois publique as regras (bloqueiam qualquer acesso direto do navegador — só o servidor acessa):
- Console → Firestore Database → Regras → cole o conteúdo de `firestore.rules` → Publicar.

## 2. Chave de conta de serviço (Firebase Admin)
Configurações do projeto (⚙️) → **Contas de serviço** → **Gerar nova chave privada** → baixa um `.json`.
Abra o arquivo e copie para o `.env.local`:
- `project_id` → `FIREBASE_PROJECT_ID`
- `client_email` → `FIREBASE_CLIENT_EMAIL`
- `private_key` → `FIREBASE_PRIVATE_KEY` (mantenha as aspas e os `\n`)

## 3. Rodar local
```bash
npm run dev
```
Abra http://localhost:3000 → home pública. Crie sua conta em **Criar conta** usando o e-mail de `OWNER_EMAIL` para herdar os dados que já existiam. Cada pessoa que se cadastrar tem um espaço próprio e privado.

## 4. Deploy grátis (Vercel)
```bash
npx vercel
```
Login com GitHub, sem cartão. Depois, no painel do projeto na Vercel → **Settings → Environment Variables**, cole as mesmas variáveis do `.env.local`. Redeploy.

## Custos
Tudo dentro do free tier permanente enquanto for uso pessoal:
- Vercel Hobby: grátis
- Firestore (Spark): grátis, sem cartão
- Gemini API (free tier): grátis, sem cartão
- Nenhum passo acima pede dados de pagamento.
