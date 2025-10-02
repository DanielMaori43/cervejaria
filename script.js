// ====== main.js ======

// ===== Usuários pré-definidos =====
const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [{ usuario: "admin", senha: "1234", tipo: "admin" }]

localStorage.setItem("usuarios", JSON.stringify(usuarios))

// ===== Login Automático Padrão (Cliente Visitante) =====
if (!sessionStorage.getItem("usuarioLogado")) {
  sessionStorage.setItem("usuarioLogado", "Visitante")
  sessionStorage.setItem("tipoLogado", "cliente")
}

// ===== Login =====
if (document.getElementById("loginForm")) {
  const form = document.getElementById("loginForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const tipo = document.getElementById("tipo").value;

    if (!tipo) {
      alert("Selecione o tipo de login!");
      return;
    }

    // ===== Se for cliente, loga direto sem senha =====
    if (tipo === "cliente") {
      sessionStorage.setItem("usuarioLogado", "Visitante");
      sessionStorage.setItem("tipoLogado", "cliente");
      window.location.href = "index.html";
      return;
    }

    // ===== Se for garçom, loga com qualquer usuário digitado =====
    if (tipo === "garcom") {
      sessionStorage.setItem("usuarioLogado", usuario || "Garçom");
      sessionStorage.setItem("tipoLogado", "garcom");
      window.location.href = "garçom.html";
      return;
    }

    // ===== Caso admin ou outros usuários precisem de senha =====
    const usuariosSalvos = JSON.parse(localStorage.getItem("usuarios")) || [];
    const user = usuariosSalvos.find(
      (u) => u.usuario === usuario && u.senha === senha && u.tipo === tipo
    );

    if (!user) {
      alert("Usuário ou senha incorretos!");
      return;
    }

    sessionStorage.setItem("usuarioLogado", user.usuario);
    sessionStorage.setItem("tipoLogado", user.tipo);
    window.location.href = "index.html";
  });
}


// ===== Cadastro de Usuário =====
function cadastrarUsuario() {
  const logado = sessionStorage.getItem("tipoLogado")
  if (logado !== "admin") {
    alert("Apenas administradores podem cadastrar usuários!")
    return
  }

  const novoUsuario = prompt("Digite o nome de usuário:")
  const novaSenha = prompt("Digite a senha:")
  const opcao = confirm("Clique em OK para cadastrar como GARÇOM.\nClique em CANCELAR para cadastrar como CAIXA.")
  const novoTipo = opcao ? "garcom" : "caixa"

  if (!novoUsuario || !novaSenha) {
    alert("Todos os campos são obrigatórios!")
    return
  }

  const usuariosSalvos = JSON.parse(localStorage.getItem("usuarios")) || []
  usuariosSalvos.push({ usuario: novoUsuario, senha: novaSenha, tipo: novoTipo })
  localStorage.setItem("usuarios", JSON.stringify(usuariosSalvos))

  alert(`Usuário ${novoUsuario} (${novoTipo.toUpperCase()}) cadastrado com sucesso!`)
}

// ===== Exibe usuário logado =====
const usuarioLogadoElement = document.getElementById("usuarioLogado")
if (usuarioLogadoElement) {
  const usuario = sessionStorage.getItem("usuarioLogado")
  const tipo = sessionStorage.getItem("tipoLogado")

  if (usuario && tipo) {
    usuarioLogadoElement.textContent = " " + tipo.toUpperCase() + " Logado: " + usuario
  } else {
    usuarioLogadoElement.textContent = "Nenhum usuário logado"
  }
}

// ===== Garçom - Controle de Status (VERSÃO LIMPA) =====
document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".garcomdisponivel")
  if (!container) return

  console.log("🔧 Inicializando tela de garçons...")

  const tipoLogado = (sessionStorage.getItem("tipoLogado") || "").toLowerCase()
  const statusGarcons = JSON.parse(localStorage.getItem("statusGarcons")) || {}
  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || []
  const garcons = usuarios.filter((u) => u.tipo === "garcom")

  // Limpa completamente
  container.innerHTML = ""

  if (garcons.length === 0) {
    container.innerHTML = "<p style='color: #666; text-align: center;'>Nenhum garçom cadastrado.</p>"
    return
  }

  // Cria cada item de garçom
  garcons.forEach((garcom) => {
    const statusAtual = statusGarcons[garcom.usuario] || "disponivel"

    // Container do garçom
    const itemDiv = document.createElement("div")
    itemDiv.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      margin: 5px 0;
      background: #f5f5f5;
      border-radius: 5px;
    `

    // Botão de status (SEM TEXTO)
    const statusBtn = document.createElement("button")
    statusBtn.className = `status-btn ${statusAtual}`
    statusBtn.setAttribute("data-garcom", garcom.usuario)
    statusBtn.style.cssText = `
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      background: ${statusAtual === "disponivel" ? "#4CAF50" : "#f44336"};
      transition: all 0.3s;
    `
    statusBtn.title =
      statusAtual === "disponivel" ? "Disponível - Clique para Ocupado" : "Ocupado - Clique para Disponível"

    // Nome do garçom
    const nomeSpan = document.createElement("span")
    nomeSpan.textContent = garcom.usuario
    nomeSpan.style.cssText = "font-weight: 500; font-size: 16px;"

    // Monta o item
    itemDiv.appendChild(statusBtn)
    itemDiv.appendChild(nomeSpan)
    container.appendChild(itemDiv)
  })

  // Adiciona eventos nos botões
  const statusBtns = container.querySelectorAll(".status-btn")
  const timers = {}

  statusBtns.forEach((btn) => {
    const garcomNome = btn.getAttribute("data-garcom")

    if (tipoLogado !== "garcom") {
      btn.style.cursor = "not-allowed"
      btn.style.opacity = "0.5"
      return
    }

    btn.addEventListener("click", () => {
      if (btn.classList.contains("disponivel")) {
        // Muda para OCUPADO
        btn.classList.remove("disponivel")
        btn.classList.add("ocupado")
        btn.style.background = "#f44336"
        btn.title = "Ocupado - Clique para Disponível"

        statusGarcons[garcomNome] = "ocupado"
        localStorage.setItem("statusGarcons", JSON.stringify(statusGarcons))

        if (timers[garcomNome]) clearTimeout(timers[garcomNome])

        timers[garcomNome] = setTimeout(
          () => {
            btn.classList.remove("ocupado")
            btn.classList.add("disponivel")
            btn.style.background = "#4CAF50"
            btn.title = "Disponível - Clique para Ocupado"

            statusGarcons[garcomNome] = "disponivel"
            localStorage.setItem("statusGarcons", JSON.stringify(statusGarcons))

            alert(`${garcomNome} voltou para disponível automaticamente.`)
            delete timers[garcomNome]
          },
          5 * 60 * 1000,
        )
      } else {
        // Muda para DISPONÍVEL
        btn.classList.remove("ocupado")
        btn.classList.add("disponivel")
        btn.style.background = "#4CAF50"
        btn.title = "Disponível - Clique para Ocupado"

        statusGarcons[garcomNome] = "disponivel"
        localStorage.setItem("statusGarcons", JSON.stringify(statusGarcons))

        if (timers[garcomNome]) {
          clearTimeout(timers[garcomNome])
          delete timers[garcomNome]
        }
      }
    })
  })
})



// ===== Index =====
if (document.querySelector(".topo")) {
  const usuarioLogado = sessionStorage.getItem("usuarioLogado")
  const tipoLogado = sessionStorage.getItem("tipoLogado")
  if (usuarioLogado) {
    console.log("Usuário logado:", usuarioLogado, "Tipo:", tipoLogado)
  }
}
// Abre pedidos de uma mesa
function abrirMesa(numeroMesa) {
  const detalhes = document.getElementById("detalhesMesa");
  const titulo = document.getElementById("tituloMesa");
  titulo.textContent = "Pedidos da Mesa " + numeroMesa;

  renderMesa(numeroMesa);

  detalhes.style.display = "block";
  window.scrollTo({ top: detalhes.offsetTop - 50, behavior: "smooth" });
}

// Renderiza pedidos de uma mesa
function renderMesa(numeroMesa) {
  const container = document.getElementById("pedidosMesa");
  if (!container) return;

  const pedidos = JSON.parse(localStorage.getItem("pedidos")) || [];
  const pedidosMesa = pedidos.filter(p => p.mesa === String(numeroMesa));

  if (pedidosMesa.length === 0) {
    container.innerHTML = "<p>Nenhum pedido nesta mesa ainda.</p>";
    return;
  }

  let html = "<ul>";
  pedidosMesa.forEach(p => {
    html += `
          <li>
            ${p.quantidade}x ${p.item} - R$${p.valor}
            = <strong>R$${p.subtotal.toFixed(2)}</strong>
            ${p.obs ? `<em>(${p.obs})</em>` : ""}
          </li>
        `;
  });
  html += "</ul>";

  const total = pedidosMesa.reduce((s, p) => s + (p.subtotal || 0), 0);
  html += `<p><strong>Total: R$${total.toFixed(2)}</strong></p>`;

  container.innerHTML = html;
}

// ===== Pedidos =====
const formPedido = document.getElementById("formPedido")
if (formPedido) {
  formPedido.addEventListener("submit", (e) => {
    e.preventDefault()

    const mesa = document.getElementById("mesa").value
    const item = document.getElementById("item").value
    const quantidade = Number.parseInt(document.getElementById("quantidade").value)
    const valor = Number.parseFloat(document.getElementById("valor").value)
    const obs = document.getElementById("obs").value
    const subtotal = quantidade * valor

    const pedido = { mesa, item, quantidade, valor, subtotal, obs, status: "em-andamento" }

    const pedidos = JSON.parse(localStorage.getItem("pedidos")) || []
    pedidos.push(pedido)
    localStorage.setItem("pedidos", JSON.stringify(pedidos))

    alert(`Pedido da mesa ${mesa} adicionado com sucesso!`)
    formPedido.reset()
  })
}

// ===== Caixa =====
function renderCaixa() {
  const mesasContainer = document.getElementById("mesasContainer")
  if (!mesasContainer) return

  mesasContainer.innerHTML = ""
  const pedidos = JSON.parse(localStorage.getItem("pedidos")) || []
  const mesas = {}

  pedidos.forEach((p) => {
    if (!mesas[p.mesa]) {
      mesas[p.mesa] = { itens: [], total: 0 }
    }
    const quantidade = Number(p.quantidade) || 0
    const valor = Number(p.valor) || 0
    const subtotal = quantidade * valor
    mesas[p.mesa].itens.push({ ...p, subtotal })
    mesas[p.mesa].total += subtotal
  })

  for (const mesa in mesas) {
    const card = document.createElement("div")
    card.classList.add("mesa-card")
    card.innerHTML = `
      <h3>Mesa ${mesa}</h3>
      <ul>
        ${mesas[mesa].itens
        .map(
          (i) => `
          <li>
            ${i.item} ${i.quantidade}x - R$${i.valor}
            = <strong>R$${i.subtotal.toFixed(2)}</strong>
            ${i.obs ? `<em>(${i.obs})</em>` : ""}
          </li>
        `,
        )
        .join("")}
      </ul>
      <p><strong>Total: R$${mesas[mesa].total.toFixed(2)}</strong></p>
    `
    mesasContainer.appendChild(card)
  }
}

let mesaAtual = null;

// Renderiza todas as mesas
function renderMesas() {
  const container = document.getElementById('mesasContainer');
  const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];

  const mesas = {};
  pedidos.forEach(p => {
    if (!mesas[p.mesa]) mesas[p.mesa] = [];
    mesas[p.mesa].push(p);
  });

  container.innerHTML = '';
  const totalMesas = 9;
  for (let i = 1; i <= totalMesas; i++) {
    const mesaPedidos = mesas[i] || [];
    const div = document.createElement('div');
    div.className = `mesa ${mesaPedidos.length ? 'ocupada' : 'livre'}`;
    div.innerHTML = `<span>Mesa ${i}</span>` + (mesaPedidos.length ? `<div class="count">${mesaPedidos.length}</div>` : '');
    div.onclick = () => abrirModalMesa(i);
    container.appendChild(div);
  }
}

// Modal da mesa
function abrirModalMesa(mesaNum) {
  mesaAtual = mesaNum;
  const modal = document.getElementById('modalOverlay');
  const titulo = document.getElementById('modalTitulo');
  const lista = document.getElementById('modalPedidos');

  titulo.textContent = `Pedidos Mesa ${mesaNum}`;
  const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
  const mesaPedidos = pedidos.filter(p => String(p.mesa) === String(mesaNum));

  lista.innerHTML = '';
  if (mesaPedidos.length === 0) {
    lista.innerHTML = '<li>Nenhum pedido nesta mesa.</li>';
  } else {
    mesaPedidos.forEach((p, index) => {
      const qtd = Number(p.quantidade) || 0;
      const val = Number(p.valor) || 0;
      const sub = Number(p.subtotal) || qtd * val;
      const li = document.createElement('li');
      li.innerHTML = `${qtd}x ${p.item || 'Item não informado'} - R$${val.toFixed(2)} = R$${sub.toFixed(2)}${p.obs ? ` (${p.obs})` : ''} <button class="cancelar" onclick="cancelarPedidoModal(${index})">Cancelar</button>`;
      lista.appendChild(li);
    });
  }

  modal.style.display = 'flex';
}

// Fechar modal
function fecharModal() { mesaAtual = null; document.getElementById('modalOverlay').style.display = 'none'; }

// Cancelar pedido individual
function cancelarPedidoModal(index) {
  if (!mesaAtual) return;
  let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
  const mesaPedidos = pedidos.filter(p => String(p.mesa) === String(mesaAtual));
  const pedido = mesaPedidos[index];
  if (!pedido) return;
  if (!confirm(`Deseja cancelar o pedido "${pedido.item}"?`)) return;

  const globalIndex = pedidos.findIndex(p => p === pedido);
  if (globalIndex >= 0) pedidos.splice(globalIndex, 1);
  localStorage.setItem('pedidos', JSON.stringify(pedidos));
  abrirModalMesa(mesaAtual);
  renderMesas();
}

// Cancelar toda a mesa
function cancelarMesaModal() {
  if (!mesaAtual) return;
  if (!confirm(`Deseja cancelar todos os pedidos da mesa ${mesaAtual}?`)) return;

  let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
  pedidos = pedidos.filter(p => String(p.mesa) !== String(mesaAtual));
  localStorage.setItem('pedidos', JSON.stringify(pedidos));
  fecharModal();
  renderMesas();
}

// Fechar mesa e gerar PDF
function fecharMesaModal() {
  if (!mesaAtual) return;
  const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
  const mesaPedidos = pedidos.filter(p => String(p.mesa) === String(mesaAtual));
  if (mesaPedidos.length === 0) return alert('Não há pedidos nesta mesa.');

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [163, 300] // largura ~80mm, altura ajustável
  });

  doc.setFont('Courier', 'normal');
  let y = 20;
  const dataHora = new Date().toLocaleString();
  const total = mesaPedidos.reduce((acc, p) => acc + (Number(p.subtotal) || (Number(p.quantidade) || 0) * (Number(p.valor) || 0)), 0);
  const linhaAltura = 14;

  // ===== Cabeçalho =====
  doc.setFontSize(12);
  doc.text('Cervejaria Mandela', 81, y, { align: 'center' }); y += linhaAltura;
  doc.setFontSize(10);
  doc.text(`Mesa ${mesaAtual}`, 81, y, { align: 'center' }); y += linhaAltura;
  doc.text(dataHora, 81, y, { align: 'center' }); y += linhaAltura;
  doc.text('-------------------------------', 81, y, { align: 'center' }); y += linhaAltura;

  // ===== Títulos da Tabela =====
  doc.setFontSize(10);
  doc.text("Qtd", 10, y);
  doc.text("Item", 40, y);
  doc.text("Subtotal", 130, y, { align: 'right' });
  y += linhaAltura;
  doc.text('-------------------------------', 81, y, { align: 'center' }); y += linhaAltura;

  // ===== Pedidos =====
  mesaPedidos.forEach(p => {
    const qtd = Number(p.quantidade) || 0;
    const val = Number(p.valor) || 0;
    const sub = Number(p.subtotal) || qtd * val;

    if (y + linhaAltura > doc.internal.pageSize.height) {
      doc.addPage();
      y = 20;
      doc.setFont('Courier', 'normal');
    }

    doc.text(String(qtd), 10, y); // Qtd
    doc.text(p.item.substring(0, 12), 40, y); // Nome do item
    doc.text(`R$${sub.toFixed(2)}`, 150, y, { align: 'right' }); // Subtotal
    y += linhaAltura;

    if (p.obs) {
      doc.setFontSize(8);
      doc.text(`Obs: ${p.obs}`, 40, y);
      doc.setFontSize(10);
      y += 10;
    }
  });

  // ===== Total =====
  doc.text('-------------------------------', 81, y, { align: 'center' }); y += linhaAltura;
  doc.setFontSize(12);
  doc.text(`TOTAL: R$${total.toFixed(2)}`, 150, y, { align: 'right' }); y += linhaAltura * 2;

  // ===== Rodapé =====
  doc.setFontSize(10);
  doc.text('Obrigado pela preferência!', 81, y, { align: 'center' });
  y += linhaAltura;
  doc.text('Volte Sempre!', 81, y, { align: 'center' });

  // Abre o PDF
  window.open(doc.output('bloburl'));

  // ===== Histórico =====
  let historico = JSON.parse(localStorage.getItem('historico')) || [];
  mesaPedidos.forEach(p => { p.dataHora = dataHora; historico.push(p); });
  localStorage.setItem('historico', JSON.stringify(historico));
  let restantes = pedidos.filter(p => String(p.mesa) !== String(mesaAtual));
  localStorage.setItem('pedidos', JSON.stringify(restantes));

  fecharModal();
  renderMesas();
}



// Histórico
function mostrarHistorico() {
  const container = document.getElementById('historicoContainer');
  const historico = JSON.parse(localStorage.getItem('historico')) || [];
  if (historico.length === 0) { container.innerHTML = '<p>Nenhum histórico.</p>'; return; }

  const mesas = {};
  historico.forEach(p => {
    const chave = `Mesa ${p.mesa} - ${p.dataHora}`;
    if (!mesas[chave]) mesas[chave] = [];
    mesas[chave].push(p);
  });

  let html = '';
  for (const chave in mesas) {
    const pedidosMesa = mesas[chave];
    html += `<div class="mesa"><h3>${chave}</h3><ul>`;
    pedidosMesa.forEach(p => {
      const qtd = Number(p.quantidade) || 0;
      const val = Number(p.valor) || 0;
      const sub = Number(p.subtotal) || qtd * val;
      html += `<li>${qtd}x ${p.item || 'Item não informado'} - R$${val.toFixed(2)} = R$${sub.toFixed(2)}${p.obs ? ` (${p.obs})` : ''}</li>`;
    });
    const total = pedidosMesa.reduce((s, p) => s + (Number(p.subtotal) || (Number(p.quantidade) || 0) * (Number(p.valor) || 0)), 0);
    html += `</ul>
       <strong>Total: R$${total.toFixed(2)}</strong><br>
       <button onclick="imprimirHistorico('${pedidosMesa[0].mesa}', '${pedidosMesa[0].dataHora}')">Imprimir</button>
       </div>`;

  }
  container.innerHTML = html;
}


function imprimirHistorico(mesa, dataHora) {
  const historico = JSON.parse(localStorage.getItem('historico')) || [];
  const pedidosMesa = historico.filter(p => String(p.mesa) === String(mesa) && p.dataHora === dataHora);
  if (pedidosMesa.length === 0) return alert("Pedido não encontrado no histórico.");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [180, 600] // largura/altura ajustada
  });

  doc.setFont('Courier', 'normal');
  let y = 20;
  const total = pedidosMesa.reduce((acc, p) => acc + (Number(p.subtotal) || (Number(p.quantidade) || 0) * (Number(p.valor) || 0)), 0);
  const linhaAltura = 15;

  // Cabeçalho
  doc.setFontSize(12);
  doc.text('Cervejaria Mandela', 10, y); y += linhaAltura;
  doc.text(`Mesa ${mesa}`, 10, y); y += linhaAltura;
  doc.text(dataHora, 10, y); y += linhaAltura;
  doc.text('----------------------------', 10, y); y += linhaAltura;

  // Pedidos
  pedidosMesa.forEach(p => {
    const qtd = Number(p.quantidade) || 0;
    const val = Number(p.valor) || 0;
    const sub = Number(p.subtotal) || qtd * val;

    if (y + linhaAltura > doc.internal.pageSize.height) {
      doc.addPage();
      y = 20;
    }

    doc.text(`${qtd}x ${p.item.padEnd(12)} R$${sub.toFixed(2)}`, 10, y);
    y += linhaAltura;

    if (p.obs) {
      if (y + linhaAltura > doc.internal.pageSize.height) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(10);
      doc.text(`Obs: ${p.obs}`, 10, y);
      y += 12;
      doc.setFontSize(12);
    }
  });

  if (y + linhaAltura > doc.internal.pageSize.height) doc.addPage();
  doc.text('----------------------------', 10, y); y += linhaAltura;
  doc.setFontSize(14);
  doc.text(`TOTAL: R$${total.toFixed(2)}`, 10, y); y += 20;
  doc.setFontSize(12);
  doc.text('Obrigado!', 10, y);

  // Abre PDF
  window.open(doc.output('bloburl'));
}

// Inicializa
window.addEventListener('DOMContentLoaded', renderMesas);


if (document.getElementById("mesasContainer")) {
  renderCaixa()
}
