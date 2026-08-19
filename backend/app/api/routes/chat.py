from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models import Conversation, Message, User
from app.schemas.support import ConversationOut, MessageOut, MessageCreate

router = APIRouter(prefix="/chat", tags=["Direct Messages Chat"])

@router.get("/conversations", response_model=List[ConversationOut])
def get_conversations(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    Retrieves the list of active direct message conversations for the user.
    """
    conversations = db.query(Conversation).filter(
        or_(Conversation.user1_id == current_user.id, Conversation.user2_id == current_user.id)
    ).order_by(Conversation.created_at.desc()).all()
    
    # Load messages
    for conv in conversations:
        conv.messages = db.query(Message).filter(Message.conversation_id == conv.id).order_by(Message.created_at.asc()).all()
        
    return conversations

@router.post("/conversations", response_model=ConversationOut)
def start_conversation(
    recipient_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Initiates a new conversation window with another resident.
    """
    if recipient_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot start a chat with yourself")
        
    # Check if recipient user exists
    recipient = db.query(User).filter(User.id == recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient user not found")
        
    # Ensure ordered keys so we check duplicates easily
    u1, u2 = sorted([current_user.id, recipient_id])
    
    conv = db.query(Conversation).filter(
        Conversation.user1_id == u1, Conversation.user2_id == u2
    ).first()
    
    if not conv:
        conv = Conversation(user1_id=u1, user2_id=u2)
        db.add(conv)
        db.commit()
        db.refresh(conv)
        
    conv.messages = db.query(Message).filter(Message.conversation_id == conv.id).order_by(Message.created_at.asc()).all()
    return conv

@router.post("/conversations/{conversation_id}/messages", response_model=MessageOut)
def send_message(
    conversation_id: UUID,
    msg_in: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Sends a direct message inside a conversation window.
    """
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation window not found")
        
    # Check if user is part of the conversation
    if conv.user1_id != current_user.id and conv.user2_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to send messages in this chat")
        
    msg = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=msg_in.content,
        is_read=False
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg

@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageOut])
def get_messages(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieves message history inside a conversation. Marks incoming messages as read.
    """
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    if conv.user1_id != current_user.id and conv.user2_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Mark incoming messages as read
    db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.sender_id != current_user.id,
        Message.is_read == False
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    
    return db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at.asc()).all()
