import express from "express";
import cors from "cors";
import pkg from "pg";

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

// 🔗 Conexão com Neon (use sua string da Neon aqui)
const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_9DYzevsx5SJa@ep-misty-heart-ad7qxgnh-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
});

// =================== ROTAS ===================

// Usuários
app.get("/usuarios", async (req, res) => {
  const result = await pool.query("SELECT * FROM usuarios");
  res.json(result.rows);
});

app.post("/usuarios", async (req, res) => {
  const { usuario, senha, tipo } = req.body;
  await pool.query("INSERT INTO usuarios (usuario, senha, tipo) VALUES ($1, $2, $3)", [usuario, senha, tipo]);
  res.json({ message: "Usuário cadastrado com sucesso!" });
});

// Pedidos
app.get("/pedidos", async (req, res) => {
  const result = await pool.query("SELECT * FROM pedidos");
  res.json(result.rows);
});

app.post("/pedidos", async (req, res) => {
  const { mesa, item, quantidade, valor, obs } = req.body;
  const subtotal = quantidade * valor;
  await pool.query(
    "INSERT INTO pedidos (mesa, item, quantidade, valor, subtotal, obs, status) VALUES ($1,$2,$3,$4,$5,$6,'em-andamento')",
    [mesa, item, quantidade, valor, subtotal, obs]
  );
  res.json({ message: "Pedido registrado com sucesso!" });
});

// Histórico
app.get("/historico", async (req, res) => {
  const result = await pool.query("SELECT * FROM historico");
  res.json(result.rows);
});

app.post("/historico", async (req, res) => {
  const { mesa, pedidos, dataHora } = req.body;
  for (const p of pedidos) {
    await pool.query(
      "INSERT INTO historico (mesa, item, quantidade, valor, subtotal, obs, dataHora) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [mesa, p.item, p.quantidade, p.valor, p.subtotal, p.obs, dataHora]
    );
  }
  res.json({ message: "Histórico salvo!" });
});

// =============================================

app.listen(3000, () => {
  console.log("API rodando em http://localhost:3000");
});
