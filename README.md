# ✉️ MontarEmail

> **MontarEmail** é um criador visual de templates de email super moderno com recurso de arrasta e solta, estilização via Tailwind CSS, suporte a variáveis dinâmicas em tempo real e exportação de código pronto para HTML responsivo ou React Email.

<div align="center">
  <img src="https://montaremail.com.br/logo_icon.png" alt="MontarEmail Logo" width="120" />
  <p align="center">
    <strong>Crie layouts incríveis, 100% compatíveis com os principais provedores de email (Gmail, Outlook, Yahoo) sem escrever uma linha de código.</strong>
  </p>
</div>

---

## ✨ Recursos Principais

### 🚀 1. Construtor Visual Drag & Drop
- **Blocos Pré-Prontos:** Arraste cabeçalhos, parágrafos, botões CTA com ícones, imagens e divisores diretamente para o canvas.
- **Reordenamento Fácil:** Edite e mova as seções para criar o fluxo perfeito para a sua mensagem.

### 🎨 2. Identidade Visual Avançada
- **Paleta de Cores da Marca:** Configure as cores principais de forma centralizada e aplique-as com um clique.
- **Assinaturas Personalizadas:** Gere assinaturas profissionais automáticas com nome, cargo, empresa e contatos unificados.
- **Regras Condicionais de Cor:** Mude as cores do seu layout baseado no valor de uma variável (ex: se o status for `urgente`, o botão fica vermelho).

### 🏷️ 3. Variáveis Inteligentes e Dinâmicas
- **Marcação Simples:** Utilize sintaxes familiares como `{{userName}}` ou `{{status}}`.
- **Preenchimento em Tempo Real:** Digite valores de teste no painel lateral e veja a pré-visualização se adaptar na hora.

### 📱 4. Visualização 100% Responsiva
- Alterne instantaneamente entre visualizações de **Desktop** e **Mobile**.
- Layouts projetados com tabelas aninhadas e estilos inline para garantir exibição impecável em qualquer tamanho de tela.

### 📦 5. Biblioteca de Componentes Reutilizáveis
- Customize um botão, caixa de texto ou rodapé e salve na sua biblioteca pessoal.
- Use seus componentes criados em múltiplos e-mails arrastando-os de volta para o canvas.

### 💾 6. Gerenciamento de Projetos e Armazenamento
- Seus dados ficam protegidos e salvos de forma **100% privada** no `localStorage` do seu navegador.
- **Ferramentas de Backup:** Exporte ou importe o arquivo JSON completo de seus projetos com todas as paletas de cores, componentes e rascunhos.

### 🔌 7. Exportação Poderosa
- **HTML Otimizado:** Código de email clássico com CSS inline compatível com ferramentas como Mailchimp, RD Station, ActiveCampaign e SendGrid.
- **React Email (JSX):** Código limpo e componentizado ideal para desenvolvedores usarem em stacks modernas de Next.js/React.

---

## 🛠️ Tecnologias Utilizadas

A aplicação foi construída com tecnologia de ponta para máxima velocidade e reatividade:

* **React 18 + TypeScript:** Tipagem estrita de layouts e templates de email.
* **Vite:** Build e Hot Module Replacement ultra-veloz.
* **Tailwind CSS:** Estilização utilitária elegante.
* **Framer Motion (`motion/react`):** Micro-animações e transições no painel interativo.
* **Lucide React:** Biblioteca de ícones moderna e consistente.
* **Drizzle ORM / SQLite (Opcional se escalado para nuvem):** Suporte de dados de alto desempenho.

---

## 💻 Como Iniciar no Desenvolvimento Local

Siga as instruções abaixo para executar a aplicação na sua máquina:

### 📋 Pré-requisitos
Certifique-se de ter instalado o [Node.js](https://nodejs.org/) (versão 18 ou superior) e o `npm`.

### 🔧 Passos para Instalação

1. Clone o repositório ou faça o download da pasta do projeto.
2. Acesse o diretório raiz do projeto no terminal:
   ```bash
   cd montaremail
   ```
3. Instale todas as dependências necessárias:
   ```bash
   npm install
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
5. Abra o navegador no endereço indicado (geralmente [http://localhost:3000](http://localhost:3000)) para interagir com o editor!

### 🏗️ Scripts de Build Disponíveis

* `npm run dev` — Inicia o servidor de desenvolvimento local.
* `npm run build` — Compila a aplicação para produção de forma estática na pasta `dist/`.
* `npm run lint` — Executa o verificador estático do TypeScript (`tsc --noEmit`) para validar erros.

---

## 📐 Estrutura de Pastas do Projeto

```text
├── package.json               # Gerenciador de dependências e scripts do projeto
├── index.html                 # Ponto de entrada do documento HTML
├── src/
│   ├── main.tsx               # Arquivo principal de bootstrap do React
│   ├── App.tsx                # Gerenciador de estados globais e rotas do app
│   ├── index.css              # Importação do Tailwind CSS e definições de fontes
│   ├── types.ts               # Definições de tipos TypeScript unificados
│   ├── utils.ts               # Modelos padrões e funções auxiliares de exportação
│   └── components/            # Componentes modulares reutilizáveis do sistema
│       ├── LandingPage.tsx          # Tela de apresentação com simulador de editor ativo
│       ├── Sidebar.tsx              # Menu de arrasto de blocos e controle de variáveis
│       ├── Canvas.tsx               # Editor de email dinâmico e interativo
│       ├── SettingsPanel.tsx        # Detalhes de estilização do elemento selecionado
│       ├── VariablesManager.tsx     # Controlador das variáveis de preenchimento de teste
│       ├── ExportModal.tsx          # Painel de saída do HTML e React Email (JSX)
│       ├── ComponentsWorkspace.tsx  # Workspace de criação e edição de componentes globais
│       └── VisualIdentityWorkspace.tsx # Editor de paletas de marca e assinatura dinâmica
```

---

## 🛡️ Privacidade & Segurança

* O **MontarEmail** funciona de forma puramente cliente-side (`offline-first`). Nenhum template de email, endereço de destinatário ou dado de contato é enviado para servidores externos. 
* Todas as suas paletas de cores, variáveis de teste e rascunhos são armazenados localmente e criptografados pelo seu próprio browser de forma segura.

---

<p align="center">
  Desenvolvido com carinho para otimizar a criação de e-mails de forma rápida e gratuita. ✉️✨
</p>
