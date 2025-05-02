import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.Socket;
import java.util.Random;
import java.util.Scanner;

public class User2 { 
	// Data Members
	private Socket s;
	private BufferedReader br;
	private BufferedWriter bw;
	private int userID = -1;
	private String displayName = "Guest#" + userID;
	
	public User2(int id, String n, Socket s) {
		try {
			this.br = new BufferedReader(new InputStreamReader(s.getInputStream()));
			this.bw = new BufferedWriter(new OutputStreamWriter(s.getOutputStream()));
			this.s = s;
			ReceiveMessage receive = new ReceiveMessage(s);
			receive.start();
		} catch (IOException e) {
			try {
				br.close();
				bw.close();
				s.close();
			} catch (IOException e1) {
				e1.printStackTrace();
			}
			e.printStackTrace();
		}
		
		userID = id;
		displayName = n;
	}
	// UserID should not be changed by an object
	private void setUserID(int id) {
		userID = id;
	}
	
	// Functions available to all instances
	public int getUseriD() {
		return userID;
	}
	
	public String getDisplayName() {
		return displayName;
	}
	
	public void setDisplayName(String n) {
		displayName = n;
	}
	
	public void sendMessage() {
		try {
			bw.write(displayName);
			bw.newLine();
			bw.flush();		
			Scanner sc = new Scanner(System.in);
			while(s.isConnected()) {
				String message = sc.nextLine();
				bw.write(displayName + ": " + message);
				bw.newLine();
				bw.flush();
			}
			sc.close();
		}catch (IOException ioe) {
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
	
	public static void main(String [] args) throws IOException{
		//for now I just randomly create name for the user
		Random rand = new Random();
		int random = rand.nextInt(1000);
		String str = Integer.toString(random);
		Socket s = new Socket("localhost", 1023);
		User2 user = new User2(random, str, s);
		user.sendMessage();
	}
}
