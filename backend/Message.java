import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.Socket;
import java.util.ArrayList;

public class Message implements Runnable{

	public static ArrayList<Message> group = new ArrayList<>();
	private Socket s;
	private BufferedReader br;
	private BufferedWriter bw;
	String name;
	
	public Message(Socket s) {
		try {
			this.br = new BufferedReader(new InputStreamReader(s.getInputStream()));
			this.bw = new BufferedWriter(new OutputStreamWriter(s.getOutputStream()));
			this.name = br.readLine();
			this.s = s;
			group.add(this);
			sendMessage(name + " enters the room.");
		}catch (IOException ioe) {
			System.out.println("ioe in Message constructor: " + ioe.getMessage());
		}
	}
	
	public void sendMessage(String message) {
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
	@Override
	public void run() {
		String message;
		while(s.isConnected()) {
			try {
				message = br.readLine();
				sendMessage(message);
			}catch (IOException ioe) {
				group.remove(this);
				try {
					br.close();
					bw.close();
					s.close();
					sendMessage(name + " leave the room");
					break;
				} catch (IOException e) {
					break;
					
				}
			}
		}
	}
}
