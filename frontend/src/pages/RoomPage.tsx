"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare, X, User, Play, Pause, SkipForward } from "lucide-react"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"

// Declare YouTube IFrame API types
declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

declare namespace YT {
  class Player {
    constructor(elementId: HTMLDivElement | string, options: PlayerOptions);
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    getCurrentTime(): number;
    getDuration(): number;
    getVideoUrl(): string;
    getPlayerState(): number;
    destroy(): void;
  }

  interface PlayerOptions {
    videoId?: string;
    width?: number;
    height?: number;
    playerVars?: PlayerVars;
    events?: Events;
  }

  interface PlayerVars {
    autoplay?: 0 | 1;
    cc_load_policy?: 0 | 1;
    color?: 'red' | 'white';
    controls?: 0 | 1 | 2;
    disablekb?: 0 | 1;
    enablejsapi?: 0 | 1;
    end?: number;
    fs?: 0 | 1;
    hl?: string;
    iv_load_policy?: 1 | 3;
    list?: string;
    listType?: 'playlist' | 'search' | 'user_uploads';
    loop?: 0 | 1;
    modestbranding?: 0 | 1;
    origin?: string;
    playlist?: string;
    playsinline?: 0 | 1;
    rel?: 0 | 1;
    start?: number;
    widget_referrer?: string;
  }

  interface Events {
    onReady?: (event: PlayerEvent) => void;
    onStateChange?: (event: OnStateChangeEvent) => void;
    onPlaybackQualityChange?: (event: PlaybackQualityEvent) => void;
    onPlaybackRateChange?: (event: PlaybackRateEvent) => void;
    onError?: (event: ErrorEvent) => void;
    onApiChange?: (event: ApiChangeEvent) => void;
  }

  interface PlayerEvent {
    target: Player;
  }

  interface OnStateChangeEvent {
    target: Player;
    data: number;
  }

  interface PlaybackQualityEvent {
    target: Player;
    data: string;
  }

  interface PlaybackRateEvent {
    target: Player;
    data: number;
  }

  interface ErrorEvent {
    target: Player;
    data: number;
  }

  interface ApiChangeEvent {
    target: Player;
  }

  enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5
  }
}

// Define player action types
type PlayerAction = 'play' | 'pause' | 'seek' | 'ready' | 'buffer' | 'end';

// Define player state update interface
interface PlayerStateUpdate {
  action: PlayerAction;
  timestamp: number;
  videoTime: number;
  userId: string;
  roomId: string;
}

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

interface RoomInfo {
  id: string;
  youtubeUrl?: string;
  isHost: boolean;
}

export default function RoomPage() {
  const { id } = useParams<{ id: string }>()
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null)
  const [user, setUser] = useState<{ id: string; username?: string; email: string }>()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [currentVideoTime, setCurrentVideoTime] = useState(0)
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YT.Player | null>(null)
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const playerContainerRef = useRef<HTMLDivElement>(null)

  // YouTube video ID extraction function
  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url?.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  useEffect(() => {
    // Check if user is authenticated
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      navigate("/login")
      return
    }

    const userData = JSON.parse(storedUser)
    setUser(userData)
    setDisplayName(userData.username || userData.email.split("@")[0])

    // Get room info
    const storedRoom = localStorage.getItem("currentRoom")
    if (!storedRoom) {
      navigate("/dashboard")
      return
    }

    const roomData = JSON.parse(storedRoom)
    if (roomData.id !== id) {
      navigate("/dashboard")
      return
    }

    setRoomInfo(roomData)

    // Add some sample messages
    setMessages([
      {
        id: "1",
        sender: "System",
        text: "Welcome to the watch party!",
        timestamp: Date.now(),
      },
    ])

    // Cleanup function
    return () => {
      // In a real app, you would disconnect from any real-time services here
    }
  }, [id, navigate])

  // Send player update to backend
  const sendPlayerUpdate = async (update: PlayerStateUpdate) => {
    try {
      console.log('🔵 PLAYER UPDATE:', {
        action: update.action,
        videoTime: update.videoTime.toFixed(2),
        timestamp: new Date(update.timestamp).toLocaleTimeString(),
        userId: update.userId,
        roomId: update.roomId
      });
      
      // In a real implementation, you would send this to your backend
      // Example using fetch:
      /*
      console.log('Sending API request to backend...');
      const response = await fetch('/api/player-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(update),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send player update');
      }
      console.log('API response received:', response.status);
      */
      
      // For now, just add a system message to demonstrate
      if (update.action !== 'buffer') {
        const actionText: Record<PlayerAction, string> = {
          play: 'started playing',
          pause: 'paused',
          seek: `jumped to ${Math.floor(update.videoTime / 60)}:${Math.floor(update.videoTime % 60).toString().padStart(2, '0')}`,
          end: 'finished the video',
          ready: 'loaded the video',
          buffer: 'buffering video'
        };
        
        const message: Message = {
          id: Date.now().toString(),
          sender: 'System',
          text: `${displayName} ${actionText[update.action]}`,
          timestamp: Date.now(),
        };
        
        console.log(`Adding system message for action: ${update.action}`);
        setMessages(prev => [...prev, message]);
      }
    } catch (error) {
      console.error('❌ Error sending player update:', error);
    }
  };

  // Initialize YouTube player
  const initializePlayer = () => {
    if (!roomInfo?.youtubeUrl || !playerContainerRef.current) {
      console.log("Cannot initialize player: missing URL or container");
      return;
    }
    
    const videoId = getYouTubeVideoId(roomInfo.youtubeUrl);
    if (!videoId) {
      console.log("Cannot initialize player: invalid YouTube URL");
      return;
    }

    console.log(`Initializing YouTube player with video ID: ${videoId}`);
    
    playerRef.current = new window.YT.Player(playerContainerRef.current, {
      videoId: videoId,
      playerVars: {
        // Only show controls if user is host
        controls: roomInfo.isHost ? 1 : 0,
        // Disable keyboard shortcuts for guests to prevent space bar play/pause
        disablekb: roomInfo.isHost ? 0 : 1,
        // Prevent users from clicking directly on video to play/pause if not host
        playsinline: 1,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: (errorEvent) => {
          console.error("YouTube player error:", errorEvent.data);
        }
      }
    });
  };

  // Player event handlers
  const onPlayerReady = (event: YT.PlayerEvent) => {
    console.log("Player ready event fired", event.target);
    
    if (!user || !roomInfo) return;
    
    // Send player ready event to backend
    const playerUpdate: PlayerStateUpdate = {
      action: 'ready',
      timestamp: Date.now(),
      videoTime: 0,
      userId: user.id,
      roomId: roomInfo.id || '',
    };
    sendPlayerUpdate(playerUpdate);
  };

  const onPlayerStateChange = (event: YT.OnStateChangeEvent) => {
    // YT.PlayerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering)
    if (!user || !roomInfo) return;
    
    const player = event.target;
    const videoTime = player.getCurrentTime();
    
    // Map YT.PlayerState to string for logging
    const stateMap: Record<number, string> = {
      [-1]: "UNSTARTED",
      [0]: "ENDED",
      [1]: "PLAYING",
      [2]: "PAUSED",
      [3]: "BUFFERING",
      [5]: "CUED",
    };
    
    console.log(`Player state changed to: ${stateMap[event.data] || event.data} at time: ${videoTime.toFixed(2)}`);
    
    let action: PlayerAction | null = null;
    
    // If user is not host, they shouldn't be able to control the video
    // This is a safety check in case they somehow bypass the UI restrictions
    if (!roomInfo.isHost) {
      // Update current time but don't process any actions
      setCurrentVideoTime(videoTime);
      return;
    }
    
    // Check for seeking (significant time jump while buffering or transitioning)
    // This happens when the user drags the progress bar
    if (Math.abs(videoTime - currentVideoTime) > 2) {
      console.log(`Seek detected: ${currentVideoTime.toFixed(2)} -> ${videoTime.toFixed(2)}`);
      
      const seekUpdate: PlayerStateUpdate = {
        action: 'seek',
        timestamp: Date.now(),
        videoTime: videoTime,
        userId: user.id,
        roomId: roomInfo.id || '',
      };
      
      sendPlayerUpdate(seekUpdate);
    }
    
    switch(event.data) {
      case YT.PlayerState.PLAYING:
        action = 'play';
        setIsPlaying(true);
        break;
      case YT.PlayerState.PAUSED:
        action = 'pause';
        setIsPlaying(false);
        break;
      case YT.PlayerState.BUFFERING:
        action = 'buffer';
        break;
      case YT.PlayerState.ENDED:
        action = 'end';
        setIsPlaying(false);
        break;
      default:
        console.log(`No action defined for player state: ${event.data}`);
        break;
    }
    
    // Update current video time after processing events
    setCurrentVideoTime(videoTime);
    
    if (action && roomInfo.isHost) {
      console.log(`Processing player action: ${action}`);
      
      const playerUpdate: PlayerStateUpdate = {
        action,
        timestamp: Date.now(),
        videoTime,
        userId: user.id,
        roomId: roomInfo.id || '',
      };
      sendPlayerUpdate(playerUpdate);
    }
  };

  // We now handle seeking detection directly in the onPlayerStateChange event
  // and through direct player events rather than polling

  useEffect(() => {
    // Scroll to bottom of messages
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, showChat])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    console.log(`Sending chat message: ${newMessage}`);
    
    const message: Message = {
      id: Date.now().toString(),
      sender: displayName,
      text: newMessage,
      timestamp: Date.now(),
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

  const handleUpdateDisplayName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    console.log(`Updating display name: ${displayName}`);
    
    // Add system message about name change
    const message: Message = {
      id: Date.now().toString(),
      sender: "System",
      text: `${user?.username || user?.email?.split("@")[0] || 'User'} changed their name to ${displayName}`,
      timestamp: Date.now(),
    };

    setMessages([...messages, message]);
  };

  const handlePlayPause = () => {
    if (!playerRef.current || !roomInfo) {
      console.log("Cannot play/pause: player not initialized or room info missing");
      return;
    }
    
    // Only the host can control video playback
    if (!roomInfo.isHost) {
      console.log("Cannot play/pause: user is not the host");
      return;
    }
    
    console.log(`Manual play/pause triggered by host. Current state: ${isPlaying ? 'playing' : 'paused'}`);
    
    if (isPlaying) {
      console.log("Pausing video via UI controls");
      playerRef.current.pauseVideo();
    } else {
      console.log("Playing video via UI controls");
      playerRef.current.playVideo();
    }
    // Player state change will trigger the update to backend
  };

  const handleSkipForward = () => {
    if (!playerRef.current || !user || !roomInfo) {
      console.log("Cannot skip forward: player not initialized or user/room info missing");
      return;
    }
    
    // Only the host can control video playback
    if (!roomInfo.isHost) {
      console.log("Cannot skip forward: user is not the host");
      return;
    }
    
    const currentTime = playerRef.current.getCurrentTime();
    console.log(`Host skipping forward 10 seconds from ${currentTime.toFixed(2)}`);
    
    playerRef.current.seekTo(currentTime + 10, true);
    
    // Manually send seek event
    const playerUpdate: PlayerStateUpdate = {
      action: 'seek',
      timestamp: Date.now(),
      videoTime: currentTime + 10,
      userId: user.id,
      roomId: roomInfo.id || '',
    };
    sendPlayerUpdate(playerUpdate);
  };

  const handleLeaveRoom = () => {
    console.log("Leaving room");
    localStorage.removeItem("currentRoom");
    navigate("/dashboard");
  };

  // Load YouTube API in useEffect hook
  useEffect(() => {
    if (!window.YT) {
      console.log("Loading YouTube API...");
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
    } else {
      console.log("YouTube API already loaded");
      initializePlayer();
    }

    // Initialize player when API is ready
    window.onYouTubeIframeAPIReady = () => {
      console.log("YouTube API ready, initializing player...");
      initializePlayer();
    };

    // Cleanup function
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      window.onYouTubeIframeAPIReady = () => {};
    };
  }, [roomInfo?.youtubeUrl]);

  if (!user || !roomInfo) {
    return <div className="flex min-h-screen items-center justify-center bg-black">Loading...</div>
  }



  const renderVideoPlayer = () => {
    const videoId = roomInfo?.youtubeUrl ? getYouTubeVideoId(roomInfo.youtubeUrl) : null;
    
    return (
      <div className="relative w-full h-full bg-zinc-800 flex items-center justify-center">
        {videoId ? (
          <div ref={playerContainerRef} className="w-full h-full"></div>
        ) : (
          <div className="text-center p-4">
            <p className="text-xl font-bold">VIDEO</p>
            <p className="text-sm text-zinc-400 mt-2">Waiting for host to start a video...</p>
          </div>
        )}

        {roomInfo?.isHost && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black/70 p-2 rounded-full">
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full text-white hover:bg-zinc-700"
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full text-white hover:bg-zinc-700"
              onClick={handleSkipForward}
            >
              <SkipForward size={20} />
            </Button>
          </div>
        )}
      </div>
    );
  }

  const renderChatPanel = () => (
    <div className="flex flex-col h-full bg-zinc-900">
      <div className="p-3 border-b border-zinc-800 flex justify-between items-center">
        <h3 className="font-medium">Chat</h3>
        {!isDesktop && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowChat(false)}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X size={18} />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message) => (
          <div key={message.id} className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium">{message.sender}</span>
              <span className="text-xs text-zinc-500">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <p className="text-zinc-300">{message.text}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-800">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white"
          />
          <Button type="submit" className="bg-red-600 hover:bg-red-700">
            Send
          </Button>
        </div>
      </form>
    </div>
  )

  if (!user || !roomInfo) {
    return <div className="flex min-h-screen items-center justify-center bg-black">Loading...</div>
  }

  return (
    <div className="min-h-screen min-w-screen bg-black text-white flex flex-col">
      <header className="p-3 border-b border-zinc-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="font-bold">Room: {roomInfo?.id}</h1>
          <span className="text-xs bg-zinc-800 px-2 py-1 rounded">{roomInfo?.isHost ? "Host" : "Guest"}</span>
        </div>

        <div className="flex items-center gap-2">
          <form onSubmit={handleUpdateDisplayName} className="flex gap-2">
            <Input
              type="text"
              placeholder="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-32 h-8 bg-zinc-800 border-zinc-700 text-white text-sm"
            />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="h-8 border-zinc-700 text-white hover:bg-zinc-800"
            >
              <User size={14} className="mr-1" />
              Update
            </Button>
          </form>

          <Button size="sm" variant="destructive" onClick={handleLeaveRoom} className="h-8">
            Leave
          </Button>
        </div>
      </header>

      <main className="flex-1 flex">
        {isDesktop ? (
          <>
            <div className="flex-1 h-[calc(100vh-64px)]">{renderVideoPlayer()}</div>
            {showChat && <div className="w-80 border-l border-zinc-800 h-[calc(100vh-64px)]">{renderChatPanel()}</div>}
          </>
        ) : (
          <div className="flex-1 h-[calc(100vh-64px)]">{renderVideoPlayer()}</div>
        )}
      </main>

      <div className="fixed bottom-4 right-4 z-10">
        {isDesktop ? (
          <Button
            onClick={() => setShowChat(!showChat)}
            className={showChat ? "bg-red-600 hover:bg-red-700" : "bg-zinc-800 hover:bg-zinc-700"}
          >
            <MessageSquare size={18} className="mr-2" />
            {showChat ? "Hide Chat" : "Show Chat"}
          </Button>
        ) : (
          <Drawer>
            <DrawerTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700 rounded-full h-12 w-12 p-0">
                <MessageSquare size={20} />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[80vh] bg-zinc-900 border-zinc-800 text-white">
              {renderChatPanel()}
            </DrawerContent>
          </Drawer>
        )}
      </div>
    </div>
  )
}