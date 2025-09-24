// ====== main.js ======

// ===== Login =====
if (document.getElementById("loginForm")) {
  const form = document.getElementById("loginForm");
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const tipo = document.getElementById("tipo").value;

    if (!tipo) {
      alert("Selecione o tipo de login!");
      return;
    }

    sessionStorage.setItem("usuarioLogado", usuario);
    sessionStorage.setItem("tipoLogado", tipo);
    window.location.href = "index.html";
  });
}

// ===== Garçom =====
if (document.querySelector(".garcomdisponivel")) {
  const tipoLogado = sessionStorage.getItem("tipoLogado");
  const statusSpans = document.querySelectorAll(".garcomdisponivel .status");

  if (tipoLogado !== "garcom") {
    statusSpans.forEach(span => {
      span.style.pointerEvents = "none";
      span.style.opacity = "0.4";
      span.title = "Apenas garçons podem alterar o status";
    });
  } else {
    statusSpans.forEach(span => {
      let timer = null;
      span.addEventListener("click", () => {
        if (span.classList.contains("disponivel")) {
          span.className = "status ocupado";
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => {
            span.className = "status disponivel";
            alert(span.parentElement.textContent.trim() + " voltou para disponível após 5 minutos.");
          }, 5 * 60 * 1000);
        } else {
          span.className = "status disponivel";
          if (timer) clearTimeout(timer);
        }
      });
    });
  }
}

// ===== Index =====
const tipoLogado = sessionStorage.getItem("tipoLogado");
if (document.querySelector(".topo")) {
  const usuarioLogado = sessionStorage.getItem("usuarioLogado");
  if (usuarioLogado) {
    console.log("Usuário logado:", usuarioLogado, "Tipo:", tipoLogado);
  }
}

// ===== Funções de permissão =====
function podeAcessarCaixa() {
  return tipoLogado === "garcom" || tipoLogado === "caixa";
}

function podeManipularCaixa() {
  return tipoLogado === "caixa";
}

function podeManipularPedidos() {
  return tipoLogado === "garcom" || tipoLogado === "caixa";
}

// ===== Pedidos =====
const formPedido = document.getElementById('formPedido');

if (formPedido) {
  const listaPedidos = document.createElement("div");
  listaPedidos.id = "listaPedidosGarcom";
  formPedido.parentElement.appendChild(listaPedidos);

  function renderPedidosGarcom() {
    let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    listaPedidos.innerHTML = "";

    pedidos.filter(p => p.status === "em-andamento").forEach((p, index) => {
      const div = document.createElement("div");
      div.classList.add("pedido-lancado");
      div.innerHTML = `
        ${p.nomeCliente} - Mesa ${p.mesa} - ${p.item} x${p.quantidade} - R$${p.valor.toFixed(2)}
        ${p.obs ? `(${p.obs})` : ""}
        ${podeManipularPedidos() ? `
          <button class="editar" data-index="${index}">Editar</button>
          <button class="deletar" data-index="${index}">Deletar</button>
        ` : ""}
      `;
      listaPedidos.appendChild(div);
    });
  }

  renderPedidosGarcom();

  formPedido.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!podeManipularPedidos()) {
      alert("Apenas garçons ou caixas podem lançar pedidos!");
      return;
    }

    const nomeCliente = document.getElementById('nomeCliente').value.trim();
    const mesa = document.getElementById('mesa').value;
    const item = document.getElementById('item').value.trim();
    const quantidade = parseInt(document.getElementById('quantidade').value);
    const valor = parseFloat(document.getElementById('valor').value);
    const obs = document.getElementById('obs').value.trim();

    if (!nomeCliente || !mesa || !item || quantidade <= 0 || valor <= 0) return;

    let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    pedidos.push({
      nomeCliente,
      mesa,
      item,
      quantidade,
      valor,
      obs,
      status: 'em-andamento'
    });

    localStorage.setItem('pedidos', JSON.stringify(pedidos));
    renderPedidosGarcom();
    formPedido.reset();
  });

  listaPedidos.addEventListener("click", (e) => {
    if (!podeManipularPedidos()) {
      alert("Apenas garçons ou caixas podem editar ou deletar pedidos!");
      return;
    }

    const index = Number(e.target.dataset.index);
    let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];

    if (e.target.classList.contains("deletar")) {
      pedidos.splice(index, 1);
    } else if (e.target.classList.contains("editar")) {
      const p = pedidos[index];
      const novoItem = prompt("Item:", p.item) || p.item;
      const novaQtd = parseInt(prompt("Quantidade:", p.quantidade)) || p.quantidade;
      const novoValor = parseFloat(prompt("Valor:", p.valor)) || p.valor;
      const novaObs = prompt("Observações:", p.obs) || p.obs;
      const novoNome = prompt("Nome do cliente:", p.nomeCliente) || p.nomeCliente;

      pedidos[index] = { ...p, item: novoItem, quantidade: novaQtd, valor: novoValor, obs: novaObs, nomeCliente: novoNome };
    }

    localStorage.setItem('pedidos', JSON.stringify(pedidos));
    renderPedidosGarcom();
  });
}

// ===== Caixa =====
function renderCaixa() {
  if (!podeAcessarCaixa()) {
    alert("Apenas garçons ou caixas podem acessar a aba Caixa!");
    return;
  }

  const mesasContainer = document.getElementById('mesasContainer');
  if (!mesasContainer) return;
  mesasContainer.innerHTML = "";

  let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
  const mesas = {};

  pedidos.filter(p => p.status === "em-andamento").forEach(p => {
    if (!mesas[p.mesa]) mesas[p.mesa] = { itens: [], total: 0 };
    const subtotal = p.quantidade * p.valor;
    mesas[p.mesa].itens.push({ ...p, subtotal });
    mesas[p.mesa].total += subtotal;
  });

  for (const mesa in mesas) {
    const card = document.createElement('div');
    card.classList.add('mesa-card');
    card.innerHTML = `
      <h3>Mesa ${mesa}</h3>
      <ul>
        ${mesas[mesa].itens.map(i => `
          <li>
            ${i.nomeCliente} - ${i.item} x${i.quantidade} - R$${i.valor.toFixed(2)}
            = <strong>R$${i.subtotal.toFixed(2)}</strong>
            ${i.obs ? `<em>(${i.obs})</em>` : ""}
            ${podeManipularCaixa() ? `
              <button class="editar" data-index="${pedidos.findIndex(pedido =>
                pedido.mesa === i.mesa &&
                pedido.item === i.item &&
                pedido.quantidade === i.quantidade &&
                pedido.valor === i.valor &&
                pedido.obs === i.obs &&
                pedido.nomeCliente === i.nomeCliente &&
                pedido.status === i.status
              )}">Editar</button>
              <button class="finalizar" data-index="${pedidos.findIndex(pedido =>
                pedido.mesa === i.mesa &&
                pedido.item === i.item &&
                pedido.quantidade === i.quantidade &&
                pedido.valor === i.valor &&
                pedido.obs === i.obs &&
                pedido.nomeCliente === i.nomeCliente &&
                pedido.status === i.status
              )}">Finalizar</button>
              <button class="deletar" data-index="${pedidos.findIndex(pedido =>
                pedido.mesa === i.mesa &&
                pedido.item === i.item &&
                pedido.quantidade === i.quantidade &&
                pedido.valor === i.valor &&
                pedido.obs === i.obs &&
                pedido.nomeCliente === i.nomeCliente &&
                pedido.status === i.status
              )}">Deletar</button>
            ` : ""}
          </li>
        `).join('')}
      </ul>
      <p><strong>Total: R$${mesas[mesa].total.toFixed(2)}</strong></p>
    `;
    mesasContainer.appendChild(card);
  }

  mesasContainer.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    if (!podeManipularCaixa()) {
      alert("Apenas o caixa pode manipular pedidos!");
      return;
    }

    const index = Number(btn.dataset.index);
    let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];

    if (btn.classList.contains("finalizar")) {
      pedidos[index].status = "finalizado";
    } else if (btn.classList.contains("deletar")) {
      pedidos.splice(index, 1);
    } else if (btn.classList.contains("editar")) {
      const p = pedidos[index];
      const novoItem = prompt("Item:", p.item) || p.item;
      const novaQtd = parseInt(prompt("Quantidade:", p.quantidade)) || p.quantidade;
      const novoValor = parseFloat(prompt("Valor:", p.valor)) || p.valor;
      const novaObs = prompt("Observações:", p.obs) || p.obs;
      const novoNome = prompt("Nome do cliente:", p.nomeCliente) || p.nomeCliente;

      pedidos[index] = { ...p, item: novoItem, quantidade: novaQtd, valor: novoValor, obs: novaObs, nomeCliente: novoNome };
    }

    localStorage.setItem('pedidos', JSON.stringify(pedidos));
    renderCaixa();
  });
}

// Atualiza o caixa ao abrir
renderCaixa();

// ===== Historico finalizados =====
const btnFinalizados = document.getElementById('verFinalizados');
const historicoDiv = document.getElementById('historicoFinalizados');

if (btnFinalizados && historicoDiv) {
  btnFinalizados.addEventListener('click', () => {
    let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    const finalizados = pedidos.filter(p => p.status === 'finalizado');

    if (finalizados.length === 0) {
      historicoDiv.innerHTML = "<p>Nenhum pedido finalizado.</p>";
      return;
    }

    let totalFinalizados = 0;

    historicoDiv.innerHTML = finalizados.map(p => {
      const subtotal = p.quantidade * p.valor;
      totalFinalizados += subtotal;
      return `
        <div class="mesa-card">
          ${p.nomeCliente} - Mesa ${p.mesa} - ${p.item} x${p.quantidade} - R$${p.valor.toFixed(2)}
          = <strong>R$${subtotal.toFixed(2)}</strong>
          ${p.obs ? `(${p.obs})` : ""}
        </div>
      `;
    }).join('');

    historicoDiv.innerHTML += `<p><strong>Total Finalizados: R$${totalFinalizados.toFixed(2)}</strong></p>`;
  });
}
