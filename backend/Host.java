public class Host extends User {
    
    // Data Member
    private boolean canCreateRoom;
   
    public Host(int id, String name) {
        super(id, name);  // Assuming User has a constructor User(String name)
        this.canCreateRoom = true;
    }
    
    // Functions

    /**
     * Opens a new room with a default name or ID.
     * Implementation could create a new Room object and assign this Host as its owner.
     */
    public void openRoom() {
        if (!canCreateRoom) {
            System.out.println("You do not have permission to create a room.");
            return;
        }
        
        // Example pseudo-logic:
        // Room room = new Room("default-room-id", this);
        // ...
        System.out.println("Room opened with a default name/ID.");
    }

    /**
     * Opens a new room with the specified name (or ID).
     */
    public void openRoom(String name) {
        if (!canCreateRoom) {
            System.out.println("You do not have permission to create a room.");
            return;
        }
        
        // Example pseudo-logic:
        // Room room = new Room(name, this);
        // ...
        System.out.println("Room opened with name: " + name);
    }

    /**
     * Renames the Host (or possibly something else, 
     * depending on your application's meaning of "rename").
     */
    public void rename(String name) {
        // If Host is a User, perhaps we change the host's name:
        setDisplayName(name);
        System.out.println("Host renamed to: " + getDisplayName());
    }

    /**
     * Closes an existing room. 
     * In practice, this might involve removing the Room from a list of active rooms,
     * or signaling to guests that the room is closed, etc.
     */
    public void closeRoom() {
        // Example pseudo-logic:
        // if the Host is currently associated with a Room, close it
        // room.close();  // Some method that handles cleanup, notifying guests, etc.
        System.out.println("Room has been closed.");
    }
    
    // Getter and Setter for canCreateRoom
    public boolean canCreateRoom() {
        return canCreateRoom;
    }

    public void setCanCreateRoom(boolean canCreateRoom) {
        this.canCreateRoom = canCreateRoom;
    }
}
