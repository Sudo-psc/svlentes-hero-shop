# 🚀 Implementação WhatsApp Cloud API + LangChain Agent

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Configuração Meta/Facebook](#configuração-metafacebook)
4. [Configuração do Webhook](#configuração-do-webhook)
5. [Implementação Backend](#implementação-backend)
6. [Integração LangChain](#integração-langchain)
7. [Deployment](#deployment)
8. [Testes](#testes)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

A **WhatsApp Cloud API** é a solução oficial do Meta para integração empresarial com WhatsApp. Esta documentação guia a implementação completa de um agente inteligente usando LangChain.

### Arquitetura Final

```
┌─────────────────────────────────────┐
│   WhatsApp (Usuários)               │
└─────────────┬───────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│   WhatsApp Cloud API (Meta)         │
│   - Envio/Recepção de mensagens     │
│   - Webhooks                        │
└─────────────┬───────────────────────┘
              │
              ↓ HTTPS Webhook
┌─────────────────────────────────────┐
│   Backend Python (Flask/FastAPI)    │
│   - Verificação de webhook          │
│   - Validação de assinatura         │
│   - Enfileiramento de mensagens     │
└─────────────┬───────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│   Celery Worker                     │
│   - Processamento assíncrono        │
│   - LangGraph Agent                 │
│   - Gerenciamento de estado         │
└─────────────┬───────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│   Persistência                      │
│   - PostgreSQL (checkpoints)        │
│   - Redis (cache/fila)              │
└─────────────────────────────────────┘
```

---

## 📦 Pré-requisitos

### 1. Contas Necessárias

- [ ] **Meta for Developers Account**: https://developers.facebook.com/
- [ ] **Facebook Business Account**: Verificação de negócio
- [ ] **Número de telefone**: Para WhatsApp Business (não pode ser pessoal)
- [ ] **Servidor com IP público**: Para receber webhooks (HTTPS obrigatório)

### 2. Requisitos Técnicos

- [ ] Python 3.9+
- [ ] PostgreSQL 13+
- [ ] Redis 6+
- [ ] SSL Certificate (Let's Encrypt gratuito)
- [ ] Domínio próprio (para webhook URL)

### 3. Dependências Python

```bash
# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# Instalar dependências
pip install fastapi uvicorn[standard]
pip install celery redis
pip install langchain langgraph langchain-openai
pip install psycopg2-binary sqlalchemy
pip install python-dotenv pydantic-settings
pip install httpx requests
```

---

## 🔧 Configuração Meta/Facebook

### Passo 1: Criar App no Meta for Developers

1. Acesse: https://developers.facebook.com/apps
2. Clique em **"Create App"**
3. Selecione **"Business"** como tipo
4. Preencha:
   - App name: `svlentes-whatsapp-agent`
   - Contact email: seu email
5. Clique em **"Create App"**

### Passo 2: Adicionar WhatsApp Product

1. No painel do app, clique em **"Add Product"**
2. Encontre **"WhatsApp"** e clique em **"Set Up"**
3. Aguarde a configuração inicial

### Passo 3: Configurar Número de Teste

1. Na seção **"API Setup"**, você verá:
   - **Phone number ID**: Copie este ID
   - **WhatsApp Business Account ID**: Copie este ID
   - **Test number**: Número fornecido para testes

2. Adicione seu número pessoal para receber mensagens de teste:
   - Clique em **"Add recipient"**
   - Insira seu número com código do país (+55...)
   - Confirme via SMS/WhatsApp

3. Teste o envio de mensagem:
```bash
curl -X POST \
  "https://graph.facebook.com/v21.0/PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "5511999999999",
    "type": "text",
    "text": {
      "body": "Olá! Esta é uma mensagem de teste."
    }
  }'
```

### Passo 4: Obter Access Token Permanente

**Token temporário (24h):**
- Disponível na seção "API Setup"
- Use apenas para testes iniciais

**Token permanente (recomendado):**

1. Acesse **"App Settings" → "Basic"**
2. Copie **"App ID"** e **"App Secret"**
3. Gere token de sistema:

```bash
# 1. Obter user access token (navegador)
# Acesse: https://developers.facebook.com/tools/explorer/
# Selecione seu app
# Selecione permissões: whatsapp_business_management, whatsapp_business_messaging
# Clique em "Generate Access Token"

# 2. Trocar por token de longa duração
curl -X GET "https://graph.facebook.com/v21.0/oauth/access_token?\
grant_type=fb_exchange_token&\
client_id=YOUR_APP_ID&\
client_secret=YOUR_APP_SECRET&\
fb_exchange_token=YOUR_SHORT_LIVED_TOKEN"

# 3. Gerar System User Token (nunca expira)
# Painel: Business Settings → System Users → Add
# Atribuir permissões necessárias
# Gerar novo token
```

### Passo 5: Configurar Webhook

1. Na seção **"Configuration"** do WhatsApp:
2. Clique em **"Edit"** em "Webhook"
3. Configure:
   - **Callback URL**: `https://seu-dominio.com/webhook/whatsapp`
   - **Verify token**: `meu_token_secreto_123` (você define)
4. Selecione campos a receber:
   - [x] `messages`
   - [x] `message_status` (opcional)
   - [x] `message_template_status_update` (opcional)

---

## 🌐 Configuração do Webhook

### Estrutura do Projeto

```
whatsapp-agent/
├── .env
├── .env.example
├── requirements.txt
├── config/
│   └── settings.py
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app
│   ├── webhook.py           # Endpoints webhook
│   ├── whatsapp_client.py   # Cliente WhatsApp Cloud API
│   ├── agent.py             # LangGraph agent
│   ├── tools.py             # Ferramentas personalizadas
│   └── tasks.py             # Celery tasks
├── database/
│   ├── __init__.py
│   ├── models.py            # SQLAlchemy models
│   └── session.py           # DB connection
└── tests/
    └── test_webhook.py
```

### Arquivo `.env.example`

```bash
# WhatsApp Cloud API
WHATSAPP_API_VERSION=v21.0
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=meu_token_secreto_123

# LangChain / OpenAI
OPENAI_API_KEY=sk-...
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls_...

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/whatsapp_agent

# Redis
REDIS_URL=redis://localhost:6379/0

# Application
APP_ENV=development
APP_DEBUG=True
SECRET_KEY=your-secret-key-here
```

### `config/settings.py`

```python
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # WhatsApp
    WHATSAPP_API_VERSION: str
    WHATSAPP_PHONE_NUMBER_ID: str
    WHATSAPP_BUSINESS_ACCOUNT_ID: str
    WHATSAPP_ACCESS_TOKEN: str
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: str
    
    # LangChain
    OPENAI_API_KEY: str
    LANGCHAIN_TRACING_V2: bool = False
    LANGCHAIN_API_KEY: Optional[str] = None
    
    # Database
    DATABASE_URL: str
    REDIS_URL: str
    
    # App
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    SECRET_KEY: str
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

### `app/whatsapp_client.py`

```python
import httpx
from typing import Dict, Any, Optional
from config.settings import settings
import logging

logger = logging.getLogger(__name__)

class WhatsAppClient:
    def __init__(self):
        self.base_url = f"https://graph.facebook.com/{settings.WHATSAPP_API_VERSION}"
        self.phone_number_id = settings.WHATSAPP_PHONE_NUMBER_ID
        self.access_token = settings.WHATSAPP_ACCESS_TOKEN
        self.headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
    
    async def send_text_message(
        self, 
        to: str, 
        message: str,
        preview_url: bool = False
    ) -> Dict[str, Any]:
        """Envia mensagem de texto"""
        url = f"{self.base_url}/{self.phone_number_id}/messages"
        
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "text",
            "text": {
                "preview_url": preview_url,
                "body": message
            }
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url, 
                    json=payload, 
                    headers=self.headers,
                    timeout=30.0
                )
                response.raise_for_status()
                result = response.json()
                logger.info(f"Message sent to {to}: {result}")
                return result
        except httpx.HTTPError as e:
            logger.error(f"Error sending message: {e}")
            raise
    
    async def send_reaction(
        self,
        to: str,
        message_id: str,
        emoji: str
    ) -> Dict[str, Any]:
        """Envia reação a uma mensagem"""
        url = f"{self.base_url}/{self.phone_number_id}/messages"
        
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "reaction",
            "reaction": {
                "message_id": message_id,
                "emoji": emoji
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()
    
    async def mark_as_read(self, message_id: str) -> Dict[str, Any]:
        """Marca mensagem como lida"""
        url = f"{self.base_url}/{self.phone_number_id}/messages"
        
        payload = {
            "messaging_product": "whatsapp",
            "status": "read",
            "message_id": message_id
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()
    
    async def send_template_message(
        self,
        to: str,
        template_name: str,
        language_code: str = "pt_BR",
        components: Optional[list] = None
    ) -> Dict[str, Any]:
        """Envia mensagem de template (aprovado pelo Meta)"""
        url = f"{self.base_url}/{self.phone_number_id}/messages"
        
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {
                    "code": language_code
                },
                "components": components or []
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()

# Singleton instance
whatsapp_client = WhatsAppClient()
```

### `app/webhook.py`

```python
from fastapi import APIRouter, Request, HTTPException, Query
from fastapi.responses import PlainTextResponse
from config.settings import settings
from app.whatsapp_client import whatsapp_client
from app.tasks import process_message_task
import logging
import hashlib
import hmac

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhook")

@router.get("/whatsapp")
async def verify_webhook(
    mode: str = Query(alias="hub.mode"),
    token: str = Query(alias="hub.verify_token"),
    challenge: str = Query(alias="hub.challenge")
):
    """
    Verificação do webhook pelo Meta.
    Executado uma única vez durante a configuração.
    """
    if mode == "subscribe" and token == settings.WHATSAPP_WEBHOOK_VERIFY_TOKEN:
        logger.info("Webhook verified successfully")
        return PlainTextResponse(challenge)
    
    logger.warning(f"Webhook verification failed: mode={mode}, token={token}")
    raise HTTPException(status_code=403, detail="Verification failed")

@router.post("/whatsapp")
async def receive_webhook(request: Request):
    """
    Recebe mensagens do WhatsApp Cloud API.
    Processa assincronamente via Celery.
    """
    try:
        # Validar assinatura (segurança)
        signature = request.headers.get("X-Hub-Signature-256", "")
        body = await request.body()
        
        if not verify_signature(body, signature):
            logger.warning("Invalid webhook signature")
            raise HTTPException(status_code=403, detail="Invalid signature")
        
        # Parse payload
        data = await request.json()
        logger.info(f"Webhook received: {data}")
        
        # Extrair mensagens
        if data.get("object") == "whatsapp_business_account":
            for entry in data.get("entry", []):
                for change in entry.get("changes", []):
                    value = change.get("value", {})
                    
                    # Processar mensagens recebidas
                    if "messages" in value:
                        for message in value["messages"]:
                            await handle_incoming_message(message, value)
                    
                    # Processar status de mensagens enviadas (opcional)
                    if "statuses" in value:
                        for status in value["statuses"]:
                            logger.info(f"Message status update: {status}")
        
        return {"status": "ok"}
    
    except Exception as e:
        logger.error(f"Error processing webhook: {e}", exc_info=True)
        # Retornar 200 para evitar re-tentativas do Meta
        return {"status": "error", "message": str(e)}

def verify_signature(payload: bytes, signature: str) -> bool:
    """
    Verifica assinatura HMAC SHA256 do webhook.
    Segurança contra requisições maliciosas.
    """
    if not signature.startswith("sha256="):
        return False
    
    # App Secret do Facebook App
    app_secret = settings.SECRET_KEY.encode()
    
    expected_signature = hmac.new(
        app_secret,
        payload,
        hashlib.sha256
    ).hexdigest()
    
    received_signature = signature.split("sha256=")[1]
    
    return hmac.compare_digest(expected_signature, received_signature)

async def handle_incoming_message(message: dict, value: dict):
    """
    Processa mensagem recebida.
    Enfileira para processamento assíncrono.
    """
    message_id = message.get("id")
    from_number = message.get("from")
    message_type = message.get("type")
    
    # Ignorar mensagens de status ou sistema
    if message_type in ["system", "ephemeral"]:
        return
    
    # Extrair texto da mensagem
    message_text = None
    if message_type == "text":
        message_text = message.get("text", {}).get("body")
    elif message_type == "button":
        message_text = message.get("button", {}).get("text")
    elif message_type == "interactive":
        # Resposta de botão/lista
        interactive = message.get("interactive", {})
        message_text = (
            interactive.get("button_reply", {}).get("title") or
            interactive.get("list_reply", {}).get("title")
        )
    
    if not message_text:
        logger.warning(f"Unsupported message type: {message_type}")
        await whatsapp_client.send_text_message(
            to=from_number,
            message="Desculpe, não consigo processar este tipo de mensagem ainda."
        )
        return
    
    # Marcar como lida (indicador visual no WhatsApp)
    await whatsapp_client.mark_as_read(message_id)
    
    # Enviar reação "👀" (indicando que viu a mensagem)
    await whatsapp_client.send_reaction(
        to=from_number,
        message_id=message_id,
        emoji="👀"
    )
    
    # Enfileirar para processamento com LangGraph Agent
    process_message_task.delay(
        phone_number=from_number,
        message_text=message_text,
        message_id=message_id
    )
    
    logger.info(f"Message queued for processing: {from_number} -> {message_text[:50]}")
```

---

## 🤖 Integração LangChain

### `database/models.py`

```python
from sqlalchemy import Column, String, Text, DateTime, Integer, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import uuid

Base = declarative_base()

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    phone_number = Column(String(20), nullable=False, index=True)
    thread_id = Column(String(50), nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    metadata = Column(JSON, default={})

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String(36), nullable=False, index=True)
    whatsapp_message_id = Column(String(100), unique=True)
    role = Column(String(20), nullable=False)  # 'user' ou 'assistant'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    metadata = Column(JSON, default={})

class Checkpoint(Base):
    """Tabela para LangGraph checkpoints"""
    __tablename__ = "checkpoints"
    
    thread_id = Column(String(50), primary_key=True)
    checkpoint_id = Column(String(100), primary_key=True)
    checkpoint_data = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

### `database/session.py`

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from config.settings import settings
from contextlib import contextmanager

engine = create_engine(
    settings.DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@contextmanager
def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Cria tabelas no banco"""
    from database.models import Base
    Base.metadata.create_all(bind=engine)
```

### `app/tools.py`

```python
from langchain.tools import Tool
from database.session import get_db
from database.models import Conversation, Message
import logging

logger = logging.getLogger(__name__)

def consultar_historico_cliente(phone_number: str) -> str:
    """Consulta histórico de conversas anteriores do cliente"""
    with get_db() as db:
        conversations = db.query(Conversation).filter(
            Conversation.phone_number == phone_number
        ).order_by(Conversation.created_at.desc()).limit(5).all()
        
        if not conversations:
            return "Cliente novo, sem histórico anterior."
        
        historico = []
        for conv in conversations:
            messages = db.query(Message).filter(
                Message.conversation_id == conv.id
            ).order_by(Message.created_at.asc()).limit(10).all()
            
            historico.append(f"Conversa em {conv.created_at.strftime('%d/%m/%Y')}:")
            for msg in messages:
                historico.append(f"  {msg.role}: {msg.content[:100]}")
        
        return "\n".join(historico)

def consultar_pedido(numero_pedido: str) -> str:
    """Consulta status de pedido no sistema"""
    # Integração com seu banco de dados de pedidos
    # Exemplo mockado:
    pedidos_exemplo = {
        "12345": "Em separação",
        "67890": "Enviado - Código rastreio: BR123456789",
        "11111": "Entregue em 15/01/2025"
    }
    
    status = pedidos_exemplo.get(numero_pedido)
    if status:
        return f"Pedido #{numero_pedido}: {status}"
    else:
        return f"Pedido #{numero_pedido} não encontrado. Verifique o número."

def criar_ticket_suporte(descricao: str, prioridade: str = "normal") -> str:
    """Cria ticket de suporte técnico"""
    # Integração com sistema de tickets (Zendesk, Freshdesk, etc.)
    import random
    ticket_id = random.randint(1000, 9999)
    
    logger.info(f"Ticket criado: #{ticket_id} - {descricao}")
    
    return (
        f"✅ Ticket #{ticket_id} criado com sucesso!\n"
        f"Prioridade: {prioridade}\n"
        f"Nossa equipe entrará em contato em até 24h."
    )

# Lista de ferramentas disponíveis para o agente
TOOLS = [
    Tool(
        name="ConsultarHistoricoCliente",
        func=consultar_historico_cliente,
        description=(
            "Consulta histórico de conversas anteriores do cliente. "
            "Use quando precisar saber sobre interações passadas. "
            "Input: número de telefone (string)"
        )
    ),
    Tool(
        name="ConsultarPedido",
        func=consultar_pedido,
        description=(
            "Consulta status de um pedido pelo número. "
            "Use quando o cliente perguntar sobre um pedido específico. "
            "Input: número do pedido (string)"
        )
    ),
    Tool(
        name="CriarTicketSuporte",
        func=criar_ticket_suporte,
        description=(
            "Cria um ticket de suporte técnico. "
            "Use quando o cliente reportar um problema que você não consegue resolver. "
            "Input: descrição do problema (string)"
        )
    )
]
```

### `app/agent.py`

```python
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.postgres import PostgresSaver
from app.tools import TOOLS
from config.settings import settings
from database.session import engine
import logging

logger = logging.getLogger(__name__)

# Configurar LLM
llm = ChatOpenAI(
    model="gpt-4o-mini",  # ou gpt-4o para melhor qualidade
    temperature=0.7,
    api_key=settings.OPENAI_API_KEY
)

# Prompt do sistema
SYSTEM_PROMPT = """Você é um assistente virtual da SVLentes, empresa especializada em óculos e lentes de contato.

PERSONALIDADE:
- Seja educado, profissional e empático
- Use linguagem natural e brasileira
- Sempre confirme informações importantes antes de prosseguir
- Se não souber algo, seja honesto e ofereça ajuda alternativa

CAPACIDADES:
- Consultar status de pedidos
- Verificar histórico de conversas do cliente
- Criar tickets de suporte para problemas técnicos
- Responder dúvidas sobre produtos e serviços

LIMITAÇÕES:
- NÃO faça promessas que não pode cumprir
- NÃO compartilhe informações sensíveis de outros clientes
- NÃO processe pagamentos ou alterações de pedidos sem confirmação

FORMATO DE RESPOSTAS:
- Seja conciso mas completo
- Use emojis moderadamente para humanizar
- Estruture respostas longas com bullet points
- Sempre termine oferecendo ajuda adicional

Lembre-se: você representa a marca SVLentes. Seja sempre profissional!"""

# Configurar PostgreSQL checkpointer para memória persistente
checkpointer = PostgresSaver(engine)
checkpointer.setup()  # Cria tabelas necessárias

# Criar agente
agent = create_react_agent(
    llm,
    TOOLS,
    checkpointer=checkpointer,
    state_modifier=SYSTEM_PROMPT
)

def process_user_message(phone_number: str, message_text: str) -> str:
    """
    Processa mensagem do usuário através do agente LangGraph.
    
    Args:
        phone_number: Número de telefone do usuário (usado como thread_id)
        message_text: Texto da mensagem
    
    Returns:
        Resposta do agente
    """
    try:
        # Configuração com thread_id baseado no número de telefone
        # Isso garante que cada usuário tenha sua própria sessão/memória
        config = {
            "configurable": {
                "thread_id": phone_number
            }
        }
        
        # Invocar agente
        result = agent.invoke(
            {"messages": [{"role": "user", "content": message_text}]},
            config
        )
        
        # Extrair última mensagem do agente
        if result and "messages" in result:
            last_message = result["messages"][-1]
            response_text = last_message.content
            
            logger.info(f"Agent response for {phone_number}: {response_text[:100]}...")
            return response_text
        
        return "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente."
    
    except Exception as e:
        logger.error(f"Error in agent processing: {e}", exc_info=True)
        return (
            "Desculpe, estou com dificuldades técnicas no momento. "
            "Nossa equipe foi notificada. Por favor, tente novamente em alguns minutos."
        )
```

### `app/tasks.py`

```python
from celery import Celery
from config.settings import settings
from app.agent import process_user_message
from app.whatsapp_client import whatsapp_client
from database.session import get_db
from database.models import Conversation, Message
import logging
import asyncio

logger = logging.getLogger(__name__)

# Configurar Celery
celery_app = Celery(
    'whatsapp_agent',
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='America/Sao_Paulo',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutos max
    task_soft_time_limit=240  # 4 minutos soft limit
)

@celery_app.task(bind=True, max_retries=3)
def process_message_task(self, phone_number: str, message_text: str, message_id: str):
    """
    Task Celery para processar mensagem assincronamente.
    
    Args:
        phone_number: Número do WhatsApp
        message_text: Conteúdo da mensagem
        message_id: ID da mensagem do WhatsApp
    """
    try:
        logger.info(f"Processing message from {phone_number}: {message_text[:50]}...")
        
        # 1. Salvar mensagem do usuário no banco
        with get_db() as db:
            # Buscar ou criar conversa
            conversation = db.query(Conversation).filter(
                Conversation.phone_number == phone_number
            ).first()
            
            if not conversation:
                conversation = Conversation(
                    phone_number=phone_number,
                    thread_id=phone_number
                )
                db.add(conversation)
                db.commit()
                db.refresh(conversation)
            
            # Salvar mensagem do usuário
            user_message = Message(
                conversation_id=conversation.id,
                whatsapp_message_id=message_id,
                role="user",
                content=message_text
            )
            db.add(user_message)
            db.commit()
        
        # 2. Processar com LangGraph Agent
        response_text = process_user_message(phone_number, message_text)
        
        # 3. Enviar resposta via WhatsApp
        loop = asyncio.get_event_loop()
        send_result = loop.run_until_complete(
            whatsapp_client.send_text_message(
                to=phone_number,
                message=response_text,
                preview_url=True
            )
        )
        
        # 4. Salvar resposta do agente no banco
        with get_db() as db:
            assistant_message = Message(
                conversation_id=conversation.id,
                whatsapp_message_id=send_result.get("messages", [{}])[0].get("id"),
                role="assistant",
                content=response_text
            )
            db.add(assistant_message)
            db.commit()
        
        logger.info(f"Message processed successfully for {phone_number}")
        return {"status": "success", "phone": phone_number}
    
    except Exception as e:
        logger.error(f"Error processing message: {e}", exc_info=True)
        
        # Retry com backoff exponencial
        try:
            self.retry(exc=e, countdown=2 ** self.request.retries)
        except self.MaxRetriesExceededError:
            # Enviar mensagem de erro ao usuário após 3 tentativas
            loop = asyncio.get_event_loop()
            loop.run_until_complete(
                whatsapp_client.send_text_message(
                    to=phone_number,
                    message=(
                        "Desculpe, estamos enfrentando problemas técnicos. "
                        "Por favor, tente novamente mais tarde ou entre em contato "
                        "pelo telefone (11) 9999-9999."
                    )
                )
            )
            raise
```

### `app/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.webhook import router as webhook_router
from database.session import init_db
import logging

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Criar app FastAPI
app = FastAPI(
    title="WhatsApp Agent API",
    description="LangChain Agent integrado com WhatsApp Cloud API",
    version="1.0.0"
)

# CORS (se necessário)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(webhook_router)

@app.on_event("startup")
async def startup_event():
    """Inicialização do app"""
    logger.info("Starting WhatsApp Agent API...")
    init_db()
    logger.info("Database initialized")

@app.get("/")
async def root():
    """Health check"""
    return {"status": "ok", "message": "WhatsApp Agent API is running"}

@app.get("/health")
async def health_check():
    """Health check detalhado"""
    return {
        "status": "healthy",
        "database": "connected",
        "redis": "connected",
        "whatsapp_api": "configured"
    }
```

---

## 🚀 Deployment

### Docker Setup

**`Dockerfile`:**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY . .

# Expor porta
EXPOSE 8000

# Comando padrão
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**`docker-compose.yml`:**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: whatsapp_user
      POSTGRES_PASSWORD: whatsapp_pass
      POSTGRES_DB: whatsapp_agent
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  api:
    build: .
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    volumes:
      - .:/app
    ports:
      - "8000:8000"
    env_file:
      - .env
    depends_on:
      - postgres
      - redis
  
  celery_worker:
    build: .
    command: celery -A app.tasks worker --loglevel=info --concurrency=4
    volumes:
      - .:/app
    env_file:
      - .env
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
```

### Iniciar Aplicação

```bash
# 1. Criar .env baseado em .env.example
cp .env.example .env
# Editar .env com suas credenciais

# 2. Subir containers
docker-compose up -d

# 3. Verificar logs
docker-compose logs -f api

# 4. Testar API
curl http://localhost:8000/health

# 5. Expor para internet (ngrok para testes)
ngrok http 8000
# Copiar URL HTTPS e configurar no Meta Webhook
```

### Configurar SSL em Produção (Let's Encrypt + Nginx)

**`nginx.conf`:**

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name seu-dominio.com;
    
    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;
    
    location / {
        proxy_pass http://api:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🧪 Testes

### Teste Manual do Webhook

```bash
# 1. Verificação (GET)
curl "http://localhost:8000/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=meu_token_secreto_123&hub.challenge=CHALLENGE_ACCEPTED"

# Resposta esperada: CHALLENGE_ACCEPTED

# 2. Mensagem simulada (POST)
curl -X POST http://localhost:8000/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "5511999999999",
            "id": "wamid.test123",
            "type": "text",
            "text": {
              "body": "Olá, quero saber sobre meu pedido 12345"
            }
          }]
        }
      }]
    }]
  }'
```

### Teste de Envio de Mensagem

```python
# test_send_message.py
import asyncio
from app.whatsapp_client import whatsapp_client

async def test_send():
    result = await whatsapp_client.send_text_message(
        to="5511999999999",
        message="🤖 Olá! Sou seu assistente virtual da SVLentes. Como posso ajudar?"
    )
    print(result)

if __name__ == "__main__":
    asyncio.run(test_send())
```

---

## 🐛 Troubleshooting

### Problema: Webhook não recebe mensagens

**Causas:**
1. Webhook URL não configurada corretamente no Meta
2. URL não está acessível publicamente (HTTPS)
3. Token de verificação incorreto

**Solução:**
```bash
# Testar acessibilidade
curl https://seu-dominio.com/webhook/whatsapp

# Verificar logs
docker-compose logs -f api

# Re-configurar webhook no Meta
# Painel WhatsApp > Configuration > Edit Webhook
```

### Problema: Mensagens não são enviadas

**Causas:**
1. Access token expirado/inválido
2. Phone Number ID incorreto
3. Número destinatário não verificado (modo teste)

**Solução:**
```python
# Testar API diretamente
import httpx

url = f"https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages"
headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
payload = {
    "messaging_product": "whatsapp",
    "to": "5511999999999",
    "type": "text",
    "text": {"body": "Teste"}
}

response = httpx.post(url, json=payload, headers=headers)
print(response.json())
```

### Problema: Celery worker não processa tarefas

**Causas:**
1. Redis não conectado
2. Worker não iniciado
3. Erro no código da task

**Solução:**
```bash
# Verificar Redis
docker-compose exec redis redis-cli ping
# Resposta: PONG

# Reiniciar worker
docker-compose restart celery_worker

# Ver logs do worker
docker-compose logs -f celery_worker
```

---

## 📊 Monitoramento

### Métricas Importantes

```python
# app/metrics.py
from prometheus_client import Counter, Histogram
import time

# Contadores
messages_received = Counter('whatsapp_messages_received_total', 'Total messages received')
messages_sent = Counter('whatsapp_messages_sent_total', 'Total messages sent')
errors_total = Counter('whatsapp_errors_total', 'Total errors', ['type'])

# Histogramas (latência)
processing_time = Histogram('whatsapp_processing_seconds', 'Time to process message')

# Uso em tasks.py
@celery_app.task
def process_message_task(phone_number, message_text, message_id):
    messages_received.inc()
    start_time = time.time()
    
    try:
        # ... processar mensagem ...
        messages_sent.inc()
    except Exception as e:
        errors_total.labels(type=type(e).__name__).inc()
        raise
    finally:
        processing_time.observe(time.time() - start_time)
```

---

## 🎯 Próximos Passos

1. **Templates de mensagens**: Criar templates aprovados pelo Meta para notificações proativas
2. **Botões interativos**: Implementar menus e respostas rápidas
3. **Mídia**: Processar imagens, áudio, documentos
4. **Multi-agente**: Especializar agentes por departamento (vendas, suporte, etc.)
5. **Analytics**: Dashboard com métricas de uso e performance
6. **Backup**: Estratégia de backup de conversas e checkpoints

---

**Documentação criada em: Janeiro 2025**  
**Versão WhatsApp Cloud API: v21.0**  
**LangChain: v0.3**  
**LangGraph: v0.6**
