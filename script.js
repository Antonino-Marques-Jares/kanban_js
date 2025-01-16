/**
 * Obtém os elementos do DOM para manipulação posterior
 * @type {HTMLElement}
 */
const addGrupoButton = document.getElementById('add-grupo');
const addItemButton = document.getElementById('add-item');
const nomeNovoGrupoInput = document.getElementById('nome-novo-grupo');
const nomeNovoItemInput = document.getElementById('nome-novo-item');
const kanban = document.getElementById('kanban');
const contextMenu = document.getElementById('contextMenu');
const contextMenuGrupo = document.getElementById('contextMenuGrupo');
const editarItemOption = document.getElementById('editarItem');
const excluirItemOption = document.getElementById('excluirItem');
const editarGrupoOption = document.getElementById('editarGrupo');
const excluirGrupoOption = document.getElementById('excluirGrupo');

let itemCounter = 3; // Começa após o último item existente
let currentItem = null; // Referência ao item atual do menu de contexto
let currentGrupo = null; // Referência ao grupo atual do menu de contexto

/**
 * Função para salvar o estado atual do Kanban no cookie
 * @function
 */
function saveKanbanToCookie() {
  const grupos = [];
  const grupoElements = document.querySelectorAll('.titulo-grupo');

  grupoElements.forEach(grupoElement => {
    const grupo = {
      nome: grupoElement.querySelector('h1').textContent,
      itens: []
    };

    const itemElements = grupoElement.querySelectorAll('.grupo .item');
    itemElements.forEach(item => {
      grupo.itens.push(item.textContent);
    });

    grupos.push(grupo);
  });

  // Converte os dados em JSON
  const jsonData = JSON.stringify(grupos);

  // Criptografa os dados
  const encryptedData = CryptoJS.AES.encrypt(jsonData, 'secret-key').toString();

  // Salva os dados criptografados no cookie
  document.cookie = `kanbanData=${encryptedData}; path=/; max-age=${60 * 60 * 24 * 365}`;
}

/**
 * Função para carregar o Kanban a partir do cookie
 * @function
 */
function loadKanbanFromCookie() {
  const cookies = document.cookie.split('; ');
  const kanbanCookie = cookies.find(cookie => cookie.startsWith('kanbanData='));

  if (kanbanCookie) {
    // Extrai e descriptografa os dados do cookie
    const encryptedData = kanbanCookie.split('=')[1];
    const bytes = CryptoJS.AES.decrypt(encryptedData, 'secret-key');
    const jsonData = bytes.toString(CryptoJS.enc.Utf8);

    // Converte de volta para um objeto
    const kanbanData = JSON.parse(jsonData);

    // Cria os grupos e itens a partir dos dados
    kanbanData.forEach(grupo => {
      createGrupo(grupo.nome); // Cria o grupo
      const grupoElement = document.querySelector(`#kanban .titulo-grupo:last-child .grupo`);
      grupo.itens.forEach(item => {
        createItem(item, grupoElement); // Cria os itens dentro do grupo
      });
    });
  }
}

/**
 * Função para criar um novo grupo
 * @param {string} nome - Nome do grupo a ser criado
 * @function
 */
function createGrupo(nome) {
  const tituloGrupo = document.createElement('div');
  tituloGrupo.className = 'titulo-grupo';

  const grupo = document.createElement('div');
  grupo.className = 'grupo';
  grupo.addEventListener('dragover', handleDragOver);

  const titulo = document.createElement('h1');
  titulo.textContent = nome;
  titulo.addEventListener('contextmenu', handleContextMenuGrupo); // Adicionando o menu de contexto para o título do grupo

  tituloGrupo.appendChild(titulo);
  tituloGrupo.appendChild(grupo);
  kanban.appendChild(tituloGrupo);
}

/**
 * Função para criar um novo item dentro de um grupo
 * @param {string} nome - Nome do item a ser criado
 * @param {HTMLElement} grupo - O grupo onde o item será adicionado
 * @function
 */
function createItem(nome, grupo) {
  const item = document.createElement('div');
  item.className = 'item';
  item.draggable = true;
  item.id = `item-${++itemCounter}`;
  item.textContent = nome;

  item.addEventListener('dragstart', () => item.classList.add('dragging'));
  item.addEventListener('dragend', () => item.classList.remove('dragging'));
  item.addEventListener('contextmenu', handleContextMenu); // Menu de contexto para o item

  grupo.appendChild(item);
}

// Evento de adicionar grupo
addGrupoButton.addEventListener('click', () => {
  const nomeGrupo = nomeNovoGrupoInput.value.trim();
  if (nomeGrupo) {
    createGrupo(nomeGrupo);
    nomeNovoGrupoInput.value = '';
    saveKanbanToCookie(); // Salva o estado após adicionar o grupo
  }
});

// Evento de adicionar item
addItemButton.addEventListener('click', () => {
  const nomeItem = nomeNovoItemInput.value.trim();
  const grupoInicial = document.getElementById('grupo-inicial');
  if (nomeItem && grupoInicial) {
    createItem(nomeItem, grupoInicial);
    nomeNovoItemInput.value = '';
    saveKanbanToCookie(); // Salva o estado após adicionar o item
  }
});

/**
 * Gerencia o menu de contexto para itens
 * @param {Event} event - O evento de clique com o botão direito
 * @function
 */
function handleContextMenu(event) {
  event.preventDefault();
  const { clientX, clientY } = event;
  currentItem = event.target; // Armazena o item atual
  contextMenu.style.left = `${clientX}px`;
  contextMenu.style.top = `${clientY}px`;
  contextMenu.style.display = 'block';
}

/**
 * Gerencia o menu de contexto para grupos
 * @param {Event} event - O evento de clique com o botão direito
 * @function
 */
function handleContextMenuGrupo(event) {
  event.preventDefault();
  const { clientX, clientY } = event;
  currentGrupo = event.target.closest('.titulo-grupo'); // Armazena o grupo atual
  contextMenuGrupo.style.left = `${clientX}px`;
  contextMenuGrupo.style.top = `${clientY}px`;
  contextMenuGrupo.style.display = 'block';
}

/**
 * Fechar os menus de contexto ao clicar fora deles
 * @param {Event} event - O evento de clique
 * @function
 */
document.addEventListener('click', (event) => {
  if (!contextMenu.contains(event.target) && !contextMenuGrupo.contains(event.target)) {
    contextMenu.style.display = 'none';
    contextMenuGrupo.style.display = 'none';
  }
});

/**
 * Função para gerenciar o drag-and-drop de itens entre grupos
 * @param {Event} event - O evento de arrastar
 * @function
 */
function handleDragOver(event) {
  event.preventDefault();
  const dragging = document.querySelector('.dragging');
  const target = event.target.closest('.grupo');
  if (target) {
    target.appendChild(dragging);
  }
}

/**
 * Funcionalidade de Editar Item
 * @function
 */
editarItemOption.addEventListener('click', () => {
  if (currentItem) {
    const novoTexto = prompt('Editar Item:', currentItem.textContent);
    if (novoTexto) {
      currentItem.textContent = novoTexto;
      saveKanbanToCookie(); // Salva o estado após editar o item
    }
    contextMenu.style.display = 'none';
  }
});

/**
 * Funcionalidade de Excluir Item
 * @function
 */
excluirItemOption.addEventListener('click', () => {
  if (currentItem) {
    currentItem.remove(); // Remove o item atual
    saveKanbanToCookie(); // Salva o estado após excluir o item
    contextMenu.style.display = 'none';
  }
});

/**
 * Funcionalidade de Editar Grupo
 * @function
 */
editarGrupoOption.addEventListener('click', () => {
  if (currentGrupo) {
    const tituloGrupo = currentGrupo.querySelector('h1');
    const novoNome = prompt('Editar nome do Grupo:', tituloGrupo.textContent);
    if (novoNome) {
      tituloGrupo.textContent = novoNome;
      saveKanbanToCookie(); // Salva o estado após editar o grupo
    }
    contextMenuGrupo.style.display = 'none';
  }
});

/**
 * Funcionalidade de Excluir Grupo
 * @function
 */
excluirGrupoOption.addEventListener('click', () => {
  if (currentGrupo) {
    currentGrupo.remove(); // Remove o grupo
    saveKanbanToCookie(); // Salva o estado após excluir o grupo
    contextMenuGrupo.style.display = 'none';
  }
});

/**
 * Carregar o Kanban quando a página for carregada
 * @function
 */
window.onload = () => {
  loadKanbanFromCookie(); // Carrega o Kanban do cookie
};
