import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import com.google.gson.Gson;
import com.google.gson.annotations.SerializedName;

@WebServlet("/JoinRoomServlet")
public class JoinRoomServlet extends HttpServlet {
    private static final long serialVersionUID = 101L;

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String email = request.getParameter("email");
        String roomCode = request.getParameter("roomCode");
        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        String user_id = null;
        
        // Set response type to JSON
        response.setContentType("application/json");
        Gson gson = new Gson();
        
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
            
            // Query for room info
            ps = conn.prepareStatement("SELECT roomCode, video_link, user_id, active_users FROM Room WHERE roomCode = ?");
            ps.setString(1, roomCode);
            rs = ps.executeQuery();
            
            if(rs.next()) {
                String active_users = rs.getString("active_users");
                String video_link = rs.getString("video_link");
                String host_user_id = rs.getString("user_id"); // the room creator
                
                // Update active users
                active_users = (active_users == null || active_users.isEmpty()) 
                    ? user_id 
                    : active_users + "," + user_id;
                
                ps.close();
                ps = conn.prepareStatement("UPDATE Room SET active_users = ? WHERE roomCode = ?");
                ps.setString(1, active_users);
                ps.setString(2, roomCode);
                ps.executeUpdate();
                
                // Create RoomInfo object
                RoomInfo roomInfo = new RoomInfo();
                roomInfo.setId(roomCode);
                roomInfo.setYoutubeUrl(video_link);
                roomInfo.setHost(host_user_id.equals(user_id)); // Check if user is the host
                
                System.out.println("Host User ID: " + host_user_id);
                System.out.println("Current User ID: " + user_id);
                System.out.println("Is Host: " + roomInfo.isHost());
                
                // Return success with room info
                response.getWriter().write(gson.toJson(roomInfo));
            } else {
                // Room not found
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                response.getWriter().write(gson.toJson(new ErrorResponse("Room not found")));
            }
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
    
    // Inner class for RoomInfo
    class RoomInfo {
        private String id;
        private String youtubeUrl;
        
        @SerializedName("isHost")
        private boolean isHost;
        
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
