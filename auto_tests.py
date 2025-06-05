#!/usr/bin/env python3

import os
import json
import time
import requests
from datetime import datetime
from notion_client import Client
from dotenv import load_dotenv

load_dotenv()

# Configuration
APP_URL = os.getenv('APP_URL', 'https://google.com')  # URL test par défaut
NOTION_TOKEN = os.getenv('NOTION_API_KEY')
DATABASE_ID = os.getenv('NOTION_DATABASE_ID')

notion = Client(auth=NOTION_TOKEN)

def test_url_accessibility():
    """Test l'accessibilité d'une URL"""
    try:
        start_time = time.time()
        response = requests.get(APP_URL, timeout=10)
        load_time = time.time() - start_time
        
        return {
            'test': 'url_accessibility',
            'status': 'PASS' if response.status_code == 200 else 'FAIL',
            'load_time': round(load_time, 2),
            'status_code': response.status_code,
            'url': APP_URL
        }
    except Exception as e:
        return {
            'test': 'url_accessibility',
            'status': 'FAIL',
            'error': str(e),
            'url': APP_URL
        }

def send_results_to_notion(results):
    """Envoie les résultats des tests à Notion"""
    try:
        # Calculer le score global
        total_tests = len(results)
        passed_tests = sum(1 for r in results if r.get('status') == 'PASS')
        score = round((passed_tests / total_tests) * 100, 1) if total_tests > 0 else 0
        
        # Préparer le résumé
        summary = f"Tests exécutés: {total_tests}\n"
        summary += f"Réussis: {passed_tests}\n"
        summary += f"Score: {score}%\n\n"
        
        for result in results:
            status_emoji = "✅" if result['status'] == 'PASS' else "❌"
            summary += f"{status_emoji} {result['test']}: {result['status']}\n"
            if 'load_time' in result:
                summary += f"   Temps: {result['load_time']}s\n"
        
        # Créer une page dans Notion
        notion.pages.create(
            parent={"database_id": DATABASE_ID},
            properties={
                "Oracle Portfolio Tracking": {
                    "title": [
                        {
                            "text": {
                                "content": f"Tests Automatisés - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
                            }
                        }
                    ]
                },
                "Statut": {
                    "select": {
                        "name": "Done" if score >= 80 else "En cours"
                    }
                },
                "Progression": {
                    "number": score
                },
                "Description": {
                    "rich_text": [
                        {
                            "text": {
                                "content": summary
                            }
                        }
                    ]
                },
                "Date": {
                    "date": {
                        "start": datetime.now().isoformat()
                    }
                }
            }
        )
        
        print(f"✅ Résultats envoyés à Notion (Score: {score}%)")
        
    except Exception as e:
        print(f"❌ Erreur envoi Notion: {e}")

def run_tests():
    """Exécute tous les tests"""
    print("🧪 Début des tests automatisés...")
    
    results = []
    
    # Test d'accessibilité URL
    print("🔍 Test d'accessibilité...")
    results.append(test_url_accessibility())
    
    # Afficher le résumé
    print("\n📊 Résultats des tests:")
    for result in results:
        status_emoji = "✅" if result['status'] == 'PASS' else "❌"
        print(f"  {status_emoji} {result['test']}: {result['status']}")
    
    # Envoyer à Notion
    if NOTION_TOKEN and DATABASE_ID:
        send_results_to_notion(results)
    
    return results

if __name__ == "__main__":
    run_tests()
