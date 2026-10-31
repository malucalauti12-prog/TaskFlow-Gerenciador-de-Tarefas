# TaskFlow 2.0 — Gerenciador de Tarefas

Aplicação web de produtividade feita com **HTML5, CSS3 e JavaScript puro (ES6+)**, sem frameworks nem dependências. A v2 evolui a versão original mantendo todas as funcionalidades e os dados já salvos no navegador.

## Funcionalidades

**Já existiam na v1 (preservadas):** adicionar, concluir/reabrir e excluir tarefas, indicadores de total/pendentes/concluídas, filtros por status com contadores, estados vazios contextuais e persistência em `LocalStorage`.

**Novas na v2:**

- **Dashboard com menu lateral**, saudação por horário (bom dia / boa tarde / boa noite) e data no cabeçalho.
- **Percentual de conclusão** e **barra de progresso** dinâmica (`role="progressbar"`).
- **Campos novos na tarefa:** categoria, prioridade (baixa, média, alta) e prazo opcional, além de título, data de criação e status.
- **Edição de tarefas:** o botão de lápis carrega a tarefa no formulário; `Esc` ou "Cancelar edição" desfaz.
- **Pesquisa por título** (ignora maiúsculas e acentos), **filtro por prioridade**, **filtro por categoria** e **ordenação** por mais recentes, prazo ou prioridade. Os filtros combinam entre si e com o status do menu lateral.
- **Prazo vencido** sinalizado em destaque; "Vence hoje" para tarefas do dia.
- **Visual minimalista:** paleta de neutros com um único acento (índigo), bordas finas, sem sombras pesadas e sem ícones decorativos. A lista é um painel único com linhas separadas por filetes, e a prioridade aparece como um ponto colorido. Sem fontes nem bibliotecas externas.
- **Tema claro/escuro** salvo em `localStorage` (na primeira visita segue a preferência do sistema).
- **Feedback visual:** avisos (toasts) ao adicionar, editar, concluir e excluir, e animação discreta no item criado ou editado.

## Recursos de produtividade

- **Entrada rápida:** ao criar, o título entende `#categoria`, `!alta` / `!média` / `!baixa` e datas (`hoje`, `amanhã`, `depois de amanhã`, dias da semana e `dd/mm`). Exemplo: `Pagar conta amanhã #finanças !alta` vira a tarefa "Pagar conta", categoria Finanças, prioridade alta e prazo de amanhã. Os campos do formulário continuam valendo quando nada é digitado no título. Não se aplica na edição.
- **Paleta de comandos (`Ctrl+K` ou `⌘K`, ou o botão "Comandos"):** cria tarefa, troca filtros e ordenação, alterna o tema, edita uma tarefa pelo nome e desfaz a exclusão, tudo pelo teclado (setas, `Enter` e `Esc`). Usa o elemento nativo `<dialog>`, que já prende o foco e é lido por leitores de tela.
- **Desfazer ao excluir:** o aviso traz o botão "Desfazer" (também `Ctrl+Z` fora de campos de texto) por 6 segundos. A tarefa volta à mesma posição.

## Estrutura

```plaintext
taskflow/
├── index.html   # estrutura semântica
├── style.css    # design tokens (claro/escuro), layout, componentes e responsividade
├── script.js    # estado, regras de negócio, persistência e renderização
└── README.md
```

## Dados e compatibilidade

A chave de armazenamento continua `taskflow_tasks_v1`, e o título continua no campo `text`. Cada tarefa agora tem este formato:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "text": "Estudar arquitetura limpa em JavaScript",
  "completed": false,
  "createdAt": "2026-10-31T13:00:00.000Z",
  "category": "Estudos",
  "priority": "high",
  "dueDate": "2026-11-05"
}
```

Tarefas salvas pela v1 (só com `id`, `text`, `completed` e `createdAt`) são completadas ao carregar com categoria `Geral`, prioridade `medium` e sem prazo. Nada é apagado, e registros inválidos são descartados com segurança. A preferência de tema fica em `taskflow_theme`.

## Decisões técnicas

- **Fluxo unidirecional:** ações alteram o `state`, gravam no `LocalStorage` e chamam `render()`. Seleção e ordenação (`getVisibleTasks`) não tocam no DOM.
- **Um único formulário** serve para criar e editar, evitando duplicar campos e validações.
- **Tema por tokens CSS:** `[data-theme="dark"]` só redefine variáveis, sem duplicar regras. Cores fixas da v1 foram trocadas por tokens, e o cinza de texto atenuado foi escurecido para atingir contraste AA.
- **Segurança:** textos de usuário entram no DOM sempre via `textContent`.
- **Acessibilidade:** link "pular para o conteúdo", `label` em todos os campos, foco visível, filtros com `aria-pressed`, tema com `aria-pressed`, barra de progresso com `aria-valuenow`, avisos em região `role="status"`, e foco mantido na lista após concluir ou excluir. `prefers-reduced-motion` desliga animações.
- **Responsividade:** abaixo de 900px o menu lateral vira uma barra superior; abaixo de 600px formulário e filtros ocupam uma coluna.

## Como executar

Abra o `index.html` no navegador, ou use um servidor local:

```bash
cd taskflow
python -m http.server 3000   # http://localhost:3000
```

## Testes realizados

Teste automatizado de fumaça (jsdom) com dados da v1 no `LocalStorage`: entrada rápida (categoria, prioridade, `amanhã`, `dd/mm`), desfazer pelo botão e por `Ctrl+Z`, paleta de comandos, carga de dados antigos, valores padrão, proteção contra HTML no título, adicionar, validar título vazio, editar, concluir/reabrir, excluir, pesquisa, filtros de status/prioridade/categoria, ordenação por prazo e prioridade, persistência, tema salvo, barra de progresso e ausência de erros no console. Contraste, aparência e comportamento em celular dependem de conferência visual no navegador.
