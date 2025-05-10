import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet("/ChangeUsernameServlet")
public class ChangeUsernameServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        PrintWriter out = response.getWriter();

        String email = request.getParameter("email");
        String newUsername = request.getParameter("newUsername");
        System.out.println("email: " + email);
        System.out.println("newUsername: " + newUsername);
        if (email == null || newUsername == null || email.trim().isEmpty() || newUsername.trim().isEmpty()) {
            out.print("{\"status\":\"error\",\"message\":\"Invalid input\"}");
            return;
        }

        try (Connection conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/BingeBaddies?user=root&password=Shubhayan935");
             PreparedStatement stmt = conn.prepareStatement("UPDATE Users SET username = ? WHERE email = ?")) {

            stmt.setString(1, newUsername);
            stmt.setString(2, email);
            int updated = stmt.executeUpdate();

            if (updated > 0) {
                out.print("{\"status\":\"success\",\"message\":\"Username updated successfully\"}");
            } else {
                out.print("{\"status\":\"error\",\"message\":\"User not found\"}");
            }

        } catch (Exception e) {
            e.printStackTrace();
            out.print("{\"status\":\"error\",\"message\":\"Server error: " + e.getMessage() + "\"}");
        }

        out.flush();
    }
}
