const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

async function checkColumns() {
  try {
    const response = await notion.databases.retrieve({
      database_id: process.env.NOTION_DATABASE_ID,
    });
    
    console.log('📋 Colonnes de votre base :');
    Object.keys(response.properties).forEach(key => {
      const prop = response.properties[key];
      console.log(`- "${key}" (type: ${prop.type})`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkColumns();
