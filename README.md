# TaskFlow — Gerenciador de Tarefas

O **TaskFlow** é uma aplicação web de produtividade desenvolvida como parte do **3º desafio da Imersão Engenharia de Software: Dev na Era da IA, da Alura**.

Construído com HTML5, CSS3 e JavaScript puro (ES6+), o projeto evoluiu de uma lista de tarefas simples para um gerenciador completo, com recursos de organização, produtividade e acompanhamento de atividades.

## ✨ Funcionalidades

- **Gerenciamento de tarefas:** criação, edição, conclusão, reabertura e exclusão.
- **Dashboard:** indicadores de tarefas, percentual de conclusão e barra de progresso.
- **Organização:** categorias, prioridades e prazos.
- **Pesquisa e filtros:** busca por título, filtros combinados e ordenação de tarefas.
- **Entrada rápida:** criação de tarefas por comandos como `amanhã`, `#categoria` e `!alta`.
- **Paleta de comandos:** execução de ações pelo teclado com `Ctrl + K`.
- **Desfazer exclusão:** recuperação de tarefas excluídas por até 6 segundos.
- **Temas:** opções clara e escura, com preferência salva no navegador.
- **Responsividade:** interface adaptada para diferentes tamanhos de tela.

## 🛠️ Tecnologias

- HTML5
- CSS3
- JavaScript ES6+
- LocalStorage
- jsdom (testes automatizados)

Aplicação desenvolvida sem frameworks ou dependências externas.

## 📁 Estrutura do projeto

```text
taskflow/
├── index.html
├── style.css
├── script.js
└── README.md
```

## ⚙️ Como executar

Não é necessário instalar dependências.

1. Clone ou baixe este repositório.
2. Abra a pasta do projeto.
3. Execute o arquivo `index.html` no navegador.

Ou, se preferir, utilize um servidor local:

```bash
python -m http.server 3000
```

Acesse `http://localhost:3000`.

## 🧪 Testes

O projeto conta com testes automatizados utilizando jsdom, abrangendo funcionalidades como gerenciamento de tarefas, filtros, pesquisa, entrada rápida, persistência de dados, temas e paleta de comandos.

## 📚 Aprendizados

O desenvolvimento do TaskFlow envolveu conceitos de manipulação do DOM, gerenciamento de estado, armazenamento local, responsividade, acessibilidade, organização de código e evolução de funcionalidades em uma aplicação web.

---

**Desenvolvido durante o 3º desafio da Imersão Engenharia de Software: Dev na Era da IA — Alura.**
