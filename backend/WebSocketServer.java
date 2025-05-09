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

        // Broadcast control commands (play, pause, skip) to all users in the room
        if (message.startsWith("control:")) {
            broadcastToRoom(roomId, message, session);
        }
    }

    private void broadcastToRoom(String roomId, String message, Session sender) throws IOException {
        for (Session client : roomSessions.get(roomId)) {
            if (client.isOpen() && !client.equals(sender)) {
                client.getBasicRemote().sendText(message);
            }
        }
    }

    @OnClose
    public void onClose(Session session, @PathParam("roomId") String roomId) {
        roomSessions.getOrDefault(roomId, Set.of()).remove(session);
        if (roomSessions.get(roomId).isEmpty()) {
            roomSessions.remove(roomId);
        }
        System.out.println("Connection closed in room " + roomId + " - " + session.getId());
    }

    @OnError
    public void onError(Session session, Throwable throwable) {
        System.err.println("Error: " + throwable.getMessage());
    }
}
