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
        System.out.println("New connection in room " + roomId + " - " + session.getId());
    }

    @OnMessage
    public void onMessage(String message, @PathParam("roomId") String roomId, Session session) throws IOException {
        System.out.println("Received in room " + roomId + ": " + message);

        // Forward all video actions to other clients in the room
        // Format examples:
        // play:10.5       - Play at 10.5 seconds
        // pause:20.3      - Pause at 20.3 seconds
        // seek:30.0       - Seek to 30.0 seconds
        // buffer:true     - Buffering state change
        // end:0           - Video ended
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
        System.out.println("Connection closed in room " + roomId + " - " + session.getId());
    }

    @OnError
    public void onError(Session session, Throwable throwable) {
        System.err.println("Error in WebSocket: " + throwable.getMessage());
    }
}
