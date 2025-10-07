import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';
// Assuming these stores exist and are correctly implemented:
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { useCallStore } from '../store/useCallStore'; 
import { toast } from 'react-hot-toast'; 

const VideoCall = ({ isIncoming = false, caller, onEnd, callType = 'video' }) => {
	// State Management
	const [isCallActive, setIsCallActive] = useState(false);
	const [isMuted, setIsMuted] = useState(false);
	const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
	const [callDuration, setCallDuration] = useState(0);
	const [connectionStatus, setConnectionStatus] = useState('initializing'); // Start with a more specific status

	// Refs for DOM and WebRTC objects
	const localVideoRef = useRef(null);
	const remoteVideoRef = useRef(null);
	const peerConnectionRef = useRef(null);
	const localStreamRef = useRef(null);
	const callTimerRef = useRef(null);

	// Zustand Store Access
	const { authUser, socket } = useAuthStore();
	const { selectedUser } = useChatStore();
	// Destructure actions and state from useCallStore
	const { activeCall, endCall: storeEndCall, setCallStatus, incomingCall } = useCallStore();

	// Determine the peer's ID and the call ID
	// Use incomingCall data if available and it's an incoming call, otherwise use selectedUser
	const remoteUserId = isIncoming ? (caller?._id || incomingCall?.caller._id) : selectedUser?._id;
	const currentCallId = activeCall?.callId || incomingCall?.callId;

	// Determine display user (the person we're calling/are called by)
	const displayUser = isIncoming ? (caller || incomingCall?.caller) : selectedUser;

	// Helper for formatting time
	const formatCallDuration = (seconds) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	};

	// **Cleanup Function (Centralized logic)**
	const cleanup = useCallback(() => {
		if (localStreamRef.current) {
			localStreamRef.current.getTracks().forEach(track => track.stop());
		}

		if (peerConnectionRef.current) {
			peerConnectionRef.current.close();
			peerConnectionRef.current = null;
		}

		if (callTimerRef.current) {
			clearInterval(callTimerRef.current);
			callTimerRef.current = null;
		}

		setIsCallActive(false);
		setCallDuration(0);
		setConnectionStatus('ended');

		// Notify the global state that the call is physically over
		storeEndCall(currentCallId, remoteUserId);

		// Run the parent's onEnd callback
		onEnd?.();
	}, [currentCallId, remoteUserId, storeEndCall, onEnd]);

	// **Media and PeerConnection Initialization**
	const initializeCall = async () => {
		if (!remoteUserId || !socket) return false;

		try {
			const constraints = {
				// Initialize video based on callType prop, ensuring audio is always true
				video: callType === 'video', 
				audio: true
			};

			const localStream = await navigator.mediaDevices.getUserMedia(constraints);
			localStreamRef.current = localStream;

			// Display local video/audio feed
			if (localVideoRef.current) {
				localVideoRef.current.srcObject = localStream;
			}

			// Initialize peer connection with STUN servers
			const peerConnection = new RTCPeerConnection({
				iceServers: [
					{ urls: 'stun:stun.l.google.com:19302' },
					{ urls: 'stun:stun1.l.google.com:19302' }
				]
			});

			peerConnectionRef.current = peerConnection;

			// Add local tracks to the peer connection
			localStream.getTracks().forEach(track => {
				peerConnection.addTrack(track, localStream);
			});

			// **WebRTC Event Handlers**

			// 1. Handle remote track (audio/video from the other peer)
			peerConnection.ontrack = (event) => {
				console.log('Received remote track');
				// Check if the remote stream has been attached to the video element
				if (remoteVideoRef.current && event.streams[0]) {
					// IMPORTANT: The remote video/audio will start playing here
					remoteVideoRef.current.srcObject = event.streams[0];
				}
			};

			// 2. Handle ICE Candidates (Crucial for connectivity/sound)
			peerConnection.onicecandidate = (event) => {
				if (event.candidate) {
					console.log('Sending ICE candidate to signaling server');
					// Send candidate to the remote peer via the signaling server
					socket.emit("iceCandidate", {
						targetId: remoteUserId,
						candidate: event.candidate,
						callId: currentCallId
					});
				}
			};

			// 3. Handle connection state changes (Crucial for starting timer/call)
			peerConnection.onconnectionstatechange = () => {
				const status = peerConnection.connectionState;
				setConnectionStatus(status);
				setCallStatus(status); // Update global store

				if (status === 'connected') {
					// **FIX FOR TIMER:** The call is officially "active" and the timer starts ONLY when the WebRTC connection is established.
					setIsCallActive(true); 
					toast.success('Call connected!');
				} else if (status === 'failed' || status === 'closed' || status === 'disconnected') {
					// End the call if the connection is lost/fails
					if (isCallActive || status === 'failed') {
						toast.error(status === 'failed' ? 'Connection failed.' : 'Call interrupted.');
						cleanup();
					}
				}
			};

			return true;
		} catch (error) {
			console.error('Error initializing call:', error);
			toast.error('Could not access camera/microphone. Check permissions.');
			cleanup(); // Clean up if media access fails
			return false;
		}
	};

	// **Caller Logic: Create and Send Offer**
	const startCall = async () => {
		const success = await initializeCall();
		if (success) {
			setConnectionStatus('connecting');

			try {
				const pc = peerConnectionRef.current;
				const offer = await pc.createOffer();
				await pc.setLocalDescription(offer);

				// Send the SDP Offer via Socket.IO
				socket.emit("offer", {
					receiverId: remoteUserId,
					offer,
					callId: currentCallId
				});
			} catch (error) {
				console.error("Error creating/sending offer:", error);
				cleanup();
			}
		}
	};

	// **Callee Logic: Answer Call**
	const answerCall = async () => {
		const success = await initializeCall();
		if (success) {
			setConnectionStatus('connecting');
			
			// The rest of the SDP exchange (setRemoteDescription, createAnswer, setLocalDescription, sendAnswer) 
			// will be handled by the 'offer' listener in the useEffect below when the offer arrives.
			
			// Notify the signaling server that the call is answered
			// This typically triggers the caller to receive the 'answer' from the callee's socket.io instance
			useCallStore.getState().answerCall(currentCallId, remoteUserId);

			// isCallActive will be set by onconnectionstatechange
		} else {
			// If initialization fails (e.g., no camera access), reject the call
			useCallStore.getState().rejectCall(currentCallId, remoteUserId);
		}
	};

	// **Call End Handler**
	const handleEndCall = () => {
		// Emit signal to remote peer and run local cleanup
		socket.emit("endCall", {
			callId: currentCallId,
			participantId: remoteUserId // The peer who is getting the "endCall" event
		});
		cleanup();
	};

	// **Toggle Functions**
	const toggleMute = () => {
		if (localStreamRef.current) {
			const audioTrack = localStreamRef.current.getAudioTracks()[0];
			if (audioTrack) {
				audioTrack.enabled = !audioTrack.enabled;
				setIsMuted(!audioTrack.enabled);
			}
		}
	};

	const toggleVideo = () => {
		if (localStreamRef.current) {
			const videoTrack = localStreamRef.current.getVideoTracks()[0];
			if (videoTrack) {
				videoTrack.enabled = !videoTrack.enabled;
				setIsVideoOff(!videoTrack.enabled);
			}
		}
	};

	// ----------------------------------------------------
	// **USE EFFECTS**
	// ----------------------------------------------------

	// 1. Timer Effect
	useEffect(() => {
		if (isCallActive) {
			callTimerRef.current = setInterval(() => {
				setCallDuration(prev => prev + 1);
			}, 1000);
		} else if (callTimerRef.current) {
			clearInterval(callTimerRef.current);
			callTimerRef.current = null;
		}

		return () => {
			if (callTimerRef.current) {
				clearInterval(callTimerRef.current);
			}
		};
	}, [isCallActive]); // Only runs the timer when the call is actually active ('connected')

	// 2. Call Start/Cleanup Effect (Initial mount)
	useEffect(() => {
		// Auto-start call when component mounts (for outgoing calls)
		if (!isIncoming) {
			startCall(); 
		}

		// Cleanup on unmount
		return () => {
			cleanup();
		};
	}, [isIncoming, cleanup]);


	// 3. **WebRTC Signaling Listener Effect (The Core Fix for connectivity/sound)**
	useEffect(() => {
		if (!socket || !remoteUserId) return;

		// 3a. Handle incoming SDP Offer (Callee's part)
		const handleOffer = async ({ offer, callId, from }) => {
			// Ensure we are the intended recipient and PC is initialized (which happens when answering)
			if (from === authUser._id || !isIncoming || callId !== currentCallId || !peerConnectionRef.current) return;

			console.log("Received Offer, setting remote description...");
			const pc = peerConnectionRef.current;

			try {
				await pc.setRemoteDescription(new RTCSessionDescription(offer));

				// 4. Create and send Answer
				const answer = await pc.createAnswer();
				await pc.setLocalDescription(answer);

				console.log("Sending Answer back.");
				socket.emit("answer", {
					callerId: from,
					answer,
					callId
				});
			} catch (e) {
				console.error("Error handling offer/sending answer:", e);
			}
		};

		// 3b. Handle incoming SDP Answer (Caller's part)
		const handleAnswer = async ({ answer, callId, from }) => {
			// Ensure we are the intended recipient (the original caller)
			if (from === authUser._id || isIncoming || callId !== currentCallId || !peerConnectionRef.current) return;

			console.log("Received Answer, setting remote description...");
			try {
				await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
				// Connection establishment process now fully underway (ICE exchange follows)
			} catch (e) {
				console.error("Error handling answer:", e);
			}
		};

		// 3c. Handle incoming ICE Candidate
		const handleIceCandidate = ({ candidate, callId, from }) => {
			if (from === authUser._id || callId !== currentCallId || !peerConnectionRef.current) return;

			if (candidate) {
				console.log("Received ICE candidate, adding...");
				try {
					// RTCIceCandidate is used to create the object from the received data
					peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
				} catch (e) {
					console.error("Error adding received ICE candidate:", e);
				}
			}
		};

		// 3d. Handle Call Ended by Remote Peer
		const handleRemoteCallEnded = ({ endedBy }) => {
			// Only run cleanup if the event didn't originate from this user's socket (for double-check)
			if (endedBy !== authUser._id) { 
				console.log("Remote peer ended the call.");
				// toast.info("Call ended by the other user.");
				console.log("Call ended by the other user. --> Toast Suppressed")
				cleanup();
			}
		};

		socket.on("offer", handleOffer);
		socket.on("answer", handleAnswer);
		socket.on("iceCandidate", handleIceCandidate);
		socket.on("callEnded", handleRemoteCallEnded);

		return () => {
			socket.off("offer", handleOffer);
			socket.off("answer", handleAnswer);
			socket.off("iceCandidate", handleIceCandidate);
			socket.off("callEnded", handleRemoteCallEnded);
		};
	}, [socket, remoteUserId, currentCallId, isIncoming, authUser?._id, cleanup, setCallStatus]);

	// ----------------------------------------------------
	// **JSX/Rendering**
	// ----------------------------------------------------

	// Incoming Call UI (before answering)
	if (isIncoming && !isCallActive && incomingCall) {
		return (
			<div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
				<div className="bg-base-100 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
					<div className="mb-6">
						<div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden">
							<img
								src={displayUser?.profilePic || '/avatar.png'}
								alt={displayUser?.fullName}
								className="w-full h-full object-cover"
							/>
						</div>
						<h3 className="text-xl font-semibold mb-2">
							{displayUser?.fullName} is calling...
						</h3>
						<p className="text-base-content/60 capitalize">
							{incomingCall.callType} call
						</p>
					</div>

					<div className="flex justify-center gap-4">
						<button
							onClick={() => useCallStore.getState().rejectCall(currentCallId, remoteUserId)}
							className="btn btn-circle btn-error btn-lg"
							title="Decline call"
						>
							<PhoneOff className="w-6 h-6" />
						</button>
						<button
							onClick={answerCall}
							className="btn btn-circle btn-success btn-lg"
							title="Answer call"
						>
							<Phone className="w-6 h-6" />
						</button>
					</div>
				</div>
			</div>
		);
	}
	
	// Active Call UI
	return (
		<div className="fixed inset-0 bg-black z-50 flex flex-col">
			{/* Header */}
			<div className="bg-black/50 p-4 flex items-center justify-between text-white">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-full overflow-hidden">
						<img
							src={displayUser?.profilePic || '/avatar.png'}
							alt={displayUser?.fullName}
							className="w-full h-full object-cover"
						/>
					</div>
					<div>
						<h3 className="font-medium">{displayUser?.fullName}</h3>
						<p className="text-sm opacity-75 capitalize">
							{/* Connection Status & Duration Display */}
							{connectionStatus === 'connected' ? formatCallDuration(callDuration) :
							connectionStatus === 'failed' || connectionStatus === 'closed' || connectionStatus === 'ended' ? 'Call Ended' :
							connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)} {/* Capitalize first letter */}
						</p>
					</div>
				</div>
			</div>

			{/* Video area */}
			<div className="flex-1 relative">
				{/* Remote video (other person's video) */}
				<video
					ref={remoteVideoRef}
					autoPlay
					playsInline
					className="w-full h-full object-cover"
				/>

				{/* Local video (your video) */}
				{!isVideoOff && (
					<div className="absolute top-4 right-4 w-32 h-24 bg-black rounded-lg overflow-hidden z-10">
						<video
							ref={localVideoRef}
							autoPlay
							playsInline
							muted // Mute local video to prevent echo
							className="w-full h-full object-cover"
						/>
					</div>
				)}

				{/* No video placeholder (for audio calls or when remote video is off) */}
				{isVideoOff && (
					<div className="absolute inset-0 flex items-center justify-center bg-gray-800">
						<div className="text-center text-white">
							<div className="w-24 h-24 rounded-full bg-gray-600 flex items-center justify-center mx-auto mb-4">
								<span className="text-2xl font-semibold">
									{displayUser?.fullName?.[0]?.toUpperCase()}
								</span>
							</div>
							<p className="text-lg">{displayUser?.fullName}</p>
						</div>
					</div>
				)}
			</div>

			{/* Controls */}
			<div className="bg-black/50 p-6">
				<div className="flex justify-center gap-4">
					<button
						onClick={toggleMute}
						className={`btn btn-circle btn-lg ${isMuted ? 'btn-error' : 'btn-neutral'}`}
						title={isMuted ? 'Unmute' : 'Mute'}
					>
						{isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
					</button>

					{/* Only show video toggle if it was a video call initially or video is currently enabled */}
					{(callType === 'video' || !isVideoOff) && ( 
						<button
							onClick={toggleVideo}
							className={`btn btn-circle btn-lg ${isVideoOff ? 'btn-error' : 'btn-neutral'}`}
							title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
						>
							{isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
						</button>
					)}

					<button
						onClick={handleEndCall}
						className="btn btn-circle btn-error btn-lg"
						title="End call"
					>
						<PhoneOff className="w-6 h-6" />
					</button>
				</div>
			</div>
		</div>
	);
};

// **MISSING COMPONENT - Call initiation buttons component**
export const CallButtons = ({ onCall, className = "" }) => {
	return (
		<div className={`flex gap-2 ${className}`}>
			<button
				onClick={() => onCall('audio')}
				className="btn btn-circle btn-sm btn-primary"
				title="Voice call"
			>
				<Phone className="w-4 h-4" />
			</button>
			<button
				onClick={() => onCall('video')}
				className="btn btn-circle btn-sm btn-primary"
				title="Video call"
			>
				<Video className="w-4 h-4" />
			</button>
		</div>
	);
};

export default VideoCall;