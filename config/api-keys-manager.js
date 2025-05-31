// MAGNETICA VDE PLATFORM - ENTERPRISE API KEYS MANAGER
// Gestione sicura e automatica delle credenziali API

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class MagneticaAPIKeysManager {
  constructor() {
    this.configPath = path.join(process.cwd(), '.env');
    this.templatePath = path.join(process.cwd(), 'env.template');
    this.required_keys = [
      'OPENAI_API_KEY',
      'PINECONE_API_KEY',
      'PINECONE_ENVIRONMENT'
    ];
    this.isInitialized = false;
    
    this.init();
  }

  init() {
    console.log('🔐 Magnetica API Keys Manager - Inizializzazione...');
    
    // Load environment variables
    this.loadEnvironmentVariables();
    
    // Check if .env exists, if not create from template
    if (!fs.existsSync(this.configPath)) {
      this.createConfigFromTemplate();
    }
    
    // Validate required keys
    const validation = this.validateRequiredKeys();
    
    if (validation.isValid) {
      console.log('✅ Tutte le API key sono configurate correttamente');
      this.isInitialized = true;
    } else {
      this.handleMissingKeys(validation.missing);
    }
  }

  loadEnvironmentVariables() {
    try {
      require('dotenv').config();
      console.log('📄 File .env caricato con successo');
    } catch (error) {
      console.log('ℹ️  File .env non trovato, verrà creato automaticamente');
    }
  }

  createConfigFromTemplate() {
    try {
      if (fs.existsSync(this.templatePath)) {
        fs.copyFileSync(this.templatePath, this.configPath);
        console.log('📋 File .env creato dal template');
        console.log('⚠️  ATTENZIONE: Configura le tue API key nel file .env prima di continuare');
      }
    } catch (error) {
      console.error('❌ Errore nella creazione del file .env:', error.message);
    }
  }

  validateRequiredKeys() {
    const missing = [];
    
    for (const key of this.required_keys) {
      const value = process.env[key];
      if (!value || value.includes('your-') || value.includes('here')) {
        missing.push(key);
      }
    }
    
    return {
      isValid: missing.length === 0,
      missing: missing
    };
  }

  handleMissingKeys(missing) {
    console.log('\n🚨 CONFIGURAZIONE API KEY RICHIESTA 🚨');
    console.log('================================================');
    console.log('Le seguenti API key devono essere configurate:');
    
    missing.forEach(key => {
      console.log(`❌ ${key}: ${this.getKeyDescription(key)}`);
    });
    
    console.log('\n📝 ISTRUZIONI:');
    console.log('1. Apri il file .env nella root del progetto');
    console.log('2. Sostituisci i placeholder con le tue API key reali:');
    
    missing.forEach(key => {
      console.log(`   ${key}=la-tua-api-key-qui`);
    });
    
    console.log('\n🔗 Dove ottenere le API key:');
    console.log('• OpenAI: https://platform.openai.com/api-keys');
    console.log('• Pinecone: https://app.pinecone.io/');
    
    console.log('\n🔄 Riavvia il server dopo la configurazione');
    
    // Non bloccare l'avvio in modalità demo
    if (process.env.ENABLE_DEMO_MODE === 'true') {
      console.log('\n🧪 Modalità DEMO attiva - il server continuerà senza API key reali');
      this.isInitialized = true;
    }
  }

  getKeyDescription(key) {
    const descriptions = {
      'OPENAI_API_KEY': 'Necessaria per OpenAI Vision API (analisi immagini)',
      'PINECONE_API_KEY': 'Necessaria per Pinecone Vector Database',
      'PINECONE_ENVIRONMENT': 'Environment Pinecone (es: us-east-1-aws)',
      'MOHD_API_KEY': 'API key per integrazione MOHD (opzionale)',
      'JWT_SECRET': 'Chiave segreta per JWT tokens'
    };
    return descriptions[key] || 'API key richiesta per il funzionamento';
  }

  // Verifica se le API key sono valide
  async validateAPIKeys() {
    const results = {};
    
    // Test OpenAI
    if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your-')) {
      try {
        results.openai = await this.testOpenAIConnection();
      } catch (error) {
        results.openai = { valid: false, error: error.message };
      }
    }
    
    // Test Pinecone
    if (process.env.PINECONE_API_KEY && !process.env.PINECONE_API_KEY.includes('your-')) {
      try {
        results.pinecone = await this.testPineconeConnection();
      } catch (error) {
        results.pinecone = { valid: false, error: error.message };
      }
    }
    
    return results;
  }

  async testOpenAIConnection() {
    // Test base - verifica formato API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey.startsWith('sk-')) {
      return { valid: false, error: 'Formato API key OpenAI non valido' };
    }
    
    return { valid: true, message: 'Formato API key valido' };
  }

  async testPineconeConnection() {
    // Test base - verifica presenza configurazione
    const apiKey = process.env.PINECONE_API_KEY;
    const environment = process.env.PINECONE_ENVIRONMENT;
    
    if (!apiKey || !environment) {
      return { valid: false, error: 'Configurazione Pinecone incompleta' };
    }
    
    return { valid: true, message: 'Configurazione Pinecone completa' };
  }

  // Metodi per accesso sicuro alle API key
  getOpenAIConfig() {
    return {
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORG_ID,
      model: process.env.OPENAI_MODEL || 'gpt-4-vision-preview',
      maxTokens: parseInt(process.env.MAX_TOKENS_PER_REQUEST) || 4000
    };
  }

  getPineconeConfig() {
    return {
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT,
      indexName: process.env.PINECONE_INDEX_NAME || 'magnetica-vde-vectors'
    };
  }

  getCostLimits() {
    return {
      dailyLimit: parseFloat(process.env.DAILY_COST_LIMIT) || 5.0,
      emergencyLimit: parseFloat(process.env.EMERGENCY_COST_LIMIT) || 20.0,
      maxImagesPerBatch: parseInt(process.env.MAX_IMAGES_PER_BATCH) || 50
    };
  }

  // Status delle configurazioni
  getConfigurationStatus() {
    const validation = this.validateRequiredKeys();
    
    return {
      isConfigured: this.isInitialized,
      requiredKeys: this.required_keys.length,
      configuredKeys: this.required_keys.length - validation.missing.length,
      missingKeys: validation.missing,
      demoMode: process.env.ENABLE_DEMO_MODE === 'true'
    };
  }

  // Genera report di configurazione
  generateConfigurationReport() {
    const status = this.getConfigurationStatus();
    
    console.log('\n📊 MAGNETICA VDE - REPORT CONFIGURAZIONE');
    console.log('=========================================');
    console.log(`🔧 Stato: ${status.isConfigured ? '✅ Configurato' : '⚠️  Configurazione incompleta'}`);
    console.log(`🔑 API Key: ${status.configuredKeys}/${status.requiredKeys} configurate`);
    
    if (status.missingKeys.length > 0) {
      console.log(`❌ Mancanti: ${status.missingKeys.join(', ')}`);
    }
    
    console.log(`🧪 Demo Mode: ${status.demoMode ? 'Abilitato' : 'Disabilitato'}`);
    console.log(`💰 Limite costi giornaliero: $${this.getCostLimits().dailyLimit}`);
    console.log('=========================================\n');
  }
}

module.exports = MagneticaAPIKeysManager; 