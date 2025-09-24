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

    // Grava sessão do usuário logado
    sessionStorage.setItem("usuarioLogado", usuario);
    sessionStorage.setItem("tipoLogado", tipo);

    // Redireciona para a tela inicial
    window.location.href = "index.html";
  });
}

// ===== Garçom =====
if (document.querySelector(".garcomdisponivel")) {
  const tipoLogado = sessionStorage.getItem("tipoLogado");
  const statusSpans = document.querySelectorAll(".garcomdisponivel .status");

  if (tipoLogado !== "garcom") {
    // Bloqueia interação para não garçons
    statusSpans.forEach(span => {
      span.style.pointerEvents = "none"; // não permite clicar
      span.style.opacity = "0.4";        // visual "desativado"
      span.title = "Apenas garçons podem alterar o status"; // dica
    });
  } else {
    // Garçom pode alterar status
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
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
        }
      });
    });
  }
}

// ===== Index =====
if (document.querySelector(".topo")) {
  const usuarioLogado = sessionStorage.getItem("usuarioLogado");
  const tipoLogado = sessionStorage.getItem("tipoLogado");

  if (usuarioLogado) {
    console.log("Usuário logado:", usuarioLogado, "Tipo:", tipoLogado);
    // Aqui você pode personalizar links ou liberar funcionalidades dependendo do tipo de login
  }
}


// ===== Pedidos =====

const formPedido = document.getElementById('formPedido');

if (formPedido) {
  formPedido.addEventListener('submit', (e) => {
    e.preventDefault();

    const mesa = document.getElementById('mesa').value;
    const item = document.getElementById('item').value;
    const quantidade = parseInt(document.getElementById('quantidade').value);
    const valor = parseFloat(document.getElementById('valor').value);
    const obs = document.getElementById('obs').value;

    const subtotal = quantidade * valor;

    const pedido = {
      mesa,
      item,
      quantidade,
      valor,
      subtotal,
      obs,
      status: 'em-andamento'
    };

    // 🔹 Salva no localStorage
    let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    pedidos.push(pedido);
    localStorage.setItem('pedidos', JSON.stringify(pedidos));

    console.log("Pedido lançado e salvo:", pedido);
    alert(`Pedido da mesa ${mesa} adicionado com sucesso!`);

    formPedido.reset();
  });
}

// ===== Caixa =====

function renderCaixa() {
  const mesasContainer = document.getElementById('mesasContainer');
  mesasContainer.innerHTML = "";

  let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];

  // Agrupa por mesa
  const mesas = {};
  pedidos.forEach(p => {
    if (!mesas[p.mesa]) {
      mesas[p.mesa] = { itens: [], total: 0 };
    }

    // garante que subtotal sempre existe
    const quantidade = Number(p.quantidade) || 0;
    const valor = Number(p.valor) || 0;
    const subtotal = quantidade * valor;

    mesas[p.mesa].itens.push({
      ...p,
      subtotal
    });
    mesas[p.mesa].total += subtotal;
  });

  // Cria cards
  for (const mesa in mesas) {
    const card = document.createElement('div');
    card.classList.add('mesa-card');

    card.innerHTML = `
      <h3>Mesa ${mesa}</h3>
      <ul>
        ${mesas[mesa].itens.map(i => `
          <li>
            ${i.item} ${i.quantidade}x - R$${i.valor}
            = <strong>R$${i.subtotal.toFixed(2)}</strong>
            ${i.obs ? `<em>(${i.obs})</em>` : ""}
          </li>
        `).join('')}
      </ul>
      <p><strong>Total: R$${mesas[mesa].total.toFixed(2)}</strong></p>
    `;

    mesasContainer.appendChild(card);
  }
}

// Atualiza ao abrir a tela
renderCaixa();
