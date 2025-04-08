
public class User { 
	// Data Members
	private int userID = -1;
	private String displayName = "Guest#" + userID;
	
	public User(int id, String n) {
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
}
