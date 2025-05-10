import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Random;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import com.google.gson.Gson;
import com.google.gson.annotations.SerializedName;

@WebServlet("/RoomCreationServlet")
public class RoomCreationServlet extends HttpServlet {
    private static final long serialVersionUID = 100L;

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        // Get email instead of user_id
        String email = request.getParameter("email");
        String roomName = request.getParameter("roomName");
        String video_link = request.getParameter("video_link");
        
        response.setContentType("application/json");
        Gson gson = new Gson();

        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        String user_id = null;

        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/BingeBaddies?user=root&password=Shubhayan935");

            // Handle guest users
            if (email != null && email.startsWith("guest_")) {
                // This is a guest user, extract the guest ID
                String guestId = email;
                
                // Check if guest user already exists
                ps = conn.prepareStatement("SELECT user_id FROM Users WHERE email = ?");
                ps.setString(1, guestId);
                rs = ps.executeQuery();
                
                if (!rs.next()) {
                    // Guest user doesn't exist, create one
                    rs.close();
                    ps.close();
                    
                    // Extract number for username
                    String guestNumber = guestId.substring(6); // Remove "guest_" prefix
                    
                    // Insert new guest user
                    ps = conn.prepareStatement("INSERT INTO Users (fullName, email, password) VALUES (?, ?, ?)");
                    ps.setString(1, "Guest " + guestNumber);
                    ps.setString(2, guestId);
                    ps.setString(3, "guest_password"); // Dummy password for guests
                    ps.executeUpdate();
                    
                    // Get the newly created user_id
                    ps.close();
                    ps = conn.prepareStatement("SELECT user_id FROM Users WHERE email = ?");
                    ps.setString(1, guestId);
                    rs = ps.executeQuery();
                    rs.next(); // Should always have a result after insert
                }
                
                // Get the user_id
                user_id = rs.getString("user_id");
                
                // Close resources
                rs.close();
                ps.close();
            } else {
                // Regular user, look up by email
                ps = conn.prepareStatement("SELECT user_id FROM Users WHERE email = ?");
                ps.setString(1, email);
                rs = ps.executeQuery();
                
                if (!rs.next()) {
                    // User not found
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    response.getWriter().write(gson.toJson(new ErrorResponse("User not found with email: " + email)));
                    return;
                }
                
                // Get the user_id from the result
                user_id = rs.getString("user_id");
                
                // Close resources
                rs.close();
                ps.close();
            }
            
            String active_users = user_id;
            
            // Generate a unique room code
            String roomCode = generateRoomCode(conn);

            // Insert the new room
            ps = conn.prepareStatement("INSERT INTO Room (user_id, roomName, video_link, roomCode, active_users) VALUES (?, ?, ?, ?, ?)");
            ps.setString(1, user_id);
            ps.setString(2, roomName);
            ps.setString(3, video_link);
            ps.setString(4, roomCode);
            ps.setString(5, active_users);
            ps.executeUpdate();

            RoomInfo roomInfo = new RoomInfo();
            roomInfo.setId(roomCode);
            roomInfo.setYoutubeUrl(video_link);
            roomInfo.setHost(true);

            response.getWriter().write(gson.toJson(roomInfo));

        } catch (ClassNotFoundException | SQLException e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write(gson.toJson(new ErrorResponse("Server error: " + e.getMessage())));
        } finally {
            try {
                if(rs != null) rs.close();
                if(ps != null) ps.close();
                if(conn != null) conn.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }

    // Function to generate a unique 6-character room code
    private String generateRoomCode(Connection conn) throws SQLException {
        String roomCode;
        Random random = new Random();
        String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        int TOKEN_LENGTH = 6;

        do {
            StringBuilder token = new StringBuilder(TOKEN_LENGTH);
            for (int i = 0; i < TOKEN_LENGTH; i++) {
                int index = random.nextInt(CHARACTERS.length());
                token.append(CHARACTERS.charAt(index));
            }
            roomCode = token.toString();
        } while (roomExists(roomCode, conn));

        return roomCode;
    }

    private boolean roomExists(String roomCode, Connection conn) throws SQLException {
        PreparedStatement ps = null;
        ResultSet rs = null;
        try {
            ps = conn.prepareStatement("SELECT roomCode FROM Room WHERE roomCode = ?");
            ps.setString(1, roomCode);
            rs = ps.executeQuery();
            return rs.next();
        } finally {
            if(rs != null) rs.close();
            if(ps != null) ps.close();
        }
    }

    // Inner class for RoomInfo
    class RoomInfo {
        private String id;
        private String youtubeUrl;
        
        @SerializedName("isHost")
        private boolean isHost = true;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getYoutubeUrl() { return youtubeUrl; }
        public void setYoutubeUrl(String youtubeUrl) { this.youtubeUrl = youtubeUrl; }

        public boolean isHost() { return isHost; }
        public void setHost(boolean isHost) { this.isHost = isHost; }
    }

    // Inner class for error responses
    class ErrorResponse {
        private String error;

        public ErrorResponse(String error) {
            this.error = error;
        }

        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }
}
