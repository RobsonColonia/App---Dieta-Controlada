# Dieta Controlada

App mobile para controle de dieta, consumo diário, gasto calórico e relatórios por período.

## Funcionalidades da primeira versão

- Base de alimentos pré-cadastrada no projeto.
- Base de atividades pré-cadastrada no projeto.
- Registro de consumo por data, item e quantidade.
- Registro de gasto por atividade e tempo.
- Resumo de consumo x gasto.
- Filtros: hoje, semana, últimos 7 dias, mês e sempre.
- Gráfico de saldo diário e saldo acumulado.
- Dados de uso salvos localmente no celular.

## Cadastro de itens

O usuário final não cadastra alimentos ou atividades pelo celular. A base é mantida no código:

```text
src/data/foods.js
src/data/activities.js
```

Para adicionar novos itens, edite esses arquivos e publique uma nova versão no GitHub.

## Como rodar

Antes de rodar, instale:

- Node.js LTS
- Git
- Expo Go no celular

Depois, no terminal:

```bash
npm install
npm start
```

Escaneie o QR Code com o app Expo Go.

## Publicar no GitHub

```bash
git init
git add .
git commit -m "Primeira versão do app Dieta Controlada"
git branch -M main
git remote add origin URL_DO_SEU_REPOSITORIO
git push -u origin main
```

## Próximos passos sugeridos

- Login de usuário.
- Backup em nuvem.
- Leitura de código de barras.
- Metas diárias de calorias e proteína.
- Mais alimentos brasileiros pré-cadastrados.
- Exportação de relatório em PDF.
