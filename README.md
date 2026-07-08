# Dieta Controlada

App mobile para controle de dieta, alimentação diária, atividades e relatórios por período.

## Funcionalidades da primeira versão

- Base de alimentos cadastrada manualmente no projeto.
- Base de atividades pré-cadastrada no projeto.
- Registro de alimentação por data, item e quantidade.
- Registro de atividades por tempo ou kcal manual.
- Resumo de alimentação x atividades.
- Filtros: hoje, semana, últimos 7 dias, mês e total.
- Gráfico de saldo diário e saldo acumulado.
- Dados de uso salvos localmente no celular.

## Cadastro de itens

O usuário final não cadastra alimentos ou atividades pelo celular. A base é mantida no código, começando com alimentos vazios para cadastro manual:

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
