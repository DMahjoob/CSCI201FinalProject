import java.io.BufferedReader;
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
import com.google.gson.Gson;
import java.util.Map;
import java.util.HashMap;

@WebServlet("/Login")
public class LoginServlet extends HttpServlet {
	
	protected void doPost(HttpServletRequest request, HttpServletResponse response)
        throws ServletException, IOException {

	    response.setContentType("application/json");
	    PrintWriter out = response.getWriter();
	    Gson gson = new Gson();

	    // Parse JSON from frontend
	    BufferedReader br = request.getReader();
	    Map<String, String> data = gson.fromJson(br, Map.class);
	
	    String email = data.get("email");
	    String password = data.get("password");
	
	    Connection conn = null;
		PreparedStatement stmt = null;
		ResultSet rs = null;
    
		try {
			// Create connection
			Class.forName("com.mysql.cj.jdbc.Driver");
			conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/artistsdb?user=root&password=Rayquaza10!");
	
	
			stmt = conn.prepareStatement("SELECT * FROM Users WHERE email = ? AND password = ?");
			stmt.setString(1, email);
			stmt.setString(2, password); 
	
			rs = stmt.executeQuery();
			// Check for valid login info
			if (rs.next()) {
				Map<String, String> success = new HashMap<>();
		        success.put("status", "success");
		        success.put("message", "Login successful");
		        out.print(gson.toJson(success));
			} 
			// Invalid email or password?
			else {
				stmt = conn.prepareStatement("SELECT * FROM Users WHERE email = ?");
				stmt.setString(1, email);
		
				rs = stmt.executeQuery();
				// Valid email, invalid password
				if(rs.next()) {
					Map<String, String> incorrect = new HashMap<>();
			        incorrect.put("status", "incorrect");
			        incorrect.put("message", "Password or email is incorrect.");
			        out.print(gson.toJson(incorrect));
				}
				// Invalid email
				else {
					Map<String, String> invalid = new HashMap<>();
			        invalid.put("status", "invalid");
			        invalid.put("message", "Email must be valid");
			        out.print(gson.toJson(invalid));
				}
			}
	
			conn.close();
		// Catch exceptions
		} catch (Exception e) {
			e.printStackTrace();
			Map<String, String> error = new HashMap<>();
	        error.put("status", "error");
	        error.put("message", "Server error: " + e.getMessage());
	        out.print(gson.toJson(error));
		}
		out.flush();
	}
}
