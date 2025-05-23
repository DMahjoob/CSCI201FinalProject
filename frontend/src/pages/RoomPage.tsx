"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare, X, User } from "lucide-react"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"

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

type PlayerAction = 'play' | 'pause' | 'seek' | 'ready' | 'buffer' | 'end';

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
  const [user, setUser] = useState<{ id: string; username?: string; email: string; isGuest?: boolean }>()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  console.log("isPlaying: ", isPlaying);
  const [showChat, setShowChat] = useState(false)
  const [currentVideoTime, setCurrentVideoTime] = useState(0)
  const navigate = useNavigate()
  const isDesktop = useMediaQuery("(min-width: 768px)")
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YT.Player | null>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const videoWsRef = useRef<WebSocket | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)

  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url?.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  useEffect(() => {
    if (!id) {
      navigate("/")
      return
    }
    
    const storedUser = localStorage.getItem("user")
    let userData;
    
    if (storedUser) {
      userData = JSON.parse(storedUser)
      setUser(userData)
      setDisplayName(userData.username || userData.email?.split("@")[0] || `Guest ${userData.id.split('_')[1] || ''}`)
    } else {
      const guestId = `guest_${Math.floor(Math.random() * 10000)}`
      userData = {
        id: guestId,
        email: guestId,
        username: `Guest ${guestId.split('_')[1]}`,
        isGuest: true
      }
      setUser(userData)
      setDisplayName(`Guest ${guestId.split('_')[1]}`)
      
      localStorage.setItem("user", JSON.stringify(userData))
    }
    
    
        const fetchRoomInfo = async () => {
      try {
        const response = await fetch(`http://localhost:8080/CS201FP/JoinRoomServlet?roomCode=${id}&email=${userData.email}`, {
          method: 'POST',
        });
        
        if (!response.ok) {
          console.error(`Error fetching room info: ${response.status}`);
          navigate("/dashboard");
          return;
        }
        
        const data = await response.json();
        
        if (data.error) {
          console.error("Error fetching room info:", data.error);
          navigate("/dashboard");
          return;
        }
        
        const roomInfo: RoomInfo = {
          id: data.id,
          youtubeUrl: data.youtubeUrl,
          isHost: data.isHost
        };
        
        console.log("Room info fetched:", roomInfo);
        
        setRoomInfo(roomInfo);
        
        localStorage.setItem("currentRoom", JSON.stringify(roomInfo));
        
        const chatWs = new WebSocket(`ws://localhost:8080/CS201FP/chat/${id}`);
        
        chatWs.onopen = () => {
          console.log('Chat WebSocket connected to room:', id);
          wsRef.current = chatWs;

          const joinMessage = {
            type: 'chat',
            sender: displayName || userData.username || 'User',
            text: 'has joined the room',
            timestamp: Date.now(),
            userId: userData.id,
            roomId: id
          };
          chatWs.send(JSON.stringify(joinMessage));
        };

        chatWs.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log('Chat WebSocket message received:', data);

          if (data.type === 'chat_history') {
            try {
              const historyMessages = JSON.parse(data.messages);
              console.log('Received chat history:', historyMessages.length, 'messages');
              
              const formattedMessages = historyMessages.map((msg: any) => ({
                id: msg.id.toString(),
                sender: msg.sender,
                text: msg.text,
                timestamp: msg.timestamp
              }));
              
              setMessages(formattedMessages);
            } catch (error) {
              console.error('Error processing chat history:', error);
            }
          } else if (data.type === 'chat') {
            const newMessage: Message = {
              id: (data.dbMessageId || data.id || Date.now()).toString(),
              sender: data.sender || userData.username,
              text: data.text,
              timestamp: data.timestamp || Date.now()
            };

            console.log(data);
            
            setMessages(prev => {
              const messageExists = prev.some(msg => msg.id === newMessage.id);
              if (messageExists) {
                return prev;
              }
              return [...prev, newMessage];
            });
          } else if (data.type === 'video_update') {
            if (!roomInfo?.isHost && data.videoUrl) {
              console.log(`Received video update via WebSocket: ${data.videoUrl}`);
              
              setRoomInfo(prev => ({
                ...prev!,
                youtubeUrl: data.videoUrl
              }));
              
              const newMessage: Message = {
                id: Date.now().toString(),
                sender: 'System',
                text: 'Host has changed the video.',
                timestamp: Date.now()
              };
              setMessages(prev => [...prev, newMessage]);
            }
          }
        };

        chatWs.onerror = (error) => {
          console.error('Chat WebSocket error:', error);
        };

        chatWs.onclose = () => {
          console.log('Chat WebSocket connection closed');
        };
        
        const videoWs = new WebSocket(`ws://localhost:8080/CS201FP/room/${id}`);
        
        videoWs.onopen = () => {
          console.log('Video sync WebSocket connected to room:', id);
          videoWsRef.current = videoWs;
        };
        
        videoWs.onmessage = (event) => {
          console.log('Video sync message received:', event.data);
          
          const [action, videoTimeStr] = event.data.split(':');
          const videoTime = parseFloat(videoTimeStr);
          
          if (playerRef.current && !roomInfo?.isHost) {
            switch(action) {
              case 'play':
                playerRef.current.playVideo();
                setIsPlaying(true);
                if (!isNaN(videoTime)) {
                  playerRef.current.seekTo(videoTime, true);
                }
                break;
              case 'pause':
                playerRef.current.pauseVideo();
                setIsPlaying(false);
                break;
              case 'seek':
                if (!isNaN(videoTime)) {
                  playerRef.current.seekTo(videoTime, true);
                }
                break;
              case 'end':
                playerRef.current.stopVideo();
                setIsPlaying(false);
                break;
            }
          }
        };
        
        videoWs.onerror = (error) => {
          console.error('Video sync WebSocket error:', error);
        };
        
        videoWs.onclose = () => {
          console.log('Video sync WebSocket connection closed');
        };

        setMessages([
          {
            id: "1",
            sender: "System",
            text: "Welcome to the watch party!",
            timestamp: Date.now(),
          },
        ]);

        return () => {
          if (chatWs.readyState === WebSocket.OPEN) {
            const leaveMessage = {
              type: 'chat',
              sender: displayName || userData.username || 'User',
              text: 'has left the room',
              timestamp: Date.now(),
              userId: userData.id,
              roomId: id
            };
            chatWs.send(JSON.stringify(leaveMessage));
            chatWs.close();
          }
          
          if (videoWs.readyState === WebSocket.OPEN) {
            videoWs.close();
          }
        };
      } catch (error) {
        console.error("Failed to fetch room info or setup WebSocket:", error);
        navigate("/dashboard");
      }
    };
    
    fetchRoomInfo();
  }, [id, navigate]);

  const sendPlayerUpdate = async (update: PlayerStateUpdate) => {
    try {
      console.log('🔵 PLAYER UPDATE:', {
        action: update.action,
        videoTime: update.videoTime.toFixed(2),
        timestamp: new Date(update.timestamp).toLocaleTimeString(),
        userId: update.userId,
        roomId: update.roomId
      });
      
      if (!roomInfo?.isHost) {
        console.log('Non-host user tried to control video - ignoring');
        return;
      }
      
      if (videoWsRef.current && videoWsRef.current.readyState === WebSocket.OPEN) {
        const message = `${update.action}:${update.videoTime.toFixed(2)}`;
        videoWsRef.current.send(message);
        console.log('Sent video control message via WebSocket:', message);
      } else {
        console.error('Video sync WebSocket not connected, cannot send player update');
      }
      
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
      console.error('Failed to send player update:', error);
    }
  };

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
        controls: roomInfo.isHost ? 1 : 0,
        disablekb: roomInfo.isHost ? 0 : 1,
        playsinline: 1,
        modestbranding: 1,
        rel: 0,
        iv_load_policy: 3
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: (errorEvent) => {
          console.error("YouTube player error:", errorEvent.data);
        }
      }
    });
    
    if (!roomInfo.isHost && playerContainerRef.current) {
      setTimeout(() => {
        const container = playerContainerRef.current?.parentElement;
        if (container) {
          const overlay = document.createElement('div');
          overlay.style.position = 'absolute';
          overlay.style.top = '0';
          overlay.style.left = '0';
          overlay.style.width = '100%';
          overlay.style.height = '100%';
          overlay.style.zIndex = '10';
          overlay.style.background = 'transparent';
          overlay.style.cursor = 'not-allowed';
          
          overlay.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const message: Message = {
              id: Date.now().toString(),
              sender: 'System',
              text: 'Only the host can control the video playback.',
              timestamp: Date.now(),
            };
            setMessages(prev => [...prev, message]);
          });
          
          overlayRef.current = overlay;
          
          container.appendChild(overlay);
        }
      }, 1000);
    }
  };

  const onPlayerReady = (event: YT.PlayerEvent) => {
    console.log("Player ready event fired", event.target);
    
    if (!user || !roomInfo) return;
    
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
    if (!user || !roomInfo) return;
    
    const player = event.target;
    const videoTime = player.getCurrentTime();
    
    const stateMap: Record<number, string> = {
      [-1]: "UNSTARTED",
      [0]: "ENDED",
      [1]: "PLAYING",
      [2]: "PAUSED",
      [3]: "BUFFERING",
      [5]: "CUED",
    };
    
    console.log(`Player state changed to: ${stateMap[event.data] || event.data} at time: ${videoTime.toFixed(2)}`);
    
    if (!roomInfo.isHost) {
      setCurrentVideoTime(videoTime);
      return;
    }
    
    let action: PlayerAction | null = null;
    
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, showChat])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !roomInfo) return;

    console.log(`Sending chat message: ${newMessage}`);
    
    const messageObj = {
      type: 'chat',
      id: Date.now().toString(),
      sender: displayName,
      text: newMessage,
      timestamp: Date.now(),
      userId: user.id,
      roomId: roomInfo.id
    };
    
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(messageObj));
    } else {
      console.error('WebSocket not connected, cannot send message');
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'System',
        text: 'Connection issue: Message may not be delivered to other users',
        timestamp: Date.now()
      }]);
    }
    
    setNewMessage("");
  };

  const handleUpdateDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      alert("Display name cannot be empty.");
      return;
    }
    
    try {
      const response = await fetch("http://localhost:8080/CS201FP/ChangeUsernameServlet", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: user?.email || "",
          newUsername: displayName,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        console.log(`Updating display name: ${displayName}`);
        setUser((prev) => prev ? { ...prev, username: displayName } : prev);
      } else {
        alert(result.error || "Failed to update display name.");
      }
    } catch (error) {
      console.error("Error updating display name:", error);
      alert("Error updating display name. Please try again.");
    }
    
    const message: Message = {
      id: Date.now().toString(),
      sender: "System",
      text: `${user?.username || user?.email?.split("@")[0] || 'User'} changed their name to ${displayName}`,
      timestamp: Date.now(),
    };

    setMessages([...messages, message]);
  };

  const handleLeaveRoom = () => {
    console.log("Leaving room");
    localStorage.removeItem("currentRoom");
    navigate("/dashboard");
  };

  useEffect(() => {
    if (!roomInfo?.youtubeUrl) return;
    
    if (!window.YT) {
      console.log("Loading YouTube API...");
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
      
      window.onYouTubeIframeAPIReady = () => {
        console.log("YouTube API ready, initializing player...");
        initializePlayer();
      };
    } else {
      console.log("YouTube API already loaded");
      initializePlayer();
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      if (overlayRef.current && overlayRef.current.parentNode) {
        overlayRef.current.parentNode.removeChild(overlayRef.current);
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
        {!roomInfo.isHost && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 text-center text-xs">
            Only the host can control the video playback
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

  return (
    <div className="min-h-screen min-w-screen bg-black text-white flex flex-col">
      <header className="p-3 border-b border-zinc-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="font-bold">Room Code: {roomInfo?.id}</h1>
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
              variant="gray"
              className="h-8 border-zinc-700 text-white hover:bg-zinc-800"
            >
              <User size={14} className="mr-1" />
              Update
            </Button>
          </form>
            <Button
              onClick={() => setShowChat(!showChat)}
              className={showChat ? "bg-zinc-800 hover:bg-zinc-700" : "bg-red-600 hover:bg-red-700"}
            >
              <MessageSquare size={18} className="mr-2" />
              {showChat ? "Hide Chat" : "Show Chat"}
            </Button>
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
          <Drawer>
            <DrawerContent className="h-[80vh] bg-zinc-900 border-zinc-800 text-white">
              {renderChatPanel()}
            </DrawerContent>
          </Drawer>
      </div>
    </div>
  )
}
