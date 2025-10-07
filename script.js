// ====== main.js ======

// ===== Login Automático Padrão (Cliente Visitante) =====
if (!sessionStorage.getItem("usuarioLogado")) {
  sessionStorage.setItem("usuarioLogado", "Visitante");
  sessionStorage.setItem("tipoLogado", "cliente");
}

// ===== Login =====
if (document.getElementById("loginForm")) {
  const form = document.getElementById("loginForm");
  form.addEventListener("submit", async (e) => { // <<< async aqui
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
    try {
      const response = await fetch("https://cervejaria-sk59.onrender.com/usuarios");
      const usuarios = await response.json();
      const user = usuarios.find(
        (u) => u.usuario === usuario && u.senha === senha && u.tipo === tipo
      );

      if (!user) {
        alert("Usuário ou senha incorretos!");
        return;
      }

      sessionStorage.setItem("usuarioLogado", user.usuario);
      sessionStorage.setItem("tipoLogado", user.tipo);
      window.location.href = "index.html";
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com o servidor.");
    }
  });
}

// ===== Cadastro de Usuário =====
async function cadastrarUsuario() { // <<< async aqui
  const logado = sessionStorage.getItem("tipoLogado");
  if (logado !== "admin") {
    alert("Apenas administradores podem cadastrar usuários!");
    return;
  }

  const novoUsuario = prompt("Digite o nome de usuário:");
  const novaSenha = prompt("Digite a senha:");
  const opcao = confirm("Clique em OK para cadastrar como GARÇOM.\nClique em CANCELAR para cadastrar como CAIXA.");
  const novoTipo = opcao ? "garcom" : "caixa";

  if (!novoUsuario || !novaSenha) {
    alert("Todos os campos são obrigatórios!");
    return;
  }

  try {
    await fetch("https://cervejaria-sk59.onrender.com/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario: novoUsuario, senha: novaSenha, tipo: novoTipo })
    });
    alert(`Usuário ${novoUsuario} (${novoTipo.toUpperCase()}) cadastrado com sucesso!`);
  } catch (err) {
    console.error(err);
    alert("Erro ao cadastrar usuário.");
  }
}

// ===== Exibe usuário logado =====
const usuarioLogadoElement = document.getElementById("usuarioLogado");
if (usuarioLogadoElement) {
  const usuario = sessionStorage.getItem("usuarioLogado");
  const tipo = sessionStorage.getItem("tipoLogado");

  if (usuario && tipo) {
    usuarioLogadoElement.textContent = " " + tipo.toUpperCase() + " Logado: " + usuario;
  } else {
    usuarioLogadoElement.textContent = "Nenhum usuário logado";
  }
}


// ===== Garçom - Controle de Status (VERSÃO LIMPA) =====
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.querySelector(".garcomdisponivel")
  if (!container) return

  console.log("🔧 Inicializando tela de garçons...")

  const tipoLogado = (sessionStorage.getItem("tipoLogado") || "").toLowerCase()
  const statusGarcons = JSON.parse(localStorage.getItem("statusGarcons")) || {}

  // ===== BUSCA USUÁRIOS DO BANCO =====
  let usuarios = []
  try {
    const response = await fetch("https://cervejaria-sk59.onrender.com/usuarios")
    usuarios = await response.json()
  } catch (err) {
    console.error("Erro ao buscar usuários:", err)
  }

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

// Renderiza pedidos de uma mesa (buscando do servidor)
async function renderMesa(numeroMesa) {
  const container = document.getElementById("pedidosMesa");
  if (!container) return;

  try {
    // Busca todos os pedidos do servidor
    const response = await fetch("https://cervejaria-sk59.onrender.com/pedidos");
    if (!response.ok) throw new Error("Erro ao buscar pedidos do servidor");
    const pedidos = await response.json();

    // Filtra apenas os pedidos da mesa selecionada
    const pedidosMesa = pedidos.filter(p => String(p.mesa) === String(numeroMesa));

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
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Erro ao carregar pedidos.</p>";
  }
}


// ===== Pedidos =====
const formPedido = document.getElementById("formPedido")
if (formPedido) {
  formPedido.addEventListener("submit", async (e) => {
    e.preventDefault()

    const mesa = document.getElementById("mesa").value
    const item = document.getElementById("item").value
    const quantidade = Number.parseInt(document.getElementById("quantidade").value)
    const valor = Number.parseFloat(document.getElementById("valor").value)
    const obs = document.getElementById("obs").value
    const subtotal = quantidade * valor

    const pedido = { mesa, item, quantidade, valor, subtotal, obs } // status removido

    try {
      const response = await fetch("https://cervejaria-sk59.onrender.com/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pedido)
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar pedido")
      }

      alert(`Pedido da mesa ${mesa} adicionado com sucesso!`)
      formPedido.reset()
    } catch (err) {
      console.error(err)
      alert("❌ Falha ao enviar o pedido para o servidor.")
    }
  })
}

// ===== Caixa =====
async function renderCaixa() {
  const mesasContainer = document.getElementById("mesasContainer")
  if (!mesasContainer) return

  mesasContainer.innerHTML = ""

  // Pega os pedidos do backend
  let pedidos = []
  try {
    const res = await fetch("https://cervejaria-sk59.onrender.com/pedidos")
    pedidos = await res.json()
  } catch (err) {
    console.error("Erro ao buscar pedidos:", err)
    pedidos = [] // fallback
  }

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

let mesaAtual = null


// ===== API helper =====
async function getPedidos() {
  try {
    const res = await fetch("https://cervejaria-sk59.onrender.com/pedidos");
    return await res.json();
  } catch (err) {
    console.error("Erro ao buscar pedidos:", err);
    return [];
  }
}

async function deletePedido(id) {
  try {
    await fetch(`https://cervejaria-sk59.onrender.com/pedidos/${id}`, { method: 'DELETE' });
  } catch (err) {
    console.error("Erro ao deletar pedido:", err);
  }
}

async function salvarHistorico(mesa, pedidos) {
  try {
    await fetch("https://cervejaria-sk59.onrender.com/historico", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mesa, pedidos, dataHora: new Date().toISOString() })
    });
  } catch (err) {
    console.error("Erro ao salvar histórico:", err);
  }
}

// ===== Renderiza todas as mesas =====
async function renderMesas() {
  const container = document.getElementById('mesasContainer');
  if (!container) return;

  const pedidos = await getPedidos();
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

// ===== Modal da mesa =====
async function abrirModalMesa(mesaNum) {
  mesaAtual = mesaNum;
  const modal = document.getElementById('modalOverlay');
  const titulo = document.getElementById('modalTitulo');
  const lista = document.getElementById('modalPedidos');

  titulo.textContent = `Pedidos Mesa ${mesaNum}`;
  const pedidos = await getPedidos();
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
      li.innerHTML = `
        ${qtd}x ${p.item || 'Item não informado'} - R$${val.toFixed(2)} = R$${sub.toFixed(2)}
        ${p.obs ? ` (${p.obs})` : ''}
        <button class="cancelar" onclick="cancelarPedidoModal('${p.id}')">Cancelar</button>
      `;
      lista.appendChild(li);
    });
  }

  modal.style.display = 'flex';
}

// ===== Fechar modal =====
function fecharModal() {
  mesaAtual = null;
  document.getElementById('modalOverlay').style.display = 'none';
}

// ===== Cancelar pedido individual =====
async function cancelarPedidoModal(pedidoId) {
  if (!mesaAtual) return;
  if (!confirm("Deseja cancelar este pedido?")) return;

  await deletePedido(pedidoId);
  await abrirModalMesa(mesaAtual);
  await renderMesas();
}

// ===== Cancelar toda a mesa =====
async function cancelarMesaModal() {
  if (!mesaAtual) return;
  if (!confirm(`Deseja cancelar todos os pedidos da mesa ${mesaAtual}?`)) return;

  const pedidos = await getPedidos();
  const mesaPedidos = pedidos.filter(p => String(p.mesa) === String(mesaAtual));

  for (const p of mesaPedidos) {
    await deletePedido(p.id);
  }

  fecharModal();
  await renderMesas();
}

// ===== Fechar mesa e gerar PDF =====
async function fecharMesaModal() {
  if (!mesaAtual) return;

  const pedidos = await getPedidos();
  const mesaPedidos = pedidos.filter(p => String(p.mesa) === String(mesaAtual));

  if (mesaPedidos.length === 0) {
    return alert('Não há pedidos nesta mesa.');
  }

  // Usa ISO string para salvar
  const dataHora = new Date().toISOString().slice(0,19); // YYYY-MM-DDTHH:MM:SS

  // ===== Salva histórico no backend =====
  try {
    await fetch("https://cervejaria-sk59.onrender.com/historico", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mesa: mesaAtual, pedidos: mesaPedidos, dataHora })
    });
  } catch (err) {
    console.error("Erro ao salvar histórico:", err);
    return;
  }

  // ===== Deleta pedidos ativos no backend =====
  try {
    await Promise.all(mesaPedidos.map(p => deletePedido(p.id)));
  } catch (err) {
    console.error("Erro ao deletar pedidos:", err);
  }

  // ===== Gera PDF =====
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [163, 300]
  });

  doc.setFont('Courier', 'normal');
  let y = 20;
  const linhaAltura = 14;

  // Cabeçalho
  doc.setFontSize(12);
  doc.text('Cervejaria Mandela', 81, y, { align: 'center' }); y += linhaAltura;
  doc.setFontSize(10);
  doc.text(`Mesa ${mesaAtual}`, 81, y, { align: 'center' }); y += linhaAltura;
  doc.text(new Date(dataHora).toLocaleString(), 81, y, { align: 'center' }); y += linhaAltura;
  doc.text('-------------------------------', 81, y, { align: 'center' }); y += linhaAltura;

  // Títulos da tabela
  doc.setFontSize(10);
  doc.text("Qtd", 10, y);
  doc.text("Item", 40, y);
  doc.text("Subtotal", 150, y, { align: 'right' });
  y += linhaAltura;
  doc.text('-------------------------------', 81, y, { align: 'center' }); y += linhaAltura;

  // Pedidos
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
    doc.text(p.item.substring(0, 12), 40, y); // Item
    doc.text(`R$${sub.toFixed(2)}`, 150, y, { align: 'right' }); // Subtotal
    y += linhaAltura;

    if (p.obs) {
      doc.setFontSize(8);
      doc.text(`Obs: ${p.obs}`, 40, y);
      doc.setFontSize(10);
      y += 10;
    }
  });

  // Total
  const total = mesaPedidos.reduce((acc, p) => {
    const qtd = Number(p.quantidade) || 0;
    const val = Number(p.valor) || 0;
    const sub = Number(p.subtotal) || qtd * val;
    return acc + sub;
  }, 0);

  doc.text('-------------------------------', 81, y, { align: 'center' }); y += linhaAltura;
  doc.setFontSize(12);
  doc.text(`TOTAL: R$${total.toFixed(2)}`, 150, y, { align: 'right' }); y += linhaAltura * 2;

  // Rodapé
  doc.setFontSize(10);
  doc.text('Obrigado pela preferência!', 81, y, { align: 'center' }); y += linhaAltura;
  doc.text('Volte Sempre!', 81, y);

  // Abre PDF
  window.open(doc.output('bloburl'));

  // Atualiza frontend
  fecharModal();
  await renderMesas();
}

// ===== Histórico =====
async function mostrarHistorico() {
  const container = document.getElementById("historicoContainer");
  if (!container) return;

  if (container.style.display === "block") {
    // Esconde se já estiver visível
    container.style.display = "none";
    return;
  }

  // Mostra o container
  container.style.display = "block";

  try {
    // Busca histórico do backend
    const res = await fetch("https://cervejaria-sk59.onrender.com/historico");
    const historico = await res.json();

    if (historico.length === 0) {
      container.innerHTML = '<p>Nenhum histórico.</p>';
      return;
    }

    // Agrupa por mesa + dataHora
    const mesas = {};
    historico.forEach(p => {
      const chave = `Mesa ${p.mesa} - ${p.datahora}`;
      if (!mesas[chave]) mesas[chave] = [];
      mesas[chave].push(p);
    });

    let html = '';
    for (const chave in mesas) {
      const pedidosMesa = mesas[chave];

      // Formata data para exibição
      const dataExibicao = new Date(pedidosMesa[0].datahora).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
      });

      html += `<div class="mesa">
        <h3>Mesa ${pedidosMesa[0].mesa} - ${dataExibicao}</h3>
        <ul>`;
      pedidosMesa.forEach(p => {
        const qtd = Number(p.quantidade) || 0;
        const val = Number(p.valor) || 0;
        const sub = Number(p.subtotal) || qtd * val;
        html += `<li>${qtd}x ${p.item || 'Item não informado'} - R$${val.toFixed(2)} = R$${sub.toFixed(2)}${p.obs ? ` (${p.obs})` : ''}</li>`;
      });
      const total = pedidosMesa.reduce((s, p) => s + (Number(p.subtotal) || (Number(p.quantidade) || 0) * (Number(p.valor) || 0)), 0);

      html += `</ul>
        <strong>Total: R$${total.toFixed(2)}</strong><br>
        <button onclick="imprimirHistorico('${pedidosMesa[0].mesa}', '${pedidosMesa[0].datahora}')">Imprimir</button>
      </div>`;
    }

    container.innerHTML = html;
  } catch (err) {
    console.error("Erro ao carregar histórico:", err);
    container.innerHTML = '<p>Falha ao carregar histórico do servidor.</p>';
  }
}

// ===== Imprimir Histórico =====
async function imprimirHistorico(mesa, dataHora) {
  try {
    const res = await fetch("https://cervejaria-sk59.onrender.com/historico");
    const historico = await res.json();

    // Filtra pelo mesmo valor ISO string (sem milissegundos)
    const pedidosMesa = historico.filter(
      p => String(p.mesa) === String(mesa) && p.datahora.slice(0,19) === dataHora.slice(0,19)
    );

    if (pedidosMesa.length === 0) return alert("Pedido não encontrado no histórico.");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [180, 600]
    });

    doc.setFont('Courier', 'normal');
    let y = 20;
    const linhaAltura = 15;

    // Cabeçalho
    doc.setFontSize(12);
    doc.text('Cervejaria Mandela', 10, y); y += linhaAltura;
    doc.text(`Mesa ${mesa}`, 10, y); y += linhaAltura;
    doc.text(new Date(dataHora).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short"
    }), 10, y);
    y += linhaAltura;
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

    // Total
    const total = pedidosMesa.reduce((acc, p) => {
      const qtd = Number(p.quantidade) || 0;
      const val = Number(p.valor) || 0;
      const sub = Number(p.subtotal) || qtd * val;
      return acc + sub;
    }, 0);

    if (y + linhaAltura > doc.internal.pageSize.height) doc.addPage();
    doc.text('----------------------------', 10, y); y += linhaAltura;
    doc.setFontSize(14);
    doc.text(`TOTAL: R$${total.toFixed(2)}`, 10, y); y += 20;
    doc.setFontSize(12);
    doc.text('Obrigado!', 10, y);

    window.open(doc.output('bloburl'));
  } catch (err) {
    console.error("Erro ao gerar PDF do histórico:", err);
    alert("❌ Falha ao gerar PDF do histórico.");
  }
}

// Inicializa histórico
window.addEventListener('DOMContentLoaded', () => {
  renderMesas();
  // mostrarHistorico();
});
















