import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet("/room")
public class RoomServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        PrintWriter out = response.getWriter();

        String roomId = request.getParameter("roomId");

        if (roomId == null || roomId.trim().isEmpty()) {
            out.print("{\"status\":\"error\",\"message\":\"Room ID is required\"}");
            return;
        }
                
        try (Connection conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/BingeBaddies?user=root&password=Rayquaza10!");
            PreparedStatement stmt = conn.prepareStatement("SELECT * FROM Rooms WHERE room_id = ?")) {

            stmt.setString(1, roomId);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                out.print("{\"status\":\"success\",\"message\":\"Room exists\"}");
            } else {
                out.print("{\"status\":\"error\",\"message\":\"Room not found\"}");
            }

        } catch (Exception e) {
            e.printStackTrace();
            out.print("{\"status\":\"error\",\"message\":\"Server error: " + e.getMessage() + "\"}");
        }

        out.flush();
    }
}
