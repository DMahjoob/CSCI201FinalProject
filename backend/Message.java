import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.Socket;
import java.util.ArrayList;
import java.sql.*;

public class Message implements Runnable{

	public static ArrayList<Message> group = new ArrayList<>();

	private static final String JDBC_URL      = "jdbc:mysql://localhost/BingeBaddies?useSSL=false&serverTimezone=UTC";
	private static final String JDBC_USER     = "root";
	private static final String JDBC_PASSWORD = "Rayquaza10!";

	static {
		try {
			Class.forName("com.mysql.cj.jdbc.Driver");
		} catch (ClassNotFoundException e) {
			System.err.println("MySQL Driver not found: " + e.getMessage());
		}
	}
	private Socket s;
	private BufferedReader br;
	private BufferedWriter bw;
	String name;

	private final int userId;

	private final int roomId;
	
	public Message(Socket s, int userId, int roomId) {
		try {
			this.br = new BufferedReader(new InputStreamReader(s.getInputStream()));
			this.bw = new BufferedWriter(new OutputStreamWriter(s.getOutputStream()));
			this.name = br.readLine();
			this.s = s;
			this.userId = userId;
			this.roomId = roomId;
			group.add(this);
			sendMessage(name + " enters the room.");
		}catch (IOException ioe) {
			System.out.println("ioe in Message constructor: " + ioe.getMessage());
		}
	}
	
	public void sendMessage(String message) {
		saveMessageToDB(message);
		try {
			for(int i = 0; i < group.size(); i++) {
				if(!name.equals(group.get(i).name)) {
					group.get(i).bw.write(message);
					group.get(i).bw.newLine();
					group.get(i).bw.flush();
				}
			}
		}catch (IOException ioe) {
			group.remove(this);
			try {
				br.close();
				bw.close();
				s.close();
			} catch (IOException e) {
				e.printStackTrace();
			}
			System.out.println("ioe in sendMessage(): " + ioe.getMessage());
		}
	}

	private void saveMessageToDB(String messageText) {
		String sql = "INSERT INTO Messages (message_text, room_id, user_id) VALUES (?, ?, ?)";
		try (Connection conn = DriverManager.getConnection(JDBC_URL, JDBC_USER, JDBC_PASSWORD);
			 PreparedStatement ps = conn.prepareStatement(sql)) {
			ps.setString(1, messageText);
			ps.setInt(2, roomId);
			ps.setInt(3, userId);
			ps.executeUpdate();
		} catch (SQLException sqle) {
			System.err.println("Failed to save message to DB: " + sqle.getMessage());
		}
	}

	private void cleanup() {
		try {
			br.close();
			bw.close();
			socket.close();
		} catch (IOException e) {
		}
	}
	@Override
	public void run() {
		String message;
		while (s.isConnected()) {
			try {
				message = br.readLine();
				if (message == null) break;

				saveMessageToDB(message);

				sendMessage(message);

			} catch (IOException ioe) {
				break;
			}
		}

		group.remove(this);

		String leaveNotice = name + " leave the room";
		saveMessageToDB(leaveNotice);
		sendMessage(leaveNotice);

		try {
			br.close();
			bw.close();
			s.close();
		} catch (IOException e) {
		}
	}

}
