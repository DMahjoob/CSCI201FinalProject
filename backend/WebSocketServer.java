import java.io.IOException;
import java.util.HashMap;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;
import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;

@ServerEndpoint("/room/{roomId}")
public class WebSocketServer {
    private static HashMap<String, Set<Session>> roomSessions = new HashMap<>();
    
    @OnOpen
    public void onOpen(Session session, @PathParam("roomId") String roomId) {
        roomSessions.putIfAbsent(roomId, new CopyOnWriteArraySet<>());
        roomSessions.get(roomId).add(session);
        System.out.println("New video sync connection in room " + roomId + " - " + session.getId());
    }
    
    @OnMessage
    public void onMessage(String message, @PathParam("roomId") String roomId, Session session) throws IOException {
        System.out.println("Received video sync message in room " + roomId + ": " + message);
        
        // Message should be in format "action:videoTime" (e.g., "play:10.5")
        // Just forward it directly to all other clients in the room
        broadcastToRoom(roomId, message, session);
    }
    
    private void broadcastToRoom(String roomId, String message, Session sender) throws IOException {
        Set<Session> clients = roomSessions.getOrDefault(roomId, new CopyOnWriteArraySet<>());
        for (Session client : clients) {
            if (client.isOpen() && !client.equals(sender)) {
                client.getBasicRemote().sendText(message);
            }
        }
    }
    
    @OnClose
    public void onClose(Session session, @PathParam("roomId") String roomId) {
        Set<Session> roomClients = roomSessions.getOrDefault(roomId, new CopyOnWriteArraySet<>());
        roomClients.remove(session);
        if (roomClients.isEmpty()) {
            roomSessions.remove(roomId);
        }
        System.out.println("Video sync connection closed in room " + roomId + " - " + session.getId());
    }
    
    @OnError
    public void onError(Session session, Throwable throwable) {
        System.err.println("Error in Video Sync WebSocket: " + throwable.getMessage());
        throwable.printStackTrace();
    }
}
