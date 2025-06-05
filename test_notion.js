const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

async function testNotion() {
  try {
    const response = await notion.databases.retrieve({
      database_id: process.env.NOTION_DATABASE_ID,
    });
    console.log('✅ Connexion Notion OK');
    console.log('Base trouvée:', response.title[0].plain_text);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testNotion();
