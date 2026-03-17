# Doc Analyser
Adicionado Analise do Sistema para Vendas finalizadas.

Painel React para analise de assertividade de classificacao OCR, com autenticacao e dashboard de metricas.

## Scripts

- `npm run dev`: inicia ambiente local com Vite.
- `npm run build`: executa typecheck e build de producao.
- `npm run lint`: executa ESLint.
- `npm run preview`: serve build local.

## Configuracao

Defina a URL da API de autenticacao em `.env`:

```env
VITE_SAFEBOX_API=https://sua-api
```

## Estrutura de pastas

```text
src/
  app/
    App.tsx                     # composicao principal (auth gate)
  features/
    auth/
      api.ts                    # requisicoes de autenticacao
      session.ts                # persistencia de sessao/localStorage
      types.ts                  # tipos do dominio de auth
      components/
        LoginForm.tsx           # tela de login
    dashboard/
      constants.ts              # constantes do dominio
      types.ts                  # tipos do dashboard/OCR
      hooks/
        useOcrData.ts           # fetch e estado dos dados OCR
      utils/
        classification.ts       # regras de classificacao
        stats.ts                # agregacoes e filtros
      components/
        Dashboard.tsx           # pagina principal do dashboard
        MetricCard.tsx          # card de metrica
        FilterButton.tsx        # botao de filtro
        OcrDetailsModal.tsx     # modal de detalhe OCR
  App.tsx                       # re-export para compatibilidade
  main.tsx                      # bootstrap da aplicacao
  index.css                     # tema e classes utilitarias
```
