# ✦ TaskFlow Gerenciador de Tarefas

O **TaskFlow** é um gerenciador de tarefas desenvolvido com HTML, CSS e JavaScript, criado como parte do **Desafio 3 da Imersão Engenharia de Software: Dev na Era da IA, da Alura**.

O projeto começou como uma lista de tarefas simples e evoluiu para uma aplicação de produtividade com organização por categorias, prioridades, prazos e recursos para facilitar o gerenciamento da rotina.

## ✨ Funcionalidades

### Gerenciamento de tarefas
- Criar, editar, concluir, reabrir e excluir tarefas.
- Definir categoria, prioridade e prazo.
- Acompanhar o total de tarefas, tarefas pendentes e concluídas.
- Visualizar o progresso geral das atividades.

### Organização e produtividade
- Pesquisa de tarefas por título, ignorando diferenças entre maiúsculas, minúsculas e acentos.
- Filtros por status, categoria e prioridade.
- Ordenação por data de criação, prazo ou prioridade.
- Identificação de tarefas atrasadas e com vencimento no dia.
- Desfazer exclusões pelo botão de ação ou pelo atalho `Ctrl + Z`.

### Entrada rápida
Permite criar tarefas usando comandos diretamente no campo de texto.

Exemplo:

`Pagar conta amanhã #finanças !alta`

A aplicação identifica automaticamente:
- `#finanças`: categoria.
- `!alta`: prioridade.
- `amanhã`: prazo.

Também reconhece expressões como `hoje`, `depois de amanhã`, dias da semana e datas no formato `dd/mm`.

### Paleta de comandos
A paleta de comandos permite executar ações sem precisar navegar manualmente pela interface.

Atalho: `Ctrl + K` ou `⌘ + K`.

Por meio dela, é possível:
- Criar tarefas.
- Alterar filtros e ordenação.
- Alternar entre os temas claro e escuro.
- Localizar e editar tarefas pelo nome.
- Desfazer a última exclusão.

## 🎨 Interface

- Design minimalista e responsivo.
- Temas claro e escuro.
- Saudação dinâmica de acordo com o horário.
- Indicador visual de progresso.
- Notificações para ações realizadas.
- Animações sutis e estados vazios contextualizados.

## 🛠️ Tecnologias utilizadas

| Tecnologia | Utilização |
|---|---|
| HTML5 | Estrutura da aplicação |
| CSS3 | Estilização e responsividade |
| JavaScript ES6+ | Lógica e funcionalidades |
| LocalStorage | Persistência de dados no navegador |
| jsdom | Apoio aos testes automatizados |

O projeto utiliza tecnologias nativas da web, sem frameworks ou bibliotecas externas na aplicação.

## 📁 Estrutura do projeto

```text
TaskFlow/
├── index.html
├── style.css
├── script.js
└── README.md
```

## 💾 Armazenamento de dados

As tarefas são armazenadas no `LocalStorage` do navegador, permitindo que continuem disponíveis após atualizar ou fechar a página.

O projeto também possui compatibilidade com registros criados na versão anterior, aplicando valores padrão aos novos campos quando necessário.

## ⚙️ Decisões técnicas

- Separação entre estrutura, estilos e lógica da aplicação.
- Atualização centralizada do estado das tarefas.
- Persistência automática das alterações.
- Separação entre lógica de filtragem e renderização da interface.
- Tratamento de entradas inválidas e proteção contra inserção de conteúdo HTML fornecido pelo usuário.
- Preferências de tema salvas no navegador.

## 📱 Responsividade e acessibilidade

A interface foi adaptada para diferentes tamanhos de tela, com ajustes para dispositivos menores.

Também foram considerados recursos de acessibilidade, como:
- Navegação por teclado.
- Identificação de campos e controles.
- Indicadores de foco.
- Regiões de anúncio para atualizações importantes.
- Respeito à preferência do sistema por movimento reduzido.

## ▶️ Como executar

Não é necessário instalar dependências para utilizar a aplicação.

1. Faça o download ou clone este repositório.
2. Abra a pasta do projeto.
3. Execute o arquivo `index.html` no navegador.

Outra opção é iniciar um servidor local com Python:

```bash
python -m http.server 3000
```

Depois, acesse:

`http://localhost:3000`

## 🧪 Testes

O projeto conta com testes automatizados utilizando jsdom para verificar funcionalidades como:

- Criação, edição e exclusão de tarefas.
- Conclusão e reabertura de atividades.
- Entrada rápida e interpretação de comandos.
- Pesquisa, filtros e ordenação.
- Persistência de dados.
- Alternância de tema.
- Paleta de comandos.
- Compatibilidade com dados antigos.
- Validação de entradas e proteção contra conteúdo HTML.

## 📚 Sobre o projeto

O TaskFlow foi desenvolvido como parte de uma experiência prática de aprendizado na **Imersão Engenharia de Software: Dev na Era da IA, da Alura**.

O objetivo foi aplicar conceitos de desenvolvimento web, organização de código, manipulação do DOM, armazenamento local e criação de funcionalidades voltadas à experiência do usuário.

---

**Desenvolvido durante a Imersão Engenharia de Software: Dev na Era da IA — Alura.**
