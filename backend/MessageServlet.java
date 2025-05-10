import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

@ServerEndpoint("/chat/{roomCode}")
public class MessageServlet {
    private static final Map<String, Set<Session>> roomSessions = new HashMap<>();
    private static final Gson gson = new Gson();
    
    private static final String DB_URL = "jdbc:mysql://localhost:3306/BingeBaddies";
    private static final String DB_USER = "root";
    private static final String DB_PASSWORD = "Shubhayan935";
    
    @OnOpen
    public void onOpen(Session session, @PathParam("roomCode") String roomCode) {
        // Add the session to the room
        roomSessions.putIfAbsent(roomCode, new CopyOnWriteArraySet<>());
        roomSessions.get(roomCode).add(session);
        
        System.out.println("New chat connection in room " + roomCode + " - Session ID: " + session.getId());
        
        // Send chat history to the new client
        sendChatHistory(session, roomCode);
    }
    
    @OnMessage
    public void onMessage(String message, Session session, @PathParam("roomCode") String roomCode) {
        System.out.println("Received chat message in room " + roomCode + ": " + message);
        
        try {
            // Parse the JSON message
            JsonObject jsonMessage = JsonParser.parseString(message).getAsJsonObject();
            
            // Extract message details
            String type = jsonMessage.has("type") ? jsonMessage.get("type").getAsString() : "";
            
            if ("chat".equals(type)) {
                String userId = jsonMessage.has("userId") ? jsonMessage.get("userId").getAsString() : "";
                String sender = jsonMessage.has("sender") ? jsonMessage.get("sender").getAsString() : "Unknown";
                String text = jsonMessage.has("text") ? jsonMessage.get("text").getAsString() : "";
//                long timestamp = jsonMessage.has("timestamp") ? jsonMessage.get("timestamp").getAsLong() : System.currentTimeMillis();
                
                System.out.println("Chat from " + sender + " (" + userId + "): " + text);
                
                // Save the message to the database
                int messageId = saveMessageToDatabase(roomCode, userId, text);
                
                // If successfully saved, add the message ID to the JSON
                if (messageId > 0) {
                    jsonMessage.addProperty("dbMessageId", messageId);
                }
                
                // Broadcast the message to all clients in the room
                broadcastToRoom(roomCode, jsonMessage.toString(), session);
            }
        } catch (Exception e) {
            System.err.println("Error processing chat message: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    @OnClose
    public void onClose(Session session, @PathParam("roomCode") String roomCode) {
        // Remove the session from the room
        Set<Session> roomClients = roomSessions.getOrDefault(roomCode, new CopyOnWriteArraySet<>());
        roomClients.remove(session);
        
        if (roomClients.isEmpty()) {
            roomSessions.remove(roomCode);
        }
        
        System.out.println("Chat connection closed in room " + roomCode + " - Session ID: " + session.getId());
    }
    
    @OnError
    public void onError(Session session, Throwable throwable) {
        System.err.println("Error in Chat WebSocket - Session ID: " + session.getId());
        throwable.printStackTrace();
    }
    
    private void sendChatHistory(Session session, String roomCode) {
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        
        try {
            // Get room_id from roomCode
            conn = getDbConnection();
            stmt = conn.prepareStatement(
                "SELECT m.message_id, m.message_text, m.user_id, u.username " +
                "FROM Messages m " +
                "JOIN Room r ON m.room_id = r.room_id " +
                "JOIN Users u ON m.user_id = u.user_id " +
                "WHERE r.roomCode = ? " +
                "LIMIT 50"
            );
            stmt.setString(1, roomCode);
            rs = stmt.executeQuery();
            
            // Build an array of chat messages
            StringBuilder jsonArray = new StringBuilder("[");
            boolean firstMessage = true;
            
            while (rs.next()) {
                if (!firstMessage) {
                    jsonArray.append(",");
                }
                
                JsonObject message = new JsonObject();
                message.addProperty("type", "chat");
                message.addProperty("id", rs.getInt("message_id"));
                message.addProperty("sender", rs.getString("username"));
                message.addProperty("text", rs.getString("message_text"));
                message.addProperty("userId", rs.getString("user_id"));
//                message.addProperty("timestamp", rs.getTimestamp("timestamp").getTime());
                
                jsonArray.append(message);
                firstMessage = false;
            }
            
            jsonArray.append("]");
            
            // Send the chat history to the client
            if (!firstMessage) { // Only send if we have messages
                JsonObject historyMessage = new JsonObject();
                historyMessage.addProperty("type", "chat_history");
                historyMessage.addProperty("messages", jsonArray.toString());
                
                session.getBasicRemote().sendText(historyMessage.toString());
            }
            
        } catch (Exception e) {
            System.err.println("Error sending chat history: " + e.getMessage());
            e.printStackTrace();
        } finally {
            closeResources(conn, stmt, rs);
        }
    }
    
    private int saveMessageToDatabase(String roomCode, String userId, String messageText) {
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        int messageId = -1;
        
        try {
            conn = getDbConnection();
            
            // Get room_id from roomCode
            stmt = conn.prepareStatement("SELECT room_id FROM Room WHERE roomCode = ?");
            stmt.setString(1, roomCode);
            rs = stmt.executeQuery();
            
            if (!rs.next()) {
                System.err.println("Room not found with code: " + roomCode);
                return -1;
            }
            
            int roomId = rs.getInt("room_id");
            closeResultSet(rs);
            closeStatement(stmt);
            
            // Get user_id (handle different formats)
            int numericUserId;
            try {
                // Try direct conversion for numeric user IDs
                numericUserId = Integer.parseInt(userId);
            } catch (NumberFormatException e) {
                // For guest users or string IDs
                stmt = conn.prepareStatement("SELECT user_id FROM Users WHERE user_id = ? OR username = ? OR email = ?");
                stmt.setString(1, userId);
                stmt.setString(2, userId);
                stmt.setString(3, userId);
                rs = stmt.executeQuery();
                
                if (!rs.next()) {
                    System.err.println("User not found with ID: " + userId);
                    return -1;
                }
                
                numericUserId = rs.getInt("user_id");
                closeResultSet(rs);
                closeStatement(stmt);
            }
            
            // Insert the message
            stmt = conn.prepareStatement(
                "INSERT INTO Messages (message_text, room_id, user_id) VALUES (?, ?, ?)",
                PreparedStatement.RETURN_GENERATED_KEYS
            );
            stmt.setString(1, messageText);
            stmt.setInt(2, roomId);
            stmt.setInt(3, numericUserId);
            
            int rowsAffected = stmt.executeUpdate();
            
            if (rowsAffected > 0) {
                rs = stmt.getGeneratedKeys();
                if (rs.next()) {
                    messageId = rs.getInt(1);
                    System.out.println("Message saved with ID: " + messageId);
                }
            }
            
        } catch (Exception e) {
            System.err.println("Error saving message to database: " + e.getMessage());
            e.printStackTrace();
        } finally {
            closeResources(conn, stmt, rs);
        }
        
        return messageId;
    }
    
    private void broadcastToRoom(String roomCode, String message, Session sender) {
        Set<Session> clients = roomSessions.getOrDefault(roomCode, new CopyOnWriteArraySet<>());
        
        for (Session client : clients) {
            try {
                if (client.isOpen() && !client.equals(sender)) {
                    client.getBasicRemote().sendText(message);
                }
            } catch (IOException e) {
                System.err.println("Error broadcasting message to client: " + e.getMessage());
            }
        }
    }
    
    private Connection getDbConnection() throws ClassNotFoundException, SQLException {
        Class.forName("com.mysql.cj.jdbc.Driver");
        return DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
    }
    
    private void closeResources(Connection conn, PreparedStatement stmt, ResultSet rs) {
        closeResultSet(rs);
        closeStatement(stmt);
        closeConnection(conn);
    }
    
    private void closeResultSet(ResultSet rs) {
        if (rs != null) {
            try {
                rs.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }
    
    private void closeStatement(PreparedStatement stmt) {
        if (stmt != null) {
            try {
                stmt.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }
    
    private void closeConnection(Connection conn) {
        if (conn != null) {
            try {
                conn.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }
}
