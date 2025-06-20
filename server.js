require('dotenv').config(); 
const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = 3000;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

pool.connect((err, client, release) => {
    if (err) {
        return console.error('Erro ao adquirir cliente do pool de conexão', err.stack);
    }
    client.query('SELECT NOW()', (err, result) => {
        release(); 
        if (err) {
            return console.error('Erro ao executar consulta de teste', err.stack);
        }
        console.log('Conectado ao banco de dados PostgreSQL:', result.rows[0].now);
    });
});

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'htmls', 'index.html'));
});

app.get('/api/chargers', async (req, res) => {
    try {
        const chargers = [
            { id: 'boxA', totem: 'A', status: 'carregando', details: { min: 102, kw: 39, multa: 0.00, total: 113.10 } },
            { id: 'boxB', totem: 'B', status: 'disponivel', details: null }, 
            { id: 'boxC', totem: 'C', status: 'carregado', details: { min: 150, kw: 54, multa: 15.00, total: 156.60 } },
        ];
        res.json(chargers);
    } catch (error) {
        console.error('Erro ao buscar status dos carregadores:', error.message);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar carregadores.' });
    }
});

app.post('/api/client', async (req, res) => {
    const { cpf, telefone, totem } = req.body; 

    if (!cpf || cpf.length !== 11) {
        return res.status(400).json({ error: 'CPF inválido. Deve conter 11 dígitos.' });
    }

    if (!totem) {
        return res.status(400).json({ error: 'Totem não selecionado.' });
    }

    try {
        let clientId;
        const clientResult = await pool.query('SELECT id_cliente FROM cliente WHERE cpf = $1', [cpf]);

        if (clientResult.rows.length > 0) {
            clientId = clientResult.rows[0].id_cliente;
            if (telefone && telefone.length === 11) {
                await pool.query('UPDATE cliente SET telefone = $1, totem = $2 WHERE id_cliente = $3', [telefone, totem, clientId]);
                console.log(`Cliente existente (ID: ${clientId}) atualizado com totem ${totem} e telefone.`);
            } else {
                 await pool.query('UPDATE cliente SET totem = $1 WHERE id_cliente = $2', [totem, clientId]);
                 console.log(`Totem do cliente existente (ID: ${clientId}) atualizado para ${totem}.`);
            }
        } else {
            const insertResult = await pool.query(
                'INSERT INTO cliente (cpf, telefone, totem) VALUES ($1, $2, $3) RETURNING id_cliente',
                [cpf, telefone || 'Aguardando', totem]
            );
            clientId = insertResult.rows[0].id_cliente;
            console.log(`Novo cliente criado com ID: ${clientId} e totem ${totem}.`);
        }
        res.status(200).json({ message: 'Dados do cliente processados com sucesso.', clientId: clientId });

    } catch (error) {
        console.error('Erro ao processar cliente:', error.message);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'CPF já cadastrado.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor ao processar cliente.' });
    }
});


app.post('/api/recharge/start', async (req, res) => {
    const { clientId, energiaKw, custoKw, totem } = req.body;

    if (!clientId || !energiaKw || !custoKw || !totem) {
        return res.status(400).json({ error: 'Parâmetros de recarga incompletos.' });
    }

    const horaInicio = new Date();
    const valorRecarga = parseFloat(energiaKw) * parseFloat(custoKw);
    const valorTotal = valorRecarga; 

    try {
        const insertRechargeQuery = `
            INSERT INTO recarga (
                cliente_id, energia_kw, custo_kw, hora_inicio, hora_fim, valor_recarga, valor_total, multa_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id_recarga;
        `;

        const result = await pool.query(insertRechargeQuery, [
            clientId,
            energiaKw,
            custoKw,
            horaInicio,
            horaInicio, 
            valorRecarga,
            valorTotal,
            null 
        ]);

        const rechargeId = result.rows[0].id_recarga;

        console.log(`Recarga iniciada para cliente ${clientId}, ID da Recarga: ${rechargeId}`);

        res.status(201).json({ message: 'Recarga iniciada com sucesso!', rechargeId: rechargeId });

    } catch (error) {
        console.error('Erro ao iniciar recarga:', error.message);
        res.status(500).json({ error: 'Erro interno do servidor ao iniciar recarga.' });
    }
});

app.post('/api/payment', async (req, res) => {
    const { rechargeId, nomeCartao, numeroCartao, validadeCartao, codSeguranca, metodoPag, senhaCartao } = req.body;

    if (!rechargeId || !nomeCartao || !numeroCartao || !validadeCartao || !codSeguranca || !metodoPag || !senhaCartao) {
        return res.status(400).json({ error: 'Parâmetros de pagamento incompletos.' });
    }

    const simulatedPaymentSuccess = true; 
    const simulatedTransactionCode = 'TRANS-' + Date.now().toString() + Math.random().toString(36).substring(2, 8).toUpperCase();

    if (!simulatedPaymentSuccess) {
        return res.status(400).json({ error: 'Pagamento recusado pela operadora do cartão.' });
    }

    try {
        const insertTransactionQuery = `
            INSERT INTO transacao (
                recarga_id, nome_cartao, numero_cartao, validade_cartao, cod_segurança, metodo_pag, cod_transacao
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id_transacao;
        `;
        const result = await pool.query(insertTransactionQuery, [
            rechargeId,
            nomeCartao,
            numeroCartao, 
            validadeCartao, 
            codSeguranca,   
            metodoPag,
            simulatedTransactionCode
        ]);

        const transactionId = result.rows[0].id_transacao;
        console.log(`Pagamento processado e transação registrada (ID: ${transactionId}).`);

        res.status(200).json({
            message: 'Pagamento processado com sucesso!',
            transactionId: transactionId,
            codTransacao: simulatedTransactionCode
        });

    } catch (error) {
        console.error('Erro ao processar pagamento:', error.message);
        res.status(500).json({ error: 'Erro interno do servidor ao processar pagamento.' });
    }
});

app.get('/api/recharge/:rechargeId', async (req, res) => {
    const { rechargeId } = req.params;
    try {
        const query = `
            SELECT
                r.energia_kw,
                EXTRACT(EPOCH FROM (NOW() - r.hora_inicio))/60 AS duracao_minutos,
                COALESCE(m.valor_multa, 0) AS valor_multa,
                r.valor_total
            FROM
                recarga r
            LEFT JOIN
                multa m ON r.multa_id = m.id_multa
            WHERE
                r.id_recarga = $1;
        `;
        const result = await pool.query(query, [rechargeId]);

        if (result.rows.length > 0) {
            const data = result.rows[0];
            res.json({
                min: Math.round(data.duracao_minutos),
                kw: data.energia_kw,
                multa: parseFloat(data.valor_multa).toFixed(2),
                total: parseFloat(data.valor_total).toFixed(2)
            });
        } else {
            res.status(404).json({ message: 'Recarga não encontrada.' });
        }
    } catch (error) {
        console.error('Erro ao buscar detalhes da recarga:', error.message);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar detalhes da recarga.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
    console.log(`Servindo arquivos estáticos de: ${path.join(__dirname, 'public')}`);
});
