const express = require('express');
const cors = require('cors');
const { Client } = require('@notionhq/client');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configuration Notion
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

app.use(cors());
app.use(express.json());

// Fonction pour calculer le pourcentage d'avancement
function calculateProgress(commitMessage) {
  const keywords = {
    'init': 10,
    'setup': 15,
    'feature': 30,
    'fix': 5,
    'refactor': 10,
    'test': 20,
    'deploy': 25,
    'complete': 40
  };
  
  let progress = 0;
  for (const [keyword, value] of Object.entries(keywords)) {
    if (commitMessage.toLowerCase().includes(keyword)) {
      progress += value;
    }
  }
  
  return Math.min(progress, 100);
}

// Fonction pour déterminer le statut
function determineStatus(commitMessage) {
  if (commitMessage.toLowerCase().includes('error') || 
      commitMessage.toLowerCase().includes('fix')) {
    return 'En cours';
  }
  if (commitMessage.toLowerCase().includes('complete') || 
      commitMessage.toLowerCase().includes('deploy')) {
    return 'Terminé';
  }
  return 'En cours';
}

// Endpoint webhook
app.post('/webhook', async (req, res) => {
  try {
    const { commit_message, author, timestamp, branch } = req.body;
    
    console.log('Webhook reçu:', req.body);
    
    // Calculer la progression
    const progress = calculateProgress(commit_message);
    const status = determineStatus(commit_message);
    
    // Mettre à jour Notion
    await notion.pages.create({
      parent: {
        database_id: process.env.NOTION_DATABASE_ID,
      },
      properties: {
        'Oracle Portfolio Tracking': {
          title: [
            {
              text: {
                content: `Commit: ${commit_message.substring(0, 50)}...`,
              },
            },
          ],
        },
        'Statut': {
          select: {
            name: status,
          },
        },
        'Progression': {
          number: progress,
        },
        'Description': {
          rich_text: [
            {
              text: {
                content: `Auteur: ${author || 'Inconnu'}, Branche: ${branch || 'main'}`,
              },
            },
          ],
        },
        'Date': {
          date: {
            start: new Date(timestamp || Date.now()).toISOString(),
          },
        },
      },
    });
    
    res.status(200).json({ success: true, progress, status });
  } catch (error) {
    console.error('Erreur webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint de santé
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Serveur webhook démarré sur le port ${port}`);
});
