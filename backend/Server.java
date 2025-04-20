import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;

public class Server {
	public Server(int port) {
		try {
			ServerSocket ss = new ServerSocket(port);
			while(!ss.isClosed()) {		
				Socket s = ss.accept();
				System.out.println("One user connected.");
				
				Message message = new Message(s);
				Thread thread = new Thread(message);
				thread.start();
			}
			ss.close();
		} catch (IOException ioe) {
			System.out.println("ioe in Server constructor: " + ioe.getMessage());
		}
	}
	
	public static void main(String [] args) {
		new Server(1023);
	}
	
}
