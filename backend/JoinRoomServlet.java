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

@WebServlet("/JoinRoomServlet")
public class JoinRoomServlet extends HttpServlet{
	private static final long serialVersionUID = 101L;

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String user_id = request.getParameter("user_id");
		String roomCode = request.getParameter("roomCode");
		Connection conn = null;
        PreparedStatement ps = null;
		ResultSet rs = null;
		String active_users = null;
		try {
			Class.forName("com.mysql.cj.jdbc.Driver");
			conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/BingeBaddies?user=root&password=Rayquaza10!");
			ps = conn.prepareStatement("Select active_users FROM Room WHERE roomCode = ?");
            ps.setString(1, roomCode);
            rs = ps.executeQuery();
            if(rs.next()) {
            	active_users = rs.getString("active_users");
            }
            else {
            	response.setContentType("text/plain");
    			response.getWriter().write("false");
    			return;
            }
            active_users += "," + user_id;
            ps.close();
            ps = conn.prepareStatement("UPDATE Room SET active_users = ? WHERE roomCode = ?");
            ps.setString(1, active_users);
            ps.setString(2, roomCode);
            ps.executeUpdate();
		} catch (ClassNotFoundException e) {
			e.printStackTrace();
		} catch (SQLException e) {
			e.printStackTrace();
		} finally {
			try {
				if(rs != null) {
					rs.close();
				}
				if(ps != null) {
					ps.close();
				}
				if(conn != null) {
					conn.close();
				}
			} catch (SQLException e) {
				e.printStackTrace();
			}
		}
	}
}