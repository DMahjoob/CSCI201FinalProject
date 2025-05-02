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

@WebServlet("/Register")
public class RegisterServlet extends HttpServlet {
    
	protected void doPost(HttpServletRequest request, HttpServletResponse response) 
		throws ServletException, IOException {

		response.setContentType("application/json");
	    PrintWriter out = response.getWriter();
	    Gson gson = new Gson();

	    // Read JSON from request body and convert to map
	    BufferedReader br = request.getReader();
	    Map<String, String> userInfo = gson.fromJson(br, Map.class);
	
	    // Get parameters
	    String email = userInfo.get("email");
	    String fullName = userInfo.get("username");
	    String password = userInfo.get("password");
    
	    // Set variables to null initially
	    Connection conn = null;
	    PreparedStatement stmt = null;
	    PreparedStatement insertStmt = null;
	    ResultSet rs = null;
	    try {
	    	// Create connection
	    	Class.forName("com.mysql.cj.jdbc.Driver");
		    conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/artistsdb?user=root&password=Rayquaza10!");
	
	        // Check if email already exists
	        stmt = conn.prepareStatement("SELECT * FROM Users WHERE email = ?");
	        stmt.setString(1, email);
	        rs = stmt.executeQuery();
	        
	        // Check for invalid already existing user
	        if (rs.next()) {
	        	Map<String, String> existingUser = new HashMap<>();
			    existingUser.put("status", "invalid");
			    existingUser.put("message", "User with this email already exists.");
			    out.print(gson.toJson(existingUser));
		    } else {
		        // Insert user into database
		        insertStmt = conn.prepareStatement(
		          "INSERT INTO Users (fullname, email, password) VALUES (?, ?, ?)"
		        );
		        insertStmt.setString(1, fullName);
		        insertStmt.setString(2, email);
		        insertStmt.setString(3, password);
		        insertStmt.executeUpdate();
		        Map<String, String> success = new HashMap<>();
		        success.put("status", "success");
		        success.put("message", "Registration successful");
		        out.print(gson.toJson(success));
		    }
	        conn.close();
	    } catch (Exception e) {
	    	e.printStackTrace();
	    	// Check for any errors
		    Map<String, String> error = new HashMap<>();
		    error.put("status", "error");
		    error.put("message", "Error during registration..." + e.getMessage());
		    out.print(gson.toJson(error));
	    }
	    out.flush();
	}
}
