// index.js - API ajustada para pasta notifications
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Base path para todas as rotas
const BASE_PATH = '/notifications';

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'br808.hostgator.com.br',
  user: process.env.DB_USER || 'dispon40_spxhubs',
  password: process.env.DB_PASSWORD || 'Lucas0909@',
  database: process.env.DB_NAME || 'dispon40_flex_hubs',
  port: process.env.DB_PORT || 3306
};

// Função para conectar ao banco de dados
async function connectDB() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Conexão com o banco de dados estabelecida');
    return connection;
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    throw error;
  }
}

// Rota para obter todas as notificações (incluindo entrance_id)
app.get(`${BASE_PATH}/api/notifications`, async (req, res) => {
  let connection;
  
  try {
    connection = await connectDB();
    const [rows] = await connection.execute(`
      SELECT id, name, phone_number, message, status, entrance_id, sent_date, created_at 
      FROM notifications 
      ORDER BY created_at DESC
    `);
    
    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar notificações',
      error: error.message
    });
  } finally {
    if (connection) {
      connection.end();
    }
  }
});

// Rota para obter notificações com informações da entrada
app.get(`${BASE_PATH}/api/notifications/with-entrance`, async (req, res) => {
  let connection;
  
  try {
    connection = await connectDB();
    const [rows] = await connection.execute(`
      SELECT 
        n.id, n.name, n.phone_number, n.message, n.status, n.entrance_id, n.sent_date, n.created_at,
        e.id as flex_id, e.tipo, e.janela, e.cpf, e.placa, e.nome as motorista_nome, 
        e.status as entrance_status, e.mobile_id, e.latitude, e.longitude, e.localizacao, e.doca
      FROM notifications n
      LEFT JOIN flex_entrance e ON n.entrance_id = e.id
      ORDER BY n.created_at DESC
    `);
    
    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Erro ao buscar notificações com entradas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar notificações com entradas',
      error: error.message
    });
  } finally {
    if (connection) {
      connection.end();
    }
  }
});

// Rota para obter uma notificação específica pelo ID
app.get(`${BASE_PATH}/api/notifications/:id`, async (req, res) => {
  let connection;
  
  try {
    connection = await connectDB();
    const [rows] = await connection.execute(
      'SELECT * FROM notifications WHERE id = ?', 
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }
    
    res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Erro ao buscar notificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar notificação',
      error: error.message
    });
  } finally {
    if (connection) {
      connection.end();
    }
  }
});

// Rota para obter notificações por entrance_id
app.get(`${BASE_PATH}/api/notifications/entrance/:entranceId`, async (req, res) => {
  let connection;
  
  try {
    connection = await connectDB();
    const [rows] = await connection.execute(
      'SELECT * FROM notifications WHERE entrance_id = ? ORDER BY created_at DESC', 
      [req.params.entranceId]
    );
    
    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Erro ao buscar notificações por entrance_id:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar notificações por entrance_id',
      error: error.message
    });
  } finally {
    if (connection) {
      connection.end();
    }
  }
});

// Rota para obter todas as entradas (flex_entrance)
app.get(`${BASE_PATH}/api/entrance`, async (req, res) => {
  let connection;
  
  try {
    connection = await connectDB();
    const [rows] = await connection.execute(`
      SELECT * FROM flex_entrance 
      ORDER BY timestamp DESC
    `);
    
    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Erro ao buscar entradas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar entradas',
      error: error.message
    });
  } finally {
    if (connection) {
      connection.end();
    }
  }
});

// Rota para obter uma entrada específica pelo ID
app.get(`${BASE_PATH}/api/entrance/:id`, async (req, res) => {
  let connection;
  
  try {
    connection = await connectDB();
    const [rows] = await connection.execute(
      'SELECT * FROM flex_entrance WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Entrada não encontrada'
      });
    }
    
    res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Erro ao buscar entrada:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar entrada',
      error: error.message
    });
  } finally {
    if (connection) {
      connection.end();
    }
  }
});

// Rota para atualizar o status de uma notificação
app.put(`${BASE_PATH}/api/notifications/:id/status`, async (req, res) => {
  let connection;
  
  try {
    const { status, sent_date } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status é obrigatório'
      });
    }
    
    connection = await connectDB();
    
    let query = 'UPDATE notifications SET status = ?';
    let params = [status];
    
    if (sent_date) {
      query += ', sent_date = ?';
      params.push(sent_date);
    }
    
    query += ' WHERE id = ?';
    params.push(req.params.id);
    
    const [result] = await connection.execute(query, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Status da notificação atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar status da notificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status da notificação',
      error: error.message
    });
  } finally {
    if (connection) {
      connection.end();
    }
  }
});

// Rota para status da API
app.get(`${BASE_PATH}/api/status`, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API funcionando normalmente',
    timestamp: new Date().toISOString(),
    version: '1.1.0'
  });
});

// Rota raiz com documentação
app.get(`${BASE_PATH}`, (req, res) => {
  res.send(`
    <html>
      <head>
        <title>API de Notificações</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #EE4D2D; }
          .endpoint { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 15px; }
          .endpoint h3 { margin-top: 0; }
          code { background: #e0e0e0; padding: 2px 4px; border-radius: 3px; }
          .method { font-weight: bold; display: inline-block; width: 60px; }
          .url { color: #2D6EEE; }
          .description { margin: 10px 0; }
        </style>
      </head>
      <body>
        <h1>API de Notificações Shopee</h1>
        <p>Esta API fornece acesso às notificações e entradas do sistema.</p>
        
        <h2>Endpoints disponíveis:</h2>
        
        <div class="endpoint">
          <h3><span class="method">GET</span> <span class="url">${BASE_PATH}/api/notifications</span></h3>
          <div class="description">Retorna todas as notificações do sistema, incluindo o entrance_id.</div>
        </div>
        
        <div class="endpoint">
          <h3><span class="method">GET</span> <span class="url">${BASE_PATH}/api/notifications/with-entrance</span></h3>
          <div class="description">Retorna todas as notificações com dados relacionados à entrada, como tipo, janela, etc.</div>
        </div>
        
        <div class="endpoint">
          <h3><span class="method">GET</span> <span class="url">${BASE_PATH}/api/notifications/:id</span></h3>
          <div class="description">Retorna uma notificação específica pelo ID.</div>
        </div>
        
        <div class="endpoint">
          <h3><span class="method">GET</span> <span class="url">${BASE_PATH}/api/notifications/entrance/:entranceId</span></h3>
          <div class="description">Retorna todas as notificações relacionadas a uma entrada específica.</div>
        </div>
        
        <div class="endpoint">
          <h3><span class="method">GET</span> <span class="url">${BASE_PATH}/api/entrance</span></h3>
          <div class="description">Retorna todas as entradas registradas no sistema.</div>
        </div>
        
        <div class="endpoint">
          <h3><span class="method">GET</span> <span class="url">${BASE_PATH}/api/entrance/:id</span></h3>
          <div class="description">Retorna informações detalhadas de uma entrada específica.</div>
        </div>
        
        <div class="endpoint">
          <h3><span class="method">PUT</span> <span class="url">${BASE_PATH}/api/notifications/:id/status</span></h3>
          <div class="description">Atualiza o status de uma notificação.</div>
          <pre><code>
// Exemplo de body
{
  "status": "enviado",
  "sent_date": "2023-09-27T15:30:00"
}
          </code></pre>
        </div>
        
        <div class="endpoint">
          <h3><span class="method">GET</span> <span class="url">${BASE_PATH}/api/status</span></h3>
          <div class="description">Verifica se a API está funcionando.</div>
        </div>
      </body>
    </html>
  `);
});

// Redirecionar a raiz para a documentação
app.get('/', (req, res) => {
  res.redirect(`${BASE_PATH}`);
});

// Tratamento de rota não encontrada
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`API disponível em: http://localhost:${PORT}${BASE_PATH}`);
});

// Para suportar a Vercel
module.exports = app;