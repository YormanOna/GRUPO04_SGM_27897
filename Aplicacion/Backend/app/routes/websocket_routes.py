from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from jose import jwt, JWTError
from app.core.config import settings
from app.core.websocket import manager
from typing import Optional

router = APIRouter()

async def get_user_from_token(token: str) -> dict:
    """
    Extrae información del usuario desde el token JWT
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        cargo = payload.get("cargo")
        
        if user_id is None:
            return None
        
        return {"id": int(user_id), "cargo": cargo}
    except JWTError:
        return None


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None, description="Token JWT de autenticación")
):
    """
    Endpoint WebSocket para notificaciones en tiempo real
    
    Uso:
    ws://localhost:8000/ws?token=YOUR_JWT_TOKEN
    
    Tipos de mensajes que se pueden recibir:
    - llamada_paciente: Notificación de llamada a consulta
    - cita_actualizada: Cambio en el estado de una cita
    - receta_lista: Receta disponible en farmacia
    - notificacion_medico: Notificaciones para médicos
    - notificacion_farmacia: Notificaciones para farmacia
    """
    
    # Validar token
    if not token:
        await websocket.close(code=1008, reason="Token no proporcionado")
        return
    
    user = await get_user_from_token(token)
    if not user:
        await websocket.close(code=1008, reason="Token inválido")
        return
    
    user_id = user["id"]
    user_role = user["cargo"]
    
    # Conectar al cliente
    await manager.connect(websocket, user_id, user_role)
    
    try:
        # Enviar mensaje de bienvenida
        await websocket.send_json({
            "type": "connection_established",
            "message": f"Conectado exitosamente como {user_role}",
            "user_id": user_id
        })
        
        # Mantener la conexión abierta y escuchar mensajes
        while True:
            # Recibir mensajes del cliente (por si quiere enviar algo)
            data = await websocket.receive_text()
            
            # Aquí podrías procesar mensajes del cliente si es necesario
            # Por ahora solo hacer echo
            await websocket.send_json({
                "type": "echo",
                "message": f"Mensaje recibido: {data}"
            })
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id, user_role)
    except Exception as e:
        print(f"Error en WebSocket: {e}")
        manager.disconnect(websocket, user_id, user_role)


@router.get("/ws/stats")
async def websocket_stats():
    """
    Endpoint para obtener estadísticas de conexiones WebSocket
    """
    return {
        "total_connections": manager.get_total_connections(),
        "users_online": manager.get_users_online(),
        "connections_by_role": {
            role: len(conns) 
            for role, conns in manager.connections_by_role.items()
        }
    }
