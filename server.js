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

// ===== Usuários =====
app.get("/usuarios", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM usuarios");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar usuários" });
    }
});

app.post("/usuarios", async (req, res) => {
    const { usuario, senha, tipo } = req.body;
    try {
        await pool.query(
            "INSERT INTO usuarios (usuario, senha, tipo) VALUES ($1, $2, $3)",
            [usuario, senha, tipo]
        );
        res.json({ message: "Usuário cadastrado com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao cadastrar usuário" });
    }
});

// ===== Pedidos =====
app.get("/pedidos", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM pedidos ORDER BY mesa");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar pedidos" });
    }
});

app.post("/pedidos", async (req, res) => {
    const { mesa, item, quantidade, valor, obs } = req.body;
    const subtotal = quantidade * valor;
    try {
        await pool.query(
            "INSERT INTO pedidos (mesa, item, quantidade, valor, subtotal, obs, status) VALUES ($1,$2,$3,$4,$5,$6,'em-andamento')",
            [mesa, item, quantidade, valor, subtotal, obs || ""]
        );
        res.json({ message: "Pedido registrado com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao registrar pedido" });
    }
});

// ===== Excluir todos os pedidos de uma mesa =====
app.delete("/pedidos/mesa/:mesa", async (req, res) => {
    const { mesa } = req.params;
    try {
        await pool.query("DELETE FROM pedidos WHERE mesa = $1", [mesa]);
        res.json({ message: `Pedidos da mesa ${mesa} removidos com sucesso!` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao remover pedidos da mesa" });
    }
});

// ===== Histórico =====
app.get("/historico", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM historico ORDER BY dataHora DESC");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar histórico" });
    }
});

app.post("/historico", async (req, res) => {
    const { mesa, pedidos, dataHora } = req.body;
    try {
        for (const p of pedidos) {
            await pool.query(
                "INSERT INTO historico (mesa, item, quantidade, valor, subtotal, obs, dataHora) VALUES ($1,$2,$3,$4,$5,$6,$7)",
                [mesa, p.item, p.quantidade, p.valor, p.subtotal, p.obs || "", dataHora]
            );
        }
        res.json({ message: "Histórico salvo com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao salvar histórico" });
    }
});

// =============================================

// Porta
app.listen(3000, () => {
    console.log("API rodando em http://localhost:3000");
});
