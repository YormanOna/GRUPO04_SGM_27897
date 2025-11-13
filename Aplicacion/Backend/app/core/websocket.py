"""
Módulo de WebSocket para notificaciones en tiempo real
Permite:
- Llamadas de pacientes a consulta
- Actualización de estado de citas
- Notificaciones de recetas listas
- Alertas del sistema
"""
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
from datetime import datetime

class ConnectionManager:
    """Gestiona las conexiones WebSocket activas"""
    
    def __init__(self):
        # Diccionario de conexiones: user_id -> List[WebSocket]
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Conexiones por rol
        self.connections_by_role: Dict[str, List[WebSocket]] = {
            "Administrador": [],
            "Medico": [],
            "Enfermera": [],
            "Farmaceutico": []
        }
    
    async def connect(self, websocket: WebSocket, user_id: int, user_role: str):
        """Conecta un nuevo cliente WebSocket"""
        await websocket.accept()
        
        # Agregar a conexiones por usuario
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        
        # Agregar a conexiones por rol
        if user_role in self.connections_by_role:
            self.connections_by_role[user_role].append(websocket)
        
        print(f"✅ Usuario {user_id} ({user_role}) conectado. Total conexiones: {self.get_total_connections()}")
    
    def disconnect(self, websocket: WebSocket, user_id: int, user_role: str):
        """Desconecta un cliente WebSocket"""
        # Remover de conexiones por usuario
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        
        # Remover de conexiones por rol
        if user_role in self.connections_by_role:
            if websocket in self.connections_by_role[user_role]:
                self.connections_by_role[user_role].remove(websocket)
        
        print(f"❌ Usuario {user_id} ({user_role}) desconectado. Total conexiones: {self.get_total_connections()}")
    
    async def send_personal_message(self, message: dict, user_id: int):
        """Envía un mensaje a un usuario específico"""
        if user_id in self.active_connections:
            message["timestamp"] = datetime.utcnow().isoformat()
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error enviando mensaje a usuario {user_id}: {e}")
    
    async def send_to_role(self, message: dict, role: str):
        """Envía un mensaje a todos los usuarios de un rol específico"""
        if role in self.connections_by_role:
            message["timestamp"] = datetime.utcnow().isoformat()
            disconnected = []
            for connection in self.connections_by_role[role]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error enviando mensaje a rol {role}: {e}")
                    disconnected.append(connection)
            
            # Limpiar conexiones muertas
            for conn in disconnected:
                if conn in self.connections_by_role[role]:
                    self.connections_by_role[role].remove(conn)
    
    async def broadcast(self, message: dict):
        """Envía un mensaje a todos los usuarios conectados"""
        message["timestamp"] = datetime.utcnow().isoformat()
        for user_id, connections in self.active_connections.items():
            for connection in connections:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error en broadcast a usuario {user_id}: {e}")
    
    def get_total_connections(self) -> int:
        """Retorna el total de conexiones activas"""
        return sum(len(conns) for conns in self.active_connections.values())
    
    def get_users_online(self) -> List[int]:
        """Retorna lista de IDs de usuarios conectados"""
        return list(self.active_connections.keys())


# Instancia global del gestor de conexiones
manager = ConnectionManager()


# Funciones helper para enviar notificaciones específicas

async def notificar_llamada_paciente(paciente_id: int, paciente_nombre: str, medico_id: int, sala: str):
    """
    Notifica a un paciente que es llamado a consulta
    """
    await manager.send_personal_message({
        "type": "llamada_paciente",
        "title": "Es su turno",
        "message": f"El Dr. lo está esperando en {sala}",
        "data": {
            "paciente_id": paciente_id,
            "medico_id": medico_id,
            "sala": sala
        }
    }, paciente_id)


async def notificar_cita_actualizada(cita_id: int, paciente_id: int, nuevo_estado: str, mensaje: str):
    """
    Notifica cambios en el estado de una cita
    """
    await manager.send_personal_message({
        "type": "cita_actualizada",
        "title": "Actualización de cita",
        "message": mensaje,
        "data": {
            "cita_id": cita_id,
            "nuevo_estado": nuevo_estado
        }
    }, paciente_id)


async def notificar_receta_lista(paciente_id: int, receta_id: int):
    """
    Notifica que una receta está lista para recoger
    """
    await manager.send_personal_message({
        "type": "receta_lista",
        "title": "Receta lista",
        "message": "Su receta está lista en farmacia",
        "data": {
            "receta_id": receta_id
        }
    }, paciente_id)


async def notificar_medicos(titulo: str, mensaje: str, data: dict = None):
    """
    Envía notificación a todos los médicos
    """
    await manager.send_to_role({
        "type": "notificacion_medico",
        "title": titulo,
        "message": mensaje,
        "data": data or {}
    }, "Medico")


async def notificar_farmaceuticos(titulo: str, mensaje: str, data: dict = None):
    """
    Envía notificación a todos los farmacéuticos
    """
    await manager.send_to_role({
        "type": "notificacion_farmacia",
        "title": titulo,
        "message": mensaje,
        "data": data or {}
    }, "Farmaceutico")
