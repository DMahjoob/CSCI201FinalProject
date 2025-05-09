import java.util.Vector;
import javax.websocket.*;
import javax.websocket.server.ServerEndpoint;

@ServerEndpoint(value = "/ws")
public class WebSocket {
	private static Vector<Session> sessionVector = new Vector<Session>();
	
	@OnOpen
	public void open(Session session) {
		System.out.println("Room created!");
		sessionVector.add(session);
	}
	
	@OnMessage
	public void OnMessage(String message, Session session) {
		System.out.println(message);
		for(Session s : sessionVector) {
			s.getAsyncRemote().sendText(message);
		}
	}
	
	@OnClose
	public void close(Session session) {
		System.out.println("Room Removed!");
		sessionVector.remove(session);
	}
	
	@OnError
	public void error(Throwable error) {
		System.out.println("Error!");
	}
}
