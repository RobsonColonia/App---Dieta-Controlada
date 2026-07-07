# Dieta Controlada

App mobile para controle de dieta, consumo diário, gasto calórico e relatórios por período.

## Funcionalidades da primeira versão

- Cadastro de alimentos com calorias e macronutrientes por 100g.
- Registro de refeições por data, tipo de refeição e quantidade.
- Registro de gasto calórico diário.
- Resumo de consumo x gasto.
- Relatórios diário, semanal e mensal.
- Dados salvos localmente no celular com AsyncStorage.

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
- Gráficos visuais.
- Exportação de relatório em PDF.
