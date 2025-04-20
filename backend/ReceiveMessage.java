import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.Socket;

public class ReceiveMessage extends Thread{
	private Socket s;
	private BufferedReader br;
	
	ReceiveMessage(Socket s){
		try {
			this.br = new BufferedReader(new InputStreamReader(s.getInputStream()));
			this.s = s;
		}catch (IOException ioe) {
			System.out.println("ioe in Message constructor: " + ioe.getMessage());
		}
	}
	
	@Override
	public void run() {
		String message;
		while(s.isConnected()) {
			try {
				message = br.readLine();
				System.out.println(message);
			}catch (IOException ioe) {
				break;
			}
		}
	}

}
