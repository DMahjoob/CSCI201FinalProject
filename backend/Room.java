import java.util.ArrayList;

public class Room {
    
    // Data Members
    private String roomID;
    private User host;
    private ArrayList<User> guests;
    private ArrayList<String> playlist;
    private final int capacity = 10;

    // Constructor(s)
    public Room(String roomID, User host) {
        this.roomID = roomID;
        this.guests = new ArrayList<>();
        this.playlist = new ArrayList<>();
    }
       
    /**
     * Select a video by URL and add it to the playlist.
     * (Implementation may require searching or creating a new Video object)
     */
    public void selectVideo(String url) {
        // TODO: find or create a Video object by URL, then add to playlist
        // Example:
        // Video video = new Video(url);
        // playlist.add(video);
    }
    
    /**
     * Play the current video.
     */
    public void playVideo() {
        // TODO: Implementation depends on how you're controlling playback
        // Example:
        // if (!playlist.isEmpty()) {
        //     playlist.get(0).play();
        // }
    }
    
    /**
     * Pause the current video.
     */
    public void pauseVideo() {
        // TODO: Implementation depends on how you're controlling playback
        // Example:
        // if (!playlist.isEmpty()) {
        //     playlist.get(0).pause();
        // }
    }
    
    /**
     * Skip to the next video in the playlist.
     */
    public void skipVideo() {
        // TODO: Implementation depends on how you want to handle skipping
        // Example:
        // if (playlist.size() > 1) {
        //     playlist.remove(0);
        //     playVideo();
        // }
    }
    
    /**
     * Sends a chat message from a User.
     *
     * @param user The user who sends the message
     * @param message The chat message
     */
    public void chat(User user, String message) {
        // TODO: Implementation depends on how you handle chats
        // Example:
        // System.out.println(user.getName() + ": " + message);
    }
    
    /**
     * Checks whether the room is considered empty
     * (e.g., no guests and no host assigned).
     *
     * @return true if empty, false otherwise
     */
    public boolean isEmpty() {
        // A simple rule might be:
        return (host == null && (guests == null || guests.isEmpty()));
    }
    
    // Getters and Setters (optional)
    
    public String getRoomID() {
        return roomID;
    }
    
    public void setRoomID(String roomID) {
        this.roomID = roomID;
    }
    
    public User getHost() {
        return host;
    }
    
    public void setHost(User host) {
        this.host = host;
    }
    
    public ArrayList<User> getGuests() {
        return guests;
    }
    
    public ArrayList<String> getPlaylist() {
        return playlist;
    }
    
    public int getCapacity() {
        return capacity;
    }
}
